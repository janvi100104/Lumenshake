#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracterror, contracttype, Address, Env, Map, Symbol,
    BytesN, log,
};

// SAC (Stellar Asset Contract) client for token transfers
// Manual token interface to avoid WASM dependency
pub trait TokenTrait {
    fn transfer(e: &Env, from: &Address, to: &Address, amount: &i128);
    fn balance(e: &Env, id: &Address) -> i128;
    fn approve(e: &Env, from: &Address, spender: &Address, amount: &i128, expiration_ledger: &u32);
}

// We'll use the built-in token client from soroban-sdk
use soroban_sdk::token::TokenClient;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum PayrollError {
    AlreadyRegistered = 1,
    NotRegistered = 2,
    NotAuthorized = 3,
    EmployeeAlreadyExists = 4,
    EmployeeNotFound = 5,
    PayrollAlreadyRun = 6,
    NoPayrollToClaim = 7,
    ContractPaused = 8,
    InvalidAmount = 9,
    AlreadyInitialized = 10,
    AlreadyClaimed = 11,
    InsufficientEscrowBalance = 12,
    MaxAmountExceeded = 13,
    InvalidAddress = 14,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Employee {
    pub address: Address,
    pub salary: i128,
    pub currency: Symbol,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PayrollPeriod {
    pub period_id: u64,
    pub total_amount: i128,
    pub is_claimed: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Employer {
    pub address: Address,
    pub kyc_hash: BytesN<32>,
    pub is_paused: bool,
}

// Storage keys
const EMPLOYERS: &str = "employers";
const EMPLOYEES: &str = "employees";
const PAYROLL_PERIODS: &str = "payroll_periods";
const PAYROLL_CLAIMS: &str = "payroll_claims";
const ADMIN: &str = "admin";
const USDC_TOKEN: &str = "usdc_token";
const ESCROW_BALANCE: &str = "escrow_balance";

// Security constants
const MAX_SALARY_AMOUNT: i128 = 1_000_000_000_000; // 1M USDC (in stroops)
const MAX_EMPLOYEES_PER_EMPLOYER: u32 = 10000;
const MAX_DEPOSIT_AMOUNT: i128 = 10_000_000_000_000; // 10M USDC

#[contract]
pub struct PayrollContract;

#[contractimpl]
impl PayrollContract {
    /// Initialize contract with admin address and USDC token contract
    pub fn initialize(e: &Env, admin: Address, usdc_token: Address) -> Result<(), PayrollError> {
        if e.storage().instance().has(&Symbol::new(&e, ADMIN)) {
            return Err(PayrollError::AlreadyInitialized);
        }

        admin.require_auth();
        e.storage().instance().set(&Symbol::new(&e, ADMIN), &admin);
        e.storage().instance().set(&Symbol::new(&e, USDC_TOKEN), &usdc_token);
        e.storage().instance().set(&Symbol::new(&e, ESCROW_BALANCE), &0i128);
        
        e.events().publish(
            (Symbol::new(&e, "contract_initialized"),),
            (admin.clone(), usdc_token.clone())
        );
        
        Ok(())
    }

    /// Register an employer with KYC verification
    pub fn register_employer(e: &Env, employer: Address, kyc_hash: BytesN<32>) -> Result<(), PayrollError> {
        employer.require_auth();
        
        let employers: Map<Address, Employer> = e.storage().instance()
            .get(&Symbol::new(&e, EMPLOYERS))
            .unwrap_or(Map::new(&e));

        if employers.contains_key(employer.clone()) {
            return Err(PayrollError::AlreadyRegistered);
        }

        let new_employer = Employer {
            address: employer.clone(),
            kyc_hash: kyc_hash.clone(),
            is_paused: false,
        };

        let mut updated_employers = employers.clone();
        updated_employers.set(employer.clone(), new_employer);
        e.storage().instance().set(&Symbol::new(&e, EMPLOYERS), &updated_employers);

        e.events().publish(
            (Symbol::new(&e, "EmployerRegistered"),),
            (employer.clone(), kyc_hash.clone())
        );
        
        log!(&e, "Employer registered: {:?}", employer);
        Ok(())
    }

    /// Add employee to payroll roster
    pub fn add_employee(
        e: &Env,
        employer: Address,
        employee: Address,
        amount: i128,
        currency: Symbol,
    ) -> Result<(), PayrollError> {
        employer.require_auth();
        
        // Validate address is not contract itself
        if employee == e.current_contract_address() {
            return Err(PayrollError::InvalidAddress);
        }
        
        // Verify employer is registered
        let employers: Map<Address, Employer> = e.storage().instance()
            .get(&Symbol::new(&e, EMPLOYERS))
            .unwrap_or(Map::new(&e));

        if !employers.contains_key(employer.clone()) {
            return Err(PayrollError::NotRegistered);
        }

        let employer_data = employers.get(employer.clone()).unwrap();
        if employer_data.is_paused {
            return Err(PayrollError::ContractPaused);
        }

        if amount <= 0 || amount > MAX_SALARY_AMOUNT {
            return Err(PayrollError::InvalidAmount);
        }
        
        // Check employee count limit (prevent storage bloat)
        let mut employee_count: u32 = 0;
        let employees: Map<(Address, Address), Employee> = e.storage().instance()
            .get(&Symbol::new(&e, EMPLOYEES))
            .unwrap_or(Map::new(&e));

        for ((emp_employer, _), _) in employees.iter() {
            if emp_employer == employer {
                employee_count += 1;
            }
        }
        
        if employee_count >= MAX_EMPLOYEES_PER_EMPLOYER {
            return Err(PayrollError::MaxAmountExceeded);
        }

        // Check if employee already exists for this employer
        let key = (employer.clone(), employee.clone());
        let employees: Map<(Address, Address), Employee> = e.storage().instance()
            .get(&Symbol::new(&e, EMPLOYEES))
            .unwrap_or(Map::new(&e));

        if employees.contains_key(key.clone()) {
            return Err(PayrollError::EmployeeAlreadyExists);
        }

        let new_employee = Employee {
            address: employee.clone(),
            salary: amount,
            currency: currency.clone(),
        };

        let mut updated_employees = employees.clone();
        updated_employees.set(key, new_employee);
        e.storage().instance().set(&Symbol::new(&e, EMPLOYEES), &updated_employees);

        e.events().publish(
            (Symbol::new(&e, "EmployeeAdded"),),
            (employer.clone(), employee.clone(), amount, currency.clone())
        );
        
        log!(&e, "Employee added: {:?} with salary: {}", employee, amount);
        Ok(())
    }

    /// Execute payroll run (distributes to all employees)
    pub fn run_payroll(e: &Env, employer: Address, period: u64) -> Result<(), PayrollError> {
        employer.require_auth();

        // Verify employer
        let employers: Map<Address, Employer> = e.storage().instance()
            .get(&Symbol::new(&e, EMPLOYERS))
            .unwrap_or(Map::new(&e));

        if !employers.contains_key(employer.clone()) {
            return Err(PayrollError::NotRegistered);
        }

        let employer_data = employers.get(employer.clone()).unwrap();
        if employer_data.is_paused {
            return Err(PayrollError::ContractPaused);
        }

        // Check if payroll period already run
        let period_key = (employer.clone(), period);
        let periods: Map<(Address, u64), PayrollPeriod> = e.storage().instance()
            .get(&Symbol::new(&e, PAYROLL_PERIODS))
            .unwrap_or(Map::new(&e));

        if periods.contains_key(period_key.clone()) {
            return Err(PayrollError::PayrollAlreadyRun);
        }

        // Calculate total payroll
        let employees: Map<(Address, Address), Employee> = e.storage().instance()
            .get(&Symbol::new(&e, EMPLOYEES))
            .unwrap_or(Map::new(&e));

        let mut total_amount: i128 = 0;
        for ((employee_employer, _employee_address), employee_data) in employees.iter() {
            if employee_employer == employer {
                total_amount = total_amount
                    .checked_add(employee_data.salary)
                    .ok_or(PayrollError::InvalidAmount)?;
            }
        }

        let payroll_period = PayrollPeriod {
            period_id: period,
            total_amount,
            is_claimed: false,
        };

        let mut updated_periods = periods.clone();
        updated_periods.set(period_key, payroll_period);
        e.storage().instance().set(&Symbol::new(&e, PAYROLL_PERIODS), &updated_periods);

        e.events().publish(
            (Symbol::new(&e, "PayrollRun"),),
            (employer.clone(), period, total_amount)
        );
        
        log!(&e, "Payroll run for period: {}", period);
        Ok(())
    }

    /// Employee claims funds (transfers USDC from escrow to employee)
    pub fn claim_payroll(e: &Env, employee: Address, employer: Address, period: u64) -> Result<i128, PayrollError> {
        employee.require_auth();

        // Verify payroll period exists
        let period_key = (employer.clone(), period);
        let periods: Map<(Address, u64), PayrollPeriod> = e.storage().instance()
            .get(&Symbol::new(&e, PAYROLL_PERIODS))
            .unwrap_or(Map::new(&e));

        if !periods.contains_key(period_key.clone()) {
            return Err(PayrollError::NoPayrollToClaim);
        }

        // Check if already claimed
        let claim_key = (employee.clone(), employer.clone(), period);
        let claims: Map<(Address, Address, u64), bool> = e.storage().instance()
            .get(&Symbol::new(&e, PAYROLL_CLAIMS))
            .unwrap_or(Map::new(&e));

        if claims.contains_key(claim_key.clone()) {
            return Err(PayrollError::AlreadyClaimed);
        }

        // Get employee salary
        let emp_key = (employer.clone(), employee.clone());
        let employees: Map<(Address, Address), Employee> = e.storage().instance()
            .get(&Symbol::new(&e, EMPLOYEES))
            .unwrap_or(Map::new(&e));

        if !employees.contains_key(emp_key.clone()) {
            return Err(PayrollError::EmployeeNotFound);
        }

        let employee_data = employees.get(emp_key).unwrap();
        let amount = employee_data.salary;

        // Transfer USDC from escrow to employee
        let usdc_token: Address = e.storage().instance()
            .get(&Symbol::new(&e, USDC_TOKEN))
            .ok_or(PayrollError::NotAuthorized)?;
        
        let token_client = TokenClient::new(e, &usdc_token);
        token_client.transfer(&e.current_contract_address(), &employee, &amount);

        // Update escrow balance
        let current_escrow: i128 = e.storage().instance()
            .get(&Symbol::new(&e, ESCROW_BALANCE))
            .unwrap_or(0);
        let new_escrow = current_escrow.checked_sub(amount).ok_or(PayrollError::InvalidAmount)?;
        e.storage().instance().set(&Symbol::new(&e, ESCROW_BALANCE), &new_escrow);

        // Mark as claimed
        let mut updated_claims = claims.clone();
        updated_claims.set(claim_key, true);
        e.storage().instance().set(&Symbol::new(&e, PAYROLL_CLAIMS), &updated_claims);

        e.events().publish(
            (Symbol::new(&e, "PayrollClaimed"),),
            (employee.clone(), employer.clone(), period, amount)
        );
        
        log!(&e, "Payroll claimed by: {:?} amount: {}", employee, amount);
        Ok(amount)
    }

    /// Emergency pause (admin only)
    pub fn pause_contract(e: &Env, admin: Address, employer: Address) -> Result<(), PayrollError> {
        admin.require_auth();

        // Verify admin
        let stored_admin: Address = e.storage().instance()
            .get(&Symbol::new(&e, ADMIN))
            .ok_or(PayrollError::NotAuthorized)?;

        if admin != stored_admin {
            return Err(PayrollError::NotAuthorized);
        }

        // Update employer pause status
        let employers: Map<Address, Employer> = e.storage().instance()
            .get(&Symbol::new(&e, EMPLOYERS))
            .unwrap_or(Map::new(&e));

        if !employers.contains_key(employer.clone()) {
            return Err(PayrollError::NotRegistered);
        }

        let mut employer_data = employers.get(employer.clone()).unwrap();
        employer_data.is_paused = !employer_data.is_paused; // Toggle pause
        let is_paused = employer_data.is_paused;

        let mut updated_employers = employers.clone();
        updated_employers.set(employer.clone(), employer_data);
        e.storage().instance().set(&Symbol::new(&e, EMPLOYERS), &updated_employers);

        e.events().publish(
            (Symbol::new(&e, "Paused"),),
            (employer.clone(), is_paused)
        );
        
        log!(&e, "Contract paused/unpaused for employer: {:?}", employer);
        Ok(())
    }

    /// Deposit USDC into escrow (employer funds payroll)
    pub fn deposit_escrow(e: &Env, employer: Address, amount: i128) -> Result<(), PayrollError> {
        employer.require_auth();
        
        if amount <= 0 || amount > MAX_DEPOSIT_AMOUNT {
            return Err(PayrollError::InvalidAmount);
        }

        // Verify employer is registered
        let employers: Map<Address, Employer> = e.storage().instance()
            .get(&Symbol::new(&e, EMPLOYERS))
            .unwrap_or(Map::new(&e));

        if !employers.contains_key(employer.clone()) {
            return Err(PayrollError::NotRegistered);
        }

        // Transfer USDC from employer to contract escrow
        let usdc_token: Address = e.storage().instance()
            .get(&Symbol::new(&e, USDC_TOKEN))
            .ok_or(PayrollError::NotAuthorized)?;
        
        let token_client = TokenClient::new(e, &usdc_token);
        token_client.transfer(&employer, &e.current_contract_address(), &amount);

        // Update escrow balance
        let current_escrow: i128 = e.storage().instance()
            .get(&Symbol::new(&e, ESCROW_BALANCE))
            .unwrap_or(0);
        let new_escrow = current_escrow.checked_add(amount).ok_or(PayrollError::InvalidAmount)?;
        e.storage().instance().set(&Symbol::new(&e, ESCROW_BALANCE), &new_escrow);

        e.events().publish(
            (Symbol::new(&e, "EscrowDeposited"),),
            (employer.clone(), amount)
        );
        
        log!(&e, "Escrow deposit: {:?} amount: {}", employer, amount);
        Ok(())
    }

    /// Emergency withdraw (admin only) - allows recovery of funds in critical situations
    pub fn emergency_withdraw(e: &Env, admin: Address, amount: i128, to: Address) -> Result<(), PayrollError> {
        admin.require_auth();
        
        // Verify admin
        let stored_admin: Address = e.storage().instance()
            .get(&Symbol::new(&e, ADMIN))
            .ok_or(PayrollError::NotAuthorized)?;

        if admin != stored_admin {
            return Err(PayrollError::NotAuthorized);
        }
        
        // Validate amount
        if amount <= 0 {
            return Err(PayrollError::InvalidAmount);
        }
        
        // Check sufficient escrow balance
        let current_escrow: i128 = e.storage().instance()
            .get(&Symbol::new(&e, ESCROW_BALANCE))
            .unwrap_or(0);
        
        if amount > current_escrow {
            return Err(PayrollError::InsufficientEscrowBalance);
        }
        
        // Transfer USDC from escrow to specified address
        let usdc_token: Address = e.storage().instance()
            .get(&Symbol::new(&e, USDC_TOKEN))
            .ok_or(PayrollError::NotAuthorized)?;
        
        let token_client = TokenClient::new(e, &usdc_token);
        token_client.transfer(&e.current_contract_address(), &to, &amount);
        
        // Update escrow balance
        let new_escrow = current_escrow.checked_sub(amount).ok_or(PayrollError::InvalidAmount)?;
        e.storage().instance().set(&Symbol::new(&e, ESCROW_BALANCE), &new_escrow);
        
        e.events().publish(
            (Symbol::new(&e, "EmergencyWithdraw"),),
            (admin.clone(), to.clone(), amount)
        );
        
        log!(&e, "Emergency withdraw: {} to {:?}", amount, to);
        Ok(())
    }

    /// Get current escrow balance
    pub fn get_escrow_balance(e: &Env) -> i128 {
        e.storage().instance()
            .get(&Symbol::new(&e, ESCROW_BALANCE))
            .unwrap_or(0)
    }

    /// Get USDC token address
    pub fn get_usdc_token(e: &Env) -> Option<Address> {
        e.storage().instance()
            .get(&Symbol::new(&e, USDC_TOKEN))
    }

    /// Get employer info
    pub fn get_employer(e: &Env, employer: Address) -> Option<Employer> {
        let employers: Map<Address, Employer> = e.storage().instance()
            .get(&Symbol::new(&e, EMPLOYERS))
            .unwrap_or(Map::new(&e));
        
        employers.get(employer)
    }

    /// Get employee info
    pub fn get_employee(e: &Env, employer: Address, employee: Address) -> Option<Employee> {
        let employees: Map<(Address, Address), Employee> = e.storage().instance()
            .get(&Symbol::new(&e, EMPLOYEES))
            .unwrap_or(Map::new(&e));
        
        employees.get((employer, employee))
    }

    /// Get payroll period info
    pub fn get_payroll_period(e: &Env, employer: Address, period: u64) -> Option<PayrollPeriod> {
        let periods: Map<(Address, u64), PayrollPeriod> = e.storage().instance()
            .get(&Symbol::new(&e, PAYROLL_PERIODS))
            .unwrap_or(Map::new(&e));

        periods.get((employer, period))
    }
}

#[cfg(test)]
mod test;
