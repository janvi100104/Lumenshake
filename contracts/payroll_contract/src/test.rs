#![cfg(test)]

use super::*;
use soroban_sdk::{
    symbol_short,
    testutils::Address as _,
    Address, BytesN, Env,
};

// Mock token contract for testing
mod test_token {
    use soroban_sdk::{contract, contractimpl, Address, Env};

    #[contract]
    pub struct TestToken;

    #[contractimpl]
    impl TestToken {
        pub fn transfer(e: &Env, from: Address, to: Address, amount: i128) {
            from.require_auth();
            // Mock transfer - in real tests we'd track balances
        }

        pub fn balance(e: &Env, id: Address) -> i128 {
            1000000 // Mock balance
        }

        pub fn approve(e: &Env, from: Address, spender: Address, amount: i128, expiration_ledger: u32) {
            from.require_auth();
        }
    }
}

#[test]
fn test_initialize_contract() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, PayrollContract);
    let client = PayrollContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let usdc_token = Address::generate(&env);
    
    // Initialize should succeed
    client.initialize(&admin, &usdc_token);
}

#[test]
#[should_panic(expected = "Error(Contract, #10)")]
fn test_initialize_contract_only_once() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, PayrollContract);
    let client = PayrollContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let usdc_token = Address::generate(&env);

    client.initialize(&admin, &usdc_token);
    // Should panic - contract already initialized
    client.initialize(&admin, &usdc_token);
}

#[test]
fn test_register_employer() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, PayrollContract);
    let client = PayrollContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let employer = Address::generate(&env);
    let usdc_token = Address::generate(&env);
    let kyc_hash = BytesN::from_array(&env, &[0u8; 32]);

    client.initialize(&admin, &usdc_token);
    
    // Register employer
    client.register_employer(&employer, &kyc_hash);

    // Verify employer exists
    let result = client.get_employer(&employer);
    assert!(result.is_some());
}

#[test]
#[should_panic(expected = "Error(Contract, #1)")]
fn test_register_duplicate_employer() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, PayrollContract);
    let client = PayrollContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let employer = Address::generate(&env);
    let usdc_token = Address::generate(&env);
    let kyc_hash = BytesN::from_array(&env, &[0u8; 32]);

    client.initialize(&admin, &usdc_token);
    client.register_employer(&employer, &kyc_hash);
    
    // Should panic - already registered
    client.register_employer(&employer, &kyc_hash);
}

#[test]
fn test_add_employee() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, PayrollContract);
    let client = PayrollContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let employer = Address::generate(&env);
    let employee = Address::generate(&env);
    let usdc_token = Address::generate(&env);
    let kyc_hash = BytesN::from_array(&env, &[0u8; 32]);

    client.initialize(&admin, &usdc_token);
    client.register_employer(&employer, &kyc_hash);
    
    // Add employee
    let currency = symbol_short!("USDC");
    client.add_employee(&employer, &employee, &1000, &currency);

    // Verify employee exists
    let result = client.get_employee(&employer, &employee);
    assert!(result.is_some());
    
    let emp_data = result.unwrap();
    assert_eq!(emp_data.salary, 1000);
    assert_eq!(emp_data.address, employee);
}

#[test]
#[should_panic(expected = "Error(Contract, #4)")]
fn test_add_duplicate_employee() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, PayrollContract);
    let client = PayrollContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let employer = Address::generate(&env);
    let employee = Address::generate(&env);
    let usdc_token = Address::generate(&env);
    let kyc_hash = BytesN::from_array(&env, &[0u8; 32]);
    let currency = symbol_short!("USDC");

    client.initialize(&admin, &usdc_token);
    client.register_employer(&employer, &kyc_hash);
    client.add_employee(&employer, &employee, &1000, &currency);
    
    // Should panic - employee already exists
    client.add_employee(&employer, &employee, &2000, &currency);
}

#[test]
#[should_panic(expected = "Error(Contract, #9)")]
fn test_add_employee_invalid_amount() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, PayrollContract);
    let client = PayrollContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let employer = Address::generate(&env);
    let employee = Address::generate(&env);
    let usdc_token = Address::generate(&env);
    let kyc_hash = BytesN::from_array(&env, &[0u8; 32]);
    let currency = symbol_short!("USDC");

    client.initialize(&admin, &usdc_token);
    client.register_employer(&employer, &kyc_hash);
    
    // Should panic - invalid amount (0 or negative)
    client.add_employee(&employer, &employee, &0, &currency);
}

#[test]
fn test_run_payroll() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, PayrollContract);
    let client = PayrollContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let employer = Address::generate(&env);
    let employee1 = Address::generate(&env);
    let employee2 = Address::generate(&env);
    let usdc_token = Address::generate(&env);
    let kyc_hash = BytesN::from_array(&env, &[0u8; 32]);
    let currency = symbol_short!("USDC");

    client.initialize(&admin, &usdc_token);
    client.register_employer(&employer, &kyc_hash);
    client.add_employee(&employer, &employee1, &1200, &currency);
    client.add_employee(&employer, &employee2, &2300, &currency);
    
    // Run payroll for period 1
    client.run_payroll(&employer, &1);

    let payroll_period = client.get_payroll_period(&employer, &1).unwrap();
    assert_eq!(payroll_period.total_amount, 3500);
}

