'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/utils/wallet';
import { useToast } from '@/components/Toast';
import { useEscrowBalance } from '@/hooks/useDashboardData';

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

type CashOutTabProps = {
  walletAddress: string | null;
  isWalletConnected: boolean;
};

export default function CashOutTab({ walletAddress, isWalletConnected }: CashOutTabProps) {
  const toast = useToast();
  const { balance } = useEscrowBalance();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
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

  useEffect(() => {
    if (formData.fiatCurrency && formData.cryptoAmount) {
      fetchExchangeRate();
    }
  }, [formData.fiatCurrency, formData.cryptoAmount]);

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

    if (!isWalletConnected) {
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
          sender_phone: formData.receiverIdNumber,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setTransactionRef(result.data.moneygram_reference);
        setTransactionStatus(result.data.status);
        setStep(5);
        
        toast.success(
          'Cash-out initiated!',
          `Reference: ${result.data.moneygram_reference}. Send USDC to complete.`
        );
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

  const renderStep1Amount = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white">Step 1: Enter Amount</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">
          Amount (USDC)
        </label>
        <input
          type="number"
          value={formData.cryptoAmount}
          onChange={(e) => handleInputChange('cryptoAmount', e.target.value)}
          className="w-full px-4 py-2 bg-[#252b3d] border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          placeholder="100.00"
          step="0.01"
          min="0"
        />
        <p className="mt-1 text-sm text-gray-500">
          Available balance: {balance} USDC
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">
          Payout Currency
        </label>
        <select
          value={formData.fiatCurrency}
          onChange={(e) => handleInputChange('fiatCurrency', e.target.value)}
          className="w-full px-4 py-2 bg-[#252b3d] border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent"
        >
          {countries.map(country => (
            <option key={country.code} value={country.currency}>
              {country.name} - {country.currency}
            </option>
          ))}
        </select>
      </div>

      {exchangeRate && (
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
          <p className="text-sm text-blue-400">
            <strong>Exchange Rate:</strong> 1 USDC = {exchangeRate.rate} {formData.fiatCurrency}
          </p>
          <p className="text-sm text-blue-400 mt-1">
            <strong>Fee:</strong> {exchangeRate.fee_percentage}%
          </p>
          {formData.cryptoAmount && (
            <p className="text-lg font-semibold text-blue-400 mt-2">
              You'll receive: {calculateFiatAmount()} {formData.fiatCurrency}
            </p>
          )}
        </div>
      )}

      <button
        onClick={handleNextStep}
        disabled={!formData.cryptoAmount || parseFloat(formData.cryptoAmount) <= 0}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition"
      >
        Continue
      </button>
    </div>
  );

  const renderStep2Receiver = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white">Step 2: Receiver Information</h3>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">
          Receiver Name *
        </label>
        <input
          type="text"
          value={formData.receiverName}
          onChange={(e) => handleInputChange('receiverName', e.target.value)}
          className="w-full px-4 py-2 bg-[#252b3d] border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          placeholder="Full legal name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">
          Receiver Country *
        </label>
        <select
          value={formData.receiverCountry}
          onChange={(e) => handleInputChange('receiverCountry', e.target.value)}
          className="w-full px-4 py-2 bg-[#252b3d] border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent"
        >
          {countries.map(country => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">
          ID Type *
        </label>
        <select
          value={formData.receiverIdType}
          onChange={(e) => handleInputChange('receiverIdType', e.target.value)}
          className="w-full px-4 py-2 bg-[#252b3d] border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent"
        >
          <option value="passport">Passport</option>
          <option value="national_id">National ID</option>
          <option value="drivers_license">Driver's License</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">
          ID Number *
        </label>
        <input
          type="text"
          value={formData.receiverIdNumber}
          onChange={(e) => handleInputChange('receiverIdNumber', e.target.value)}
          className="w-full px-4 py-2 bg-[#252b3d] border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          placeholder="Enter ID number"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setStep(1)}
          className="flex-1 bg-[#252b3d] text-gray-300 py-2 rounded-lg hover:bg-gray-700 transition"
        >
          Back
        </button>
        <button
          onClick={handleNextStep}
          disabled={!formData.receiverName || !formData.receiverIdNumber}
          className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition"
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderStep3Location = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white">Step 3: Select Pickup Location</h3>

      {loading ? (
        <p className="text-center py-4 text-gray-400">Loading locations...</p>
      ) : locations.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-400">No locations found in this area.</p>
          <button
            onClick={fetchLocations}
            className="mt-2 text-blue-400 hover:underline"
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
                  ? 'border-blue-600 bg-blue-900/20'
                  : 'border-gray-700 hover:border-blue-700'
              }`}
            >
              <p className="font-semibold text-white">{location.name}</p>
              <p className="text-sm text-gray-400">{location.address_line1}</p>
              <p className="text-sm text-gray-400">{location.city}</p>
              <p className="text-sm text-blue-400 mt-1">
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
          className="flex-1 bg-[#252b3d] text-gray-300 py-2 rounded-lg hover:bg-gray-700 transition"
        >
          Back
        </button>
        <button
          onClick={handleNextStep}
          disabled={!selectedLocation}
          className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition"
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderStep4Confirm = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white">Step 4: Confirm & Send</h3>

      <div className="bg-[#252b3d] rounded-lg p-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-400">Amount:</span>
          <span className="font-semibold text-white">{formData.cryptoAmount} USDC</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Exchange Rate:</span>
          <span className="font-semibold text-white">1 USDC = {exchangeRate?.rate} {formData.fiatCurrency}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Fee ({exchangeRate?.fee_percentage}%):</span>
          <span className="font-semibold text-white">
            {(parseFloat(formData.cryptoAmount) * parseFloat(exchangeRate?.rate || '0') * parseFloat(exchangeRate?.fee_percentage || '0') / 100).toFixed(2)} {formData.fiatCurrency}
          </span>
        </div>
        <div className="border-t border-gray-700 pt-2 flex justify-between">
          <span className="text-white font-semibold">You'll Receive:</span>
          <span className="text-xl font-bold text-blue-400">
            {calculateFiatAmount()} {formData.fiatCurrency}
          </span>
        </div>
      </div>

      <div className="bg-[#252b3d] rounded-lg p-4 space-y-2">
        <h4 className="font-semibold text-white">Receiver</h4>
        <p className="text-sm text-gray-300">{formData.receiverName}</p>
        <p className="text-sm text-gray-400">
          {formData.receiverIdType}: {formData.receiverIdNumber}
        </p>
      </div>

      {selectedLocation && (
        <div className="bg-[#252b3d] rounded-lg p-4 space-y-2">
          <h4 className="font-semibold text-white">Pickup Location</h4>
          <p className="text-sm font-medium text-gray-300">{selectedLocation.name}</p>
          <p className="text-sm text-gray-400">{selectedLocation.address_line1}</p>
          <p className="text-sm text-gray-400">{selectedLocation.city}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-700/50 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => setStep(3)}
          className="flex-1 bg-[#252b3d] text-gray-300 py-2 rounded-lg hover:bg-gray-700 transition"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Processing...' : 'Confirm & Send USDC'}
        </button>
      </div>
    </div>
  );

  const renderStep5Success = () => (
    <div className="space-y-4 text-center">
      <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-6">
        <svg className="w-16 h-16 mx-auto text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-2xl font-bold text-white mt-4">Cash-Out Initiated!</h3>
        <p className="text-blue-400 mt-2">
          Your USDC has been sent. Once processed, you'll receive tracking details.
        </p>
      </div>

      {transactionRef && (
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
          <p className="text-sm text-blue-400">Reference Number</p>
          <p className="text-xl font-bold text-white">{transactionRef}</p>
        </div>
      )}

      <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4 text-left">
        <h4 className="font-semibold text-yellow-400 mb-2">Next Steps:</h4>
        <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-400">
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
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
      >
        Start New Cash-Out
      </button>
    </div>
  );

  if (!isWalletConnected) {
    return (
      <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-12 text-center">
        <div className="text-6xl mb-4">💵</div>
        <h2 className="text-2xl font-bold text-white mb-4">Cash Out to Local Currency</h2>
        <p className="text-gray-400 mb-6">Connect your Stellar wallet to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance Display */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg">
        <h3 className="text-sm font-medium opacity-90 mb-2">Available Balance</h3>
        <p className="text-4xl font-bold">{balance} USDC</p>
        <p className="text-sm opacity-90 mt-2">Ready for cash-out</p>
      </div>

      {/* Cash-Out Form */}
      <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Cash Out USDC</h2>
        
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
    </div>
  );
}
