'use client';

import { useState } from 'react';
import { useWallet } from '@/utils/wallet';

export default function LandingPage() {
  const wallet = useWallet();
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const faqs = [
    {
      question: 'How are workers paid in local fiat?',
      answer: 'Workers receive USDC on their wallets, which can be cashed-out via a network of over 550K+ locations globally using the SEP-31 protocol.',
    },
    {
      question: 'What about compliance and security?',
      answer: 'LumenShake uses industry-standard SEP-10 authentication and is built on a framework that integrates KYC/AML verification. SEP-10 with advanced monitoring and reporting.',
    },
    {
      question: 'Is the platform compliant for international use?',
      answer: 'The Stellar network and SEP-31 facilitate international compliance. Integrated monitoring tools and comprehensive logging help ensure operational compliance.',
    },
    {
      question: 'How does it integrate with existing systems?',
      answer: 'Full API access and robust webhook integrations are provided for real-time data sync with your HR, accounting, or internal systems.',
    },
  ];

  const features = [
    'Payroll Periods & Automated Distributions',
    'Instant Payments (<5s) in USDC',
    'Cross-Border Payments (SEP-31)',
    'Worker Cash-Out to local fiat (MoneyGram)',
  ];

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#0a0e17] text-white">
      {/* Header */}
      <header className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-12">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-16">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                LumenShake
              </h1>
              <p className="text-gray-400 text-sm mt-2">
                Global payroll using USDC stablecoins. Fast. Compliant. Local Cash-Out.
              </p>
            </div>
            
            {/* Connect Wallet Button */}
            <button
              onClick={wallet.connectWallet}
              disabled={wallet.loading || wallet.isConnected}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                wallet.isConnected
                  ? 'bg-green-600/20 border border-green-500/50 text-green-400'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30'
              }`}
            >
              {wallet.loading ? (
                <span className="flex items-center space-x-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  <span>Connecting...</span>
                </span>
              ) : wallet.isConnected ? (
                <span className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>CONNECT WALLET</span>
                </span>
              )}
            </button>
          </div>

          {/* Integration badges */}
          <div className="flex items-center space-x-4 mb-8">
            <div className="flex items-center space-x-2 text-gray-400 text-sm">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
              <span>Stellar</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400 text-sm">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
              </svg>
              <span>MoneyGram Integration</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Automate Payroll. Enable Employees.
          </h2>
        </div>

        {/* Utility Spotlight */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
          {/* Left - Abstract network graphic */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-full blur-3xl"></div>
            <svg className="relative w-full h-64" viewBox="0 0 400 200" fill="none">
              {/* Network nodes and connections */}
              <path d="M50 100 Q100 50 150 100 T250 100 T350 100" stroke="url(#gradient1)" strokeWidth="2" fill="none" opacity="0.6"/>
              <path d="M50 120 Q100 70 150 120 T250 120 T350 120" stroke="url(#gradient2)" strokeWidth="2" fill="none" opacity="0.4"/>
              <path d="M50 80 Q100 30 150 80 T250 80 T350 80" stroke="url(#gradient3)" strokeWidth="2" fill="none" opacity="0.5"/>
              
              {/* Nodes */}
              <circle cx="50" cy="100" r="4" fill="#3B82F6" opacity="0.8"/>
              <circle cx="150" cy="100" r="4" fill="#06B6D4" opacity="0.8"/>
              <circle cx="250" cy="100" r="4" fill="#3B82F6" opacity="0.8"/>
              <circle cx="350" cy="100" r="4" fill="#06B6D4" opacity="0.8"/>
              
              <defs>
                <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
                <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#06B6D4" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
                <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Right - Features */}
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Utility Spotlight</div>
            <h3 className="text-3xl font-bold text-white mb-6">
              Seamless Global USDC Payments
            </h3>
            <ul className="space-y-3">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="mb-12">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">FAQ</div>
          <h3 className="text-3xl font-bold text-white mb-2">
            Frequently Asked Questions
          </h3>
          <p className="text-gray-400">Common Questions About LumenShake</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-[#1a1f2e] border border-gray-800 rounded-xl overflow-hidden hover:border-blue-500/50 transition-colors"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left"
              >
                <span className="text-white font-medium pr-4">{faq.question}</span>
                <svg
                  className={`w-5 h-5 text-blue-500 flex-shrink-0 transition-transform ${
                    openFAQ === index ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {openFAQ === index && (
                <div className="px-6 pb-5">
                  <p className="text-gray-400 text-sm leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-2xl p-12 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">
            Ready to automate your global payroll?
          </h3>
          <p className="text-gray-400 mb-8">
            Connect your wallet and get started in minutes
          </p>
          <button
            onClick={wallet.connectWallet}
            disabled={wallet.loading || wallet.isConnected}
            className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all ${
              wallet.isConnected
                ? 'bg-green-600/20 border border-green-500/50 text-green-400'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30'
            }`}
          >
            {wallet.isConnected ? '✓ Wallet Connected' : 'Connect Wallet to Start'}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="text-gray-500 text-sm">
              © 2024 LumenShake. Built on Stellar Network.
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <a href="#" className="hover:text-white transition">Documentation</a>
              <a href="#" className="hover:text-white transition">API</a>
              <a href="#" className="hover:text-white transition">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
