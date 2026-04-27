const db = require('../database/db');
const logger = require('./logger');

class RecurringPayrollService {
  /**
   * Create a new recurring payroll schedule
   */
  async createSchedule(employerId, data) {
    const {
      schedule_name,
      frequency,
      day_of_week,
      day_of_month,
      start_date,
      end_date,
      auto_run = true,
      include_all_employees = true,
      employees = [] // Array of {employee_id, override_salary}
    } = data;

    // Calculate first run date
    const nextRunAt = this.calculateNextRunDate(
      frequency,
      new Date(start_date),
      day_of_week,
      day_of_month
    );

    // Create schedule
    const result = await db.query(
      `INSERT INTO recurring_payroll_schedules (
        employer_id, schedule_name, frequency, day_of_week, day_of_month,
        start_date, end_date, auto_run, include_all_employees, next_run_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        employerId,
        schedule_name,
        frequency,
        day_of_week || null,
        day_of_month || null,
        start_date,
        end_date || null,
        auto_run,
        include_all_employees,
        nextRunAt
      ]
    );

    const schedule = result.rows[0];

    // Add specific employees if not including all
    if (!include_all_employees && employees.length > 0) {
      for (const emp of employees) {
        await db.query(
          `INSERT INTO recurring_payroll_employees (schedule_id, employee_id, override_salary)
           VALUES ($1, $2, $3)`,
          [schedule.id, emp.employee_id, emp.override_salary || null]
        );
      }
    }

    logger.info(`Recurring schedule created: ${schedule_name}`, {
      schedule_id: schedule.id,
      employer_id: employerId,
      frequency
    });

    return schedule;
  }

  /**
   * Get all schedules for an employer
   */
  async getSchedules(employerId, { active_only = false } = {}) {
    const query = `
      SELECT 
        s.*,
        COUNT(DISTINCT re.employee_id) as employee_count,
        COALESCE(SUM(
          CASE 
            WHEN re.override_salary IS NOT NULL THEN re.override_salary 
            ELSE e.salary 
          END
        ), 0) as total_payroll_amount
      FROM recurring_payroll_schedules s
      LEFT JOIN recurring_payroll_employees re ON s.id = re.schedule_id AND re.is_active = TRUE
      LEFT JOIN employees e ON re.employee_id = e.id
      WHERE s.employer_id = $1
        ${active_only ? 'AND s.is_active = TRUE' : ''}
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `;

    const result = await db.query(query, [employerId]);
    return result.rows;
  }

  /**
   * Get schedule details
   */
  async getSchedule(scheduleId, employerId) {
    const result = await db.query(
      `SELECT * FROM recurring_payroll_schedules 
       WHERE id = $1 AND employer_id = $2`,
      [scheduleId, employerId]
    );

    if (result.rows.length === 0) {
      throw new Error('Schedule not found');
    }

    const schedule = result.rows[0];

    // Get employees in this schedule
    const empResult = await db.query(
      `SELECT 
        re.*,
        e.stellar_address,
        e.salary as default_salary
       FROM recurring_payroll_employees re
       JOIN employees e ON re.employee_id = e.id
       WHERE re.schedule_id = $1 AND re.is_active = TRUE`,
      [scheduleId]
    );

    schedule.employees = empResult.rows;

    // Get run history
    const runResult = await db.query(
      `SELECT * FROM recurring_payroll_runs 
       WHERE schedule_id = $1 
       ORDER BY scheduled_at DESC 
       LIMIT 10`,
      [scheduleId]
    );

    schedule.run_history = runResult.rows;

    return schedule;
  }

  /**
   * Update schedule
   */
  async updateSchedule(scheduleId, employerId, updates) {
    const allowed_fields = [
      'schedule_name', 'frequency', 'day_of_week', 'day_of_month',
      'end_date', 'auto_run', 'include_all_employees', 'is_active'
    ];

    const fields = [];
    const values = [];
    let idx = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowed_fields.includes(key)) {
        fields.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
      }
    }

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    // Recalculate next_run_at if frequency or day changed
    if (updates.frequency || updates.day_of_week || updates.day_of_month) {
      const schedule = await this.getSchedule(scheduleId, employerId);
      const nextRunAt = this.calculateNextRunDate(
        updates.frequency || schedule.frequency,
        new Date(),
        updates.day_of_week || schedule.day_of_week,
        updates.day_of_month || schedule.day_of_month
      );
      fields.push(`next_run_at = $${idx}`);
      values.push(nextRunAt);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(scheduleId, employerId);

    const result = await db.query(
      `UPDATE recurring_payroll_schedules 
       SET ${fields.join(', ')} 
       WHERE id = $${idx} AND employer_id = $${idx + 1} 
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('Schedule not found');
    }

    return result.rows[0];
  }

