const express = require('express');
const router = express.Router();
const recurringPayrollService = require('../services/recurringPayroll');

/**
 * POST /api/recurring/create
 * Create a new recurring payroll schedule
 */
router.post('/create', async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const employerId = req.body.employer_id; // Get from request body for now
    const scheduleData = req.body;

    // Validate required fields
    if (!scheduleData.schedule_name || !scheduleData.frequency || !scheduleData.start_date) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'schedule_name, frequency, and start_date are required'
      });
    }

    // Validate frequency
    const validFrequencies = ['weekly', 'biweekly', 'monthly', 'quarterly'];
    if (!validFrequencies.includes(scheduleData.frequency)) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: `Frequency must be one of: ${validFrequencies.join(', ')}`
      });
    }

    // Validate day configuration
    if (['weekly', 'biweekly'].includes(scheduleData.frequency)) {
      if (scheduleData.day_of_week === undefined || scheduleData.day_of_week < 0 || scheduleData.day_of_week > 6) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'day_of_week (0-6) is required for weekly/biweekly frequency'
        });
      }
    }

    if (['monthly', 'quarterly'].includes(scheduleData.frequency)) {
      if (scheduleData.day_of_month === undefined || scheduleData.day_of_month < 1 || scheduleData.day_of_month > 31) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'day_of_month (1-31) is required for monthly/quarterly frequency'
        });
      }
    }

    const schedule = await recurringPayrollService.createSchedule(employerId, scheduleData);

    res.status(201).json({
      success: true,
      data: schedule
    });
  } catch (error) {
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message
    });
  }
});

/**
 * GET /api/recurring/schedules
 * Get all recurring schedules for employer
 */
router.get('/schedules', async (req, res) => {
  try {
    const employerId = req.query.employer_id; // Get from query param for now
    const { active_only } = req.query;

    const schedules = await recurringPayrollService.getSchedules(employerId, {
      active_only: active_only === 'true'
    });

    res.json({
      success: true,
      data: schedules
    });
  } catch (error) {
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message
    });
  }
});

/**
 * GET /api/recurring/schedules/:id
 * Get schedule details
 */
router.get('/schedules/:id', async (req, res) => {
  try {
    const employerId = req.query.employer_id;
    const scheduleId = req.params.id;

    const schedule = await recurringPayrollService.getSchedule(scheduleId, employerId);

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    if (error.message === 'Schedule not found') {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message
    });
  }
});

/**
 * PUT /api/recurring/schedules/:id
 * Update schedule
 */
router.put('/schedules/:id', async (req, res) => {
  try {
    const employerId = req.body.employer_id;
    const scheduleId = req.params.id;
    const updates = req.body;

    const schedule = await recurringPayrollService.updateSchedule(scheduleId, employerId, updates);

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    if (error.message === 'No valid fields to update' || error.message === 'Schedule not found') {
      return res.status(400).json({
        error: 'BAD_REQUEST',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message
    });
  }
});

/**
 * PATCH /api/recurring/schedules/:id/toggle
 * Pause/resume schedule
 */
router.patch('/schedules/:id/toggle', async (req, res) => {
  try {
    const employerId = req.body.employer_id;
    const scheduleId = req.params.id;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'is_active must be a boolean'
      });
    }

    const schedule = await recurringPayrollService.toggleSchedule(scheduleId, employerId, is_active);

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    if (error.message === 'Schedule not found') {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message
    });
  }
});

/**
 * POST /api/recurring/schedules/:id/run
 * Manually trigger a schedule run
 */
router.post('/schedules/:id/run', async (req, res) => {
  try {
    const employerId = req.body.employer_id;
    const scheduleId = req.params.id;

    const result = await recurringPayrollService.triggerRun(scheduleId, employerId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error.message === 'Schedule is not active') {
      return res.status(400).json({
        error: 'BAD_REQUEST',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message
    });
  }
});

/**
 * GET /api/recurring/upcoming
 * Get upcoming scheduled runs
 */
router.get('/upcoming', async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const upcoming = await recurringPayrollService.getUpcomingRuns(parseInt(days));

    res.json({
      success: true,
      data: upcoming
    });
  } catch (error) {
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message
    });
  }
});

/**
 * GET /api/recurring/schedules/:id/history
 * Get run history for a schedule
 */
router.get('/schedules/:id/history', async (req, res) => {
  try {
    const scheduleId = req.params.id;
    const { limit = 20, offset = 0 } = req.query;

    const history = await recurringPayrollService.getRunHistory(scheduleId, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message
    });
  }
});

/**
 * DELETE /api/recurring/schedules/:id
 * Delete a schedule
 */
router.delete('/schedules/:id', async (req, res) => {
  try {
    const employerId = req.query.employer_id;
    const scheduleId = req.params.id;

    await recurringPayrollService.deleteSchedule(scheduleId, employerId);

    res.json({
      success: true,
      message: 'Schedule deleted successfully'
    });
  } catch (error) {
    if (error.message === 'Schedule not found') {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message
    });
  }
});

module.exports = router;
