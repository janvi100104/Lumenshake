'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/utils/wallet';
import { useToast } from '@/components/Toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface CashOutForm {
  receiverName: string;
  receiverCountry: string;
  receiverIdType: string;
  receiverIdNumber: string;
  cryptoAmount: string;
  fiatCurrency: string;
  payoutMethod: 'cash_pickup' | 'bank_deposit' | 'mobile_wallet';
}

interface ExchangeRate {
  base_currency: string;
  target_currency: string;
  rate: string;
  fee_percentage: string;
  valid_until: string;
}

interface Location {
  location_id: string;
  name: string;
  address_line1: string;
  city: string;
  country: string;
  distance_km: string;
  phone: string;
}

export default function CashOutDashboard() {
  const { address: walletAddress, isConnected: isConnectedState, connectWallet } = useWallet();
  const toast = useToast();
  
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1); // 1: Amount, 2: Receiver, 3: Location, 4: Confirm
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [transactionRef, setTransactionRef] = useState<string | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<string | null>(null);

  const [formData, setFormData] = useState<CashOutForm>({
    receiverName: '',
    receiverCountry: 'MX',
    receiverIdType: 'passport',
    receiverIdNumber: '',
    cryptoAmount: '',
    fiatCurrency: 'MXN',
    payoutMethod: 'cash_pickup',
  });

  const countries = [
    { code: 'MX', name: 'Mexico', currency: 'MXN' },
    { code: 'IN', name: 'India', currency: 'INR' },
    { code: 'PH', name: 'Philippines', currency: 'PHP' },
    { code: 'GH', name: 'Ghana', currency: 'GHS' },
    { code: 'NG', name: 'Nigeria', currency: 'NGN' },
  ];

  // Fetch exchange rate when currency or amount changes
  useEffect(() => {
    if (formData.fiatCurrency && formData.cryptoAmount) {
      fetchExchangeRate();
    }
  }, [formData.fiatCurrency, formData.cryptoAmount]);

  // Fetch user's balance when connected
  useEffect(() => {
    if (isConnectedState) {
      fetchBalance();
    }
  }, [isConnectedState]);

  const fetchBalance = async () => {
    // TODO: Fetch actual USDC balance from contract
    setBalance('150.00'); // Mock balance for now
  };

  const fetchExchangeRate = async () => {
    try {
      const response = await fetch(
        `${API_URL}/moneygram/exchange-rate?base=USDC&target=${formData.fiatCurrency}`
      );
      const result = await response.json();
      if (result.success) {
        setExchangeRate(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch exchange rate:', err);
    }
  };

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/moneygram/locations?country=${formData.receiverCountry}`
      );
      const result = await response.json();
      if (result.success) {
        setLocations(result.data);
        if (result.data.length > 0) {
          toast.info(`${result.data.length} locations found`, 'Select a pickup location');
        }
      }
    } catch (err) {
      toast.error('Failed to fetch locations', 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CashOutForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Update fiat currency when country changes
    if (field === 'receiverCountry') {
      const country = countries.find(c => c.code === value);
      if (country) {
        setFormData(prev => ({ ...prev, fiatCurrency: country.currency }));
      }
    }
  };

  const calculateFiatAmount = () => {
    if (!exchangeRate || !formData.cryptoAmount) return '0';
    const crypto = parseFloat(formData.cryptoAmount);
    const rate = parseFloat(exchangeRate.rate);
    const fee = crypto * rate * (parseFloat(exchangeRate.fee_percentage) / 100);
    return (crypto * rate - fee).toFixed(2);
  };

  const handleNextStep = async () => {
    if (step === 2) {
      await fetchLocations();
    }
    setStep(prev => prev + 1);
  };

  const handleSubmit = async () => {
    if (!selectedLocation) {
      toast.error('No location selected', 'Please select a pickup location');
      return;
    }

    if (!isConnectedState) {
      toast.error('Wallet not connected', 'Please connect your wallet first');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('sep10_token');
      if (!token) {
        toast.error('Not authenticated', 'Please complete SEP-10 authentication first');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/moneygram/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiver_name: formData.receiverName,
          receiver_country: formData.receiverCountry,
          receiver_id_type: formData.receiverIdType,
          receiver_id_number: formData.receiverIdNumber,
          crypto_amount: formData.cryptoAmount,
          crypto_currency: 'USDC',
          fiat_currency: formData.fiatCurrency,
          payout_method: formData.payoutMethod,
          payout_location_id: selectedLocation.location_id,
          sender_phone: formData.receiverIdNumber, // Would come from KYC in production
        }),
      });

      const result = await response.json();

      if (result.success) {
        setTransactionRef(result.data.moneygram_reference);
        setTransactionStatus(result.data.status);
        setStep(5); // Success step
        
        toast.success(
          'Cash-out initiated!',
          `Reference: ${result.data.moneygram_reference}. Send USDC to complete.`
        );

        // TODO: Trigger Stellar transaction to send USDC to escrow
        // await sendUSDCToEscrow(formData.cryptoAmount, result.data);
      } else {
        toast.error('Cash-out failed', result.message || result.error);
      }
    } catch (err) {
      toast.error(
        'Cash-out failed',
        err instanceof Error ? err.message : 'Unknown error occurred'
      );
    } finally {
      setLoading(false);
    }
  };

  const checkTransactionStatus = async () => {
    if (!transactionRef) return;

    try {
      const token = localStorage.getItem('sep10_token');
      if (!token) return;

      const response = await fetch(
        `${API_URL}/moneygram/status/${transactionRef}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();
      if (result.success) {
        setTransactionStatus(result.data.status);
      }
    } catch (err) {
      console.error('Failed to check transaction status:', err);
    }
  };

  const renderStep1Amount = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-900">Step 1: Enter Amount</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Amount (USDC)
        </label>
        <input
          type="number"
          value={formData.cryptoAmount}
          onChange={(e) => handleInputChange('cryptoAmount', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="100.00"
          step="0.01"
          min="0"
        />
        <p className="mt-1 text-sm text-gray-500">
          Available balance: {balance} USDC
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Payout Currency
        </label>
        <select
          value={formData.fiatCurrency}
          onChange={(e) => handleInputChange('fiatCurrency', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {countries.map(country => (
            <option key={country.code} value={country.currency}>
              {country.name} - {country.currency}
            </option>
          ))}
        </select>
      </div>

      {exchangeRate && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>Exchange Rate:</strong> 1 USDC = {exchangeRate.rate} {formData.fiatCurrency}
          </p>
          <p className="text-sm text-blue-900 mt-1">
            <strong>Fee:</strong> {exchangeRate.fee_percentage}%
          </p>
          {formData.cryptoAmount && (
            <p className="text-lg font-semibold text-blue-900 mt-2">
              You'll receive: {calculateFiatAmount()} {formData.fiatCurrency}
            </p>
          )}
        </div>
      )}

      <button
        onClick={handleNextStep}
        disabled={!formData.cryptoAmount || parseFloat(formData.cryptoAmount) <= 0}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        Continue
      </button>
    </div>
  );

  const renderStep2Receiver = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-900">Step 2: Receiver Information</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Receiver Name *
        </label>
        <input
          type="text"
          value={formData.receiverName}
          onChange={(e) => handleInputChange('receiverName', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Full legal name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Receiver Country *
        </label>
        <select
          value={formData.receiverCountry}
          onChange={(e) => handleInputChange('receiverCountry', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {countries.map(country => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ID Type *
        </label>
        <select
          value={formData.receiverIdType}
          onChange={(e) => handleInputChange('receiverIdType', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="passport">Passport</option>
          <option value="national_id">National ID</option>
          <option value="drivers_license">Driver's License</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ID Number *
        </label>
        <input
          type="text"
          value={formData.receiverIdNumber}
          onChange={(e) => handleInputChange('receiverIdNumber', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Enter ID number"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setStep(1)}
          className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
        >
          Back
        </button>
        <button
          onClick={handleNextStep}
          disabled={!formData.receiverName || !formData.receiverIdNumber}
          className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderStep3Location = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-900">Step 3: Select Pickup Location</h3>

      {loading ? (
        <p className="text-center py-4">Loading locations...</p>
      ) : locations.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-600">No locations found in this area.</p>
          <button
            onClick={fetchLocations}
            className="mt-2 text-blue-600 hover:underline"
          >
            Refresh
          </button>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {locations.map(location => (
            <div
              key={location.location_id}
              onClick={() => setSelectedLocation(location)}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedLocation?.location_id === location.location_id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-300'
              }`}
            >
              <p className="font-semibold text-gray-900">{location.name}</p>
              <p className="text-sm text-gray-600">{location.address_line1}</p>
              <p className="text-sm text-gray-600">{location.city}</p>
              <p className="text-sm text-blue-600 mt-1">
                {location.distance_km} km away
              </p>
              {location.phone && (
                <p className="text-sm text-gray-500">{location.phone}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => setStep(2)}
          className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
        >
          Back
        </button>
        <button
          onClick={handleNextStep}
          disabled={!selectedLocation}
          className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderStep4Confirm = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-900">Step 4: Confirm & Send</h3>

      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Amount:</span>
          <span className="font-semibold">{formData.cryptoAmount} USDC</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Exchange Rate:</span>
          <span className="font-semibold">1 USDC = {exchangeRate?.rate} {formData.fiatCurrency}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Fee ({exchangeRate?.fee_percentage}%):</span>
          <span className="font-semibold">
            {(parseFloat(formData.cryptoAmount) * parseFloat(exchangeRate?.rate || '0') * parseFloat(exchangeRate?.fee_percentage || '0') / 100).toFixed(2)} {formData.fiatCurrency}
          </span>
        </div>
        <div className="border-t pt-2 flex justify-between">
          <span className="text-gray-900 font-semibold">You'll Receive:</span>
          <span className="text-xl font-bold text-blue-600">
            {calculateFiatAmount()} {formData.fiatCurrency}
          </span>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <h4 className="font-semibold text-gray-900">Receiver</h4>
        <p className="text-sm">{formData.receiverName}</p>
        <p className="text-sm text-gray-600">
          {formData.receiverIdType}: {formData.receiverIdNumber}
        </p>
      </div>

      {selectedLocation && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <h4 className="font-semibold text-gray-900">Pickup Location</h4>
          <p className="text-sm font-medium">{selectedLocation.name}</p>
          <p className="text-sm text-gray-600">{selectedLocation.address_line1}</p>
          <p className="text-sm text-gray-600">{selectedLocation.city}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => setStep(3)}
          className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading ? 'Processing...' : 'Confirm & Send USDC'}
        </button>
      </div>
    </div>
  );

  const renderStep5Success = () => (
    <div className="space-y-4 text-center">
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <svg className="w-16 h-16 mx-auto text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-2xl font-bold text-green-900 mt-4">Cash-Out Initiated!</h3>
        <p className="text-green-700 mt-2">
          Your USDC has been sent. Once processed, you'll receive tracking details.
        </p>
      </div>

      {transactionRef && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">Reference Number</p>
          <p className="text-xl font-bold text-blue-900">{transactionRef}</p>
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
        <h4 className="font-semibold text-yellow-900 mb-2">Next Steps:</h4>
        <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-800">
          <li>Wait for transaction processing (usually 5-15 minutes)</li>
          <li>You'll receive a tracking number and PIN</li>
          <li>Visit the pickup location with valid ID</li>
          <li>Show tracking number and PIN to collect cash</li>
        </ol>
      </div>

      <button
        onClick={() => {
          setStep(1);
          setTransactionRef(null);
          setFormData({
            receiverName: '',
            receiverCountry: 'MX',
            receiverIdType: 'passport',
            receiverIdNumber: '',
            cryptoAmount: '',
            fiatCurrency: 'MXN',
            payoutMethod: 'cash_pickup',
          });
        }}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
      >
        Start New Cash-Out
      </button>
    </div>
  );

  if (!isConnectedState) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Cash Out to Local Currency</h2>
        <p className="text-gray-600 mb-4">Connect your Stellar wallet to get started.</p>
        <button
          onClick={connectWallet}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Cash Out USDC</h2>
      
      {/* Wallet Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-blue-700">Connected Wallet</p>
        <p className="text-xs font-mono text-blue-900 truncate">{walletAddress}</p>
        <p className="text-sm text-blue-700 mt-2">
          Balance: <span className="font-bold">{balance} USDC</span>
        </p>
      </div>

      {/* Progress Bar */}
      <div className="flex justify-between mb-6">
        {[1, 2, 3, 4, 5].map(s => (
          <div
            key={s}
            className={`flex-1 h-2 mx-1 rounded-full ${
              s <= step ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>

      {step === 1 && renderStep1Amount()}
      {step === 2 && renderStep2Receiver()}
      {step === 3 && renderStep3Location()}
      {step === 4 && renderStep4Confirm()}
      {step === 5 && renderStep5Success()}
    </div>
  );
}