  /**
   * Pause/resume schedule
   */
  async toggleSchedule(scheduleId, employerId, is_active) {
    const result = await db.query(
      `UPDATE recurring_payroll_schedules 
       SET is_active = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 AND employer_id = $3 
       RETURNING *`,
      [is_active, scheduleId, employerId]
    );

    if (result.rows.length === 0) {
      throw new Error('Schedule not found');
    }

    return result.rows[0];
  }

  /**
   * Manually trigger a schedule run
   */
  async triggerRun(scheduleId, employerId) {
    const schedule = await this.getSchedule(scheduleId, employerId);

    if (!schedule.is_active) {
      throw new Error('Schedule is not active');
    }

    // Create payroll period
    const periodResult = await db.query(
      `INSERT INTO payroll_periods (employer_id, period_number, total_amount, is_recurring, schedule_id)
       VALUES ($1, $2, $3, TRUE, $4) RETURNING *`,
      [employerId, Date.now(), 0, scheduleId]
    );

    const period = periodResult.rows[0];

    // Add employees to period
    let totalAmount = 0;
    const employees = schedule.include_all_employees
      ? await this.getAllEmployees(employerId)
      : await this.getScheduleEmployees(scheduleId);

    for (const emp of employees) {
      const salary = emp.override_salary || emp.salary;
      await db.query(
        `INSERT INTO payroll_claims (employee_id, payroll_period_id)
         VALUES ($1, $2)`,
        [emp.employee_id, period.id]
      );
      totalAmount += salary;
    }

    // Update period total
    await db.query(
      `UPDATE payroll_periods SET total_amount = $1 WHERE id = $2`,
      [totalAmount, period.id]
    );

    // Create run record
    const runResult = await db.query(
      `INSERT INTO recurring_payroll_runs (
        schedule_id, payroll_period_id, run_status, scheduled_at, started_at,
        total_amount, employee_count
      ) VALUES ($1, $2, 'processing', NOW(), NOW(), $3, $4) RETURNING *`,
      [scheduleId, period.id, totalAmount, employees.length]
    );

    return {
      run: runResult.rows[0],
      period,
      employee_count: employees.length,
      total_amount: totalAmount
    };
  }