#[test]
#[should_panic(expected = "Error(Contract, #6)")]
fn test_run_payroll_duplicate_period() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, PayrollContract);
    let client = PayrollContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let employer = Address::generate(&env);
    let usdc_token = Address::generate(&env);
    let kyc_hash = BytesN::from_array(&env, &[0u8; 32]);

    client.initialize(&admin, &usdc_token);
    client.register_employer(&employer, &kyc_hash);
    client.run_payroll(&employer, &1);
    
    // Should panic - payroll already run for this period
    client.run_payroll(&employer, &1);
}

#[test]
fn test_claim_payroll() {
    let env = Env::default();
    env.mock_all_auths();
    
    // Register mock token contract
    let token_id = env.register_contract(None, test_token::TestToken);
    let contract_id = env.register_contract(None, PayrollContract);
    let client = PayrollContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let employer = Address::generate(&env);
    let employee = Address::generate(&env);
    let kyc_hash = BytesN::from_array(&env, &[0u8; 32]);
    let currency = symbol_short!("USDC");

    client.initialize(&admin, &token_id);
    client.register_employer(&employer, &kyc_hash);
    client.add_employee(&employer, &employee, &1500, &currency);
    client.run_payroll(&employer, &1);
    
    // Claim payroll
    let claimed_amount = client.claim_payroll(&employee, &employer, &1);
    assert_eq!(claimed_amount, 1500);
}

#[test]
#[should_panic(expected = "Error(Contract, #11)")]
fn test_claim_payroll_only_once() {
    let env = Env::default();
    env.mock_all_auths();
    
    // Register mock token contract
    let token_id = env.register_contract(None, test_token::TestToken);
    let contract_id = env.register_contract(None, PayrollContract);
    let client = PayrollContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let employer = Address::generate(&env);
    let employee = Address::generate(&env);
    let kyc_hash = BytesN::from_array(&env, &[0u8; 32]);
    let currency = symbol_short!("USDC");

    client.initialize(&admin, &token_id);
    client.register_employer(&employer, &kyc_hash);
    client.add_employee(&employer, &employee, &900, &currency);
    client.run_payroll(&employer, &1);

    client.claim_payroll(&employee, &employer, &1);
    // Should panic - payroll already claimed
    client.claim_payroll(&employee, &employer, &1);
}

#[test]
fn test_pause_contract() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, PayrollContract);
    let client = PayrollContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let employer = Address::generate(&env);
    let usdc_token = Address::generate(&env);
    let kyc_hash = BytesN::from_array(&env, &[0u8; 32]);

    client.initialize(&admin, &usdc_token);
    client.register_employer(&employer, &kyc_hash);
    
    // Pause contract
    client.pause_contract(&admin, &employer);

    // Verify employer is paused
    let employer_data = client.get_employer(&employer).unwrap();
    assert!(employer_data.is_paused);
}

#[test]
#[should_panic(expected = "Error(Contract, #3)")]
fn test_pause_unauthorized() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, PayrollContract);
    let client = PayrollContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let employer = Address::generate(&env);
    let employee = Address::generate(&env);
    let unauthorized = Address::generate(&env);
    let usdc_token = Address::generate(&env);
    let kyc_hash = BytesN::from_array(&env, &[0u8; 32]);

    client.initialize(&admin, &usdc_token);
    client.register_employer(&employer, &kyc_hash);
    
    // Should panic - not authorized
    client.pause_contract(&unauthorized, &employer);
}

#[test]
fn test_full_payroll_flow() {
    let env = Env::default();
    env.mock_all_auths();
    
    // Register mock token contract
    let token_id = env.register_contract(None, test_token::TestToken);
    let contract_id = env.register_contract(None, PayrollContract);
    let client = PayrollContractClient::new(&env, &contract_id);

    // Setup
    let admin = Address::generate(&env);
    let employer = Address::generate(&env);
    let employee1 = Address::generate(&env);
    let employee2 = Address::generate(&env);
    let kyc_hash = BytesN::from_array(&env, &[1u8; 32]);
    let currency = symbol_short!("USDC");

    // Initialize and register
    client.initialize(&admin, &token_id);
    client.register_employer(&employer, &kyc_hash);

    // Add employees
    client.add_employee(&employer, &employee1, &2000, &currency);
    client.add_employee(&employer, &employee2, &2500, &currency);

    // Run payroll
    client.run_payroll(&employer, &1);

    // Employees claim
    let claim1 = client.claim_payroll(&employee1, &employer, &1);
    let claim2 = client.claim_payroll(&employee2, &employer, &1);

    assert_eq!(claim1, 2000);
    assert_eq!(claim2, 2500);
}
