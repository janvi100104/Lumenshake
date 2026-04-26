#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracterror, Address, Env, Map, Symbol,
};

use soroban_sdk::token::TokenClient;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum TokenError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    NotAuthorized = 3,
    InvalidAmount = 4,
    AllowanceExpired = 5,
    InsufficientBalance = 6,
}

#[contract]
pub struct TestUSDC;

#[contractimpl]
impl TestUSDC {
    pub fn initialize(e: &Env, admin: Address, decimal: u32) -> Result<(), TokenError> {
        if e.storage().instance().has(&Symbol::new(&e, "ADMIN")) {
            return Err(TokenError::AlreadyInitialized);
        }

        admin.require_auth();
        
        e.storage().instance().set(&Symbol::new(&e, "ADMIN"), &admin);
        e.storage().instance().set(&Symbol::new(&e, "DECIMAL"), &decimal);
        e.storage().instance().set(&Symbol::new(&e, "TOTAL_SUPPLY"), &0i128);
        
        // Initialize empty balances map
        e.storage().instance().set(&Symbol::new(&e, "BALANCES"), &Map::<Address, i128>::new(&e));

        Ok(())
    }

    pub fn mint(e: &Env, to: Address, amount: i128) -> Result<(), TokenError> {
        let admin: Address = e.storage().instance()
            .get(&Symbol::new(&e, "ADMIN"))
            .ok_or(TokenError::NotInitialized)?;
        
        admin.require_auth();

        if amount <= 0 {
            return Err(TokenError::InvalidAmount);
        }

        // Update balance
        let mut balances: Map<Address, i128> = e.storage().instance()
            .get(&Symbol::new(&e, "BALANCES"))
            .unwrap_or(Map::new(&e));

        let balance = balances.get(to.clone()).unwrap_or(0);
        balances.set(to.clone(), balance + amount);
        e.storage().instance().set(&Symbol::new(&e, "BALANCES"), &balances);

        // Update total supply
        let total_supply: i128 = e.storage().instance()
            .get(&Symbol::new(&e, "TOTAL_SUPPLY"))
            .unwrap_or(0);
        e.storage().instance().set(&Symbol::new(&e, "TOTAL_SUPPLY"), &(total_supply + amount));

        e.events().publish(
            (Symbol::new(&e, "mint"),),
            (admin.clone(), to.clone(), amount)
        );

        Ok(())
    }

    pub fn transfer(e: &Env, from: Address, to: Address, amount: i128) -> Result<(), TokenError> {
        from.require_auth();

        if amount <= 0 {
            return Err(TokenError::InvalidAmount);
        }

        let mut balances: Map<Address, i128> = e.storage().instance()
            .get(&Symbol::new(&e, "BALANCES"))
            .unwrap_or(Map::new(&e));

        let from_balance = balances.get(from.clone()).unwrap_or(0);
        if from_balance < amount {
            return Err(TokenError::InsufficientBalance);
        }

        balances.set(from.clone(), from_balance - amount);
        
        let to_balance = balances.get(to.clone()).unwrap_or(0);
        balances.set(to.clone(), to_balance + amount);
        
        e.storage().instance().set(&Symbol::new(&e, "BALANCES"), &balances);

        e.events().publish(
            (Symbol::new(&e, "transfer"),),
            (from.clone(), to.clone(), amount)
        );

        Ok(())
    }

    pub fn balance(e: &Env, id: Address) -> i128 {
        let balances: Map<Address, i128> = e.storage().instance()
            .get(&Symbol::new(&e, "BALANCES"))
            .unwrap_or(Map::new(&e));

        balances.get(id.clone()).unwrap_or(0)
    }

    pub fn total_supply(e: &Env) -> i128 {
        e.storage().instance()
            .get(&Symbol::new(&e, "TOTAL_SUPPLY"))
            .unwrap_or(0)
    }

    pub fn decimals(e: &Env) -> u32 {
        e.storage().instance()
            .get(&Symbol::new(&e, "DECIMAL"))
            .unwrap_or(7)
    }

    pub fn approve(e: &Env, from: Address, spender: Address, amount: i128, expiration_ledger: u32) -> Result<(), TokenError> {
        from.require_auth();

        if amount <= 0 {
            return Err(TokenError::InvalidAmount);
        }

        e.storage().instance().set(
            &(Symbol::new(&e, "ALLOWANCE"), from.clone(), spender.clone()),
            &(amount, expiration_ledger)
        );

        e.events().publish(
            (Symbol::new(&e, "approve"),),
            (from.clone(), spender.clone(), amount, expiration_ledger)
        );

        Ok(())
    }

    pub fn allowance(e: &Env, from: Address, spender: Address) -> i128 {
        let result: Option<(i128, u32)> = e.storage().instance()
            .get(&(Symbol::new(&e, "ALLOWANCE"), from.clone(), spender.clone()));

        match result {
            Some((amount, expiration)) => {
                let ledger = e.ledger().sequence();
                if ledger > expiration {
                    0
                } else {
                    amount
                }
            }
            None => 0,
        }
    }

    pub fn transfer_from(e: &Env, spender: Address, from: Address, to: Address, amount: i128) -> Result<(), TokenError> {
        spender.require_auth();

        if amount <= 0 {
            return Err(TokenError::InvalidAmount);
        }

        // Check and update allowance
        let allowance_key = (Symbol::new(&e, "ALLOWANCE"), from.clone(), spender.clone());
        let result: Option<(i128, u32)> = e.storage().instance().get(&allowance_key);

        match result {
            Some((allowed, expiration)) => {
                let ledger = e.ledger().sequence();
                if ledger > expiration {
                    return Err(TokenError::AllowanceExpired);
                }
                if allowed < amount {
                    return Err(TokenError::InvalidAmount);
                }
                e.storage().instance().set(&allowance_key, &(allowed - amount, expiration));
            }
            None => return Err(TokenError::InvalidAmount),
        }

        // Transfer
        let mut balances: Map<Address, i128> = e.storage().instance()
            .get(&Symbol::new(&e, "BALANCES"))
            .unwrap_or(Map::new(&e));

        let from_balance = balances.get(from.clone()).unwrap_or(0);
        if from_balance < amount {
            return Err(TokenError::InsufficientBalance);
        }

        balances.set(from.clone(), from_balance - amount);
        
        let to_balance = balances.get(to.clone()).unwrap_or(0);
        balances.set(to.clone(), to_balance + amount);
        
        e.storage().instance().set(&Symbol::new(&e, "BALANCES"), &balances);

        e.events().publish(
            (Symbol::new(&e, "transfer"),),
            (from.clone(), to.clone(), amount)
        );

        Ok(())
    }
}