  /**
   * Process scheduled runs (called by worker)
   */
  async processScheduledRuns() {
    // Get schedules that are due to run
    const result = await db.query(
      `SELECT * FROM recurring_payroll_schedules 
       WHERE is_active = TRUE 
         AND auto_run = TRUE 
         AND next_run_at <= NOW()
         AND (end_date IS NULL OR end_date >= NOW())`
    );

    const results = [];

    for (const schedule of result.rows) {
      try {
        // Create run record
        const runResult = await db.query(
          `INSERT INTO recurring_payroll_runs (schedule_id, run_status, scheduled_at)
           VALUES ($1, 'scheduled', NOW()) RETURNING *`,
          [schedule.id]
        );

        const run = runResult.rows[0];

        // Trigger the payroll run
        const payrollResult = await this.triggerRun(schedule.id, schedule.employer_id);

        // Update run status
        await db.query(
          `UPDATE recurring_payroll_runs 
           SET run_status = 'completed', completed_at = NOW(),
               total_amount = $1, employee_count = $2
           WHERE id = $3`,
          [payrollResult.total_amount, payrollResult.employee_count, run.id]
        );

        results.push({
          schedule_id: schedule.id,
          status: 'completed',
          run_id: run.id
        });

        logger.info(`Auto-run payroll for schedule: ${schedule.schedule_name}`, {
          schedule_id: schedule.id,
          employee_count: payrollResult.employee_count,
          total_amount: payrollResult.total_amount
        });
      } catch (error) {
        logger.error(`Failed to auto-run schedule: ${schedule.id}`, error);

        // Update run status to failed
        await db.query(
          `UPDATE recurring_payroll_runs 
           SET run_status = 'failed', error_message = $1
           WHERE schedule_id = $2 AND run_status = 'scheduled'`,
          [error.message, schedule.id]
        );

        results.push({
          schedule_id: schedule.id,
          status: 'failed',
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Get upcoming runs
   */
  async getUpcomingRuns(days = 7) {
    const result = await db.query(
      `SELECT * FROM v_upcoming_payroll_runs 
       WHERE next_run_at <= NOW() + INTERVAL '${days} days'
       ORDER BY next_run_at ASC`
    );

    return result.rows;
  }

  /**
   * Get run history
   */
  async getRunHistory(scheduleId, { limit = 20, offset = 0 } = {}) {
    const result = await db.query(
      `SELECT * FROM recurring_payroll_runs 
       WHERE schedule_id = $1 
       ORDER BY scheduled_at DESC 
       LIMIT $2 OFFSET $3`,
      [scheduleId, limit, offset]
    );

    const countResult = await db.query(
      `SELECT COUNT(*) FROM recurring_payroll_runs WHERE schedule_id = $1`,
      [scheduleId]
    );

    return {
      runs: result.rows,
      total: parseInt(countResult.rows[0].count)
    };
  }

  /**
   * Delete schedule
   */
  async deleteSchedule(scheduleId, employerId) {
    const result = await db.query(
      `DELETE FROM recurring_payroll_schedules 
       WHERE id = $1 AND employer_id = $2 
       RETURNING id`,
      [scheduleId, employerId]
    );

    if (result.rows.length === 0) {
      throw new Error('Schedule not found');
    }

    logger.info(`Recurring schedule deleted: ${scheduleId}`);
    return { success: true };
  }

  /**
   * Helper: Calculate next run date based on frequency
   */
  calculateNextRunDate(frequency, currentDate, dayOfWeek, dayOfMonth) {
    const date = new Date(currentDate);

    switch (frequency) {
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;

      case 'biweekly':
        date.setDate(date.getDate() + 14);
        break;

      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        // Adjust if day doesn't exist in next month
        if (dayOfMonth) {
          date.setDate(Math.min(dayOfMonth, this.getDaysInMonth(date.getFullYear(), date.getMonth() + 1)));
        }
        break;

      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        if (dayOfMonth) {
          date.setDate(Math.min(dayOfMonth, this.getDaysInMonth(date.getFullYear(), date.getMonth() + 1)));
        }
        break;
    }

    return date;
  }

  /**
   * Helper: Get days in month
   */
  getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  /**
   * Helper: Get all employees for employer
   */
  async getAllEmployees(employerId) {
    const result = await db.query(
      `SELECT id as employee_id, stellar_address, salary 
       FROM employees 
       WHERE employer_id = $1`,
      [employerId]
    );
    return result.rows;
  }

  /**
   * Helper: Get employees for specific schedule
   */
  async getScheduleEmployees(scheduleId) {
    const result = await db.query(
      `SELECT 
        re.employee_id,
        re.override_salary,
        e.stellar_address,
        e.salary
       FROM recurring_payroll_employees re
       JOIN employees e ON re.employee_id = e.id
       WHERE re.schedule_id = $1 AND re.is_active = TRUE`,
      [scheduleId]
    );
    return result.rows;
  }
}

module.exports = new RecurringPayrollService();
