'use client';

import { useState } from 'react';
import { useWallet } from '@/utils/wallet';

type FeatureCard = {
  title: string;
  description: string;
  chip: string;
};

type Step = {
  title: string;
  detail: string;
};

export default function LandingPage() {
  const wallet = useWallet();
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

  const navItems = ['Home', 'Features', 'Flow', 'FAQ'];

  const members = ['AR', 'MK', 'LN', 'ST'];

  const featureCards: FeatureCard[] = [
    {
      title: 'Invest in Growth',
      description:
        'Run payroll and treasury from one place with predictable USDC rails, no settlement lag, and clear audit trails.',
      chip: 'Stable Liquidity',
    },
    {
      title: 'Fast Transactions',
      description:
        'Set recurring payouts, trigger one-off bonuses, and complete cross-border transfers in under five seconds.',
      chip: '< 5s Settlement',
    },
    {
      title: 'Enterprise Security',
      description:
        'Layer SEP-10 auth, compliance checks, and webhook tracking while keeping every transfer visible and controllable.',
      chip: 'Compliance Ready',
    },
  ];

  const steps: Step[] = [
    {
      title: 'Connect Wallet',
      detail:
        'Sign in with Freighter to initialize your payroll treasury and assign admin controls.',
    },
    {
      title: 'Configure Payroll',
      detail:
        'Upload team data, define cycles, and map payout routes for each region in minutes.',
    },
    {
      title: 'Pay & Cash Out',
      detail:
        'Release USDC salaries and let workers cash out locally through integrated MoneyGram rails.',
    },
  ];

  const faqs = [
    {
      question: 'How are workers paid in local fiat?',
      answer:
        'Employees receive USDC on Stellar wallets and can cash out locally through supported MoneyGram points. That gives teams crypto-speed settlement without forcing them to stay in crypto.',
    },
    {
      question: 'What about compliance and security?',
      answer:
        'LumenShake uses SEP-10 authentication, KYC-aware workflows, auditable transaction logs, and role-based controls to keep operations secure and regulator-ready.',
    },
    {
      question: 'Can we integrate this with HR or finance tools?',
      answer:
        'Yes. API and webhook hooks are designed for payroll sync, status updates, and reconciliation pipelines with your existing HRIS or accounting stack.',
    },
    {
      question: 'Does this support recurring global payroll cycles?',
      answer:
        'Yes. You can configure recurring cycles, auto-run payouts, and monitor every batch in one dashboard with fast final settlement.',
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const walletAddressLabel = wallet.address
    ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`
    : 'Wallet Connected';

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060b18] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-180px] top-[-220px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,_rgba(56,189,248,0.34)_0%,_rgba(56,189,248,0)_70%)] blur-2xl" />
        <div className="absolute right-[-160px] top-[120px] h-[470px] w-[470px] rounded-full bg-[radial-gradient(circle,_rgba(20,184,166,0.3)_0%,_rgba(20,184,166,0)_68%)] blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-[-280px] left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(59,130,246,0.24)_0%,_rgba(59,130,246,0)_72%)] blur-3xl" />
        <div className="absolute inset-0 opacity-35 [background:linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:54px_54px]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col px-6 pb-14 pt-8 md:pt-10">
        <header className="mb-16 rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-4 backdrop-blur-xl md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-sky-300/30 bg-gradient-to-br from-sky-400/25 via-cyan-300/10 to-transparent shadow-[0_0_45px_-22px_rgba(56,189,248,1)]">
                <svg className="h-6 w-6 text-sky-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 2l6.5 4v12L12 22 5.5 18V6L12 2z" />
                  <path d="M12 2v20M5.5 6 12 10l6.5-4M5.5 18 12 14l6.5 4" />
                </svg>
              </div>
              <div>
                <p className="font-display text-xl font-semibold tracking-wide text-white">LumenShake</p>
                <p className="text-xs text-slate-300/75">Global payroll powered by Stellar + USDC</p>
              </div>
            </div>

            <nav className="hidden items-center gap-8 text-sm text-slate-200/85 md:flex">
              {navItems.map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="transition-colors hover:text-cyan-300"
                >
                  {item}
                </a>
              ))}
            </nav>

            <button
              onClick={wallet.connectWallet}
              disabled={wallet.loading || wallet.isConnected}
              className={`inline-flex h-11 items-center justify-center rounded-xl border px-5 text-sm font-semibold transition-all ${
                wallet.isConnected
                  ? 'cursor-default border-emerald-300/35 bg-emerald-500/15 text-emerald-200'
                  : 'border-cyan-300/45 bg-[linear-gradient(120deg,rgba(14,116,144,0.9),rgba(2,132,199,0.75),rgba(20,184,166,0.7))] text-white shadow-[0_18px_45px_-20px_rgba(34,211,238,0.95)] hover:-translate-y-0.5 hover:shadow-[0_24px_55px_-20px_rgba(34,211,238,0.95)]'
              }`}
            >
              {wallet.loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" className="opacity-30" stroke="currentColor" strokeWidth="4" />
                    <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                  Connecting...
                </span>
              ) : wallet.isConnected ? (
                walletAddressLabel
              ) : (
                'Connect Wallet'
              )}
            </button>
          </div>
        </header>

        <main className="space-y-24">
          <section id="home" className="grid items-center gap-12 lg:grid-cols-[1.08fr_0.92fr]">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.22em] text-cyan-200">
                Secure Cross-Border Payroll
              </p>
              <h1 className="font-display text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
                Explore the Next Wave of
                <span className="mt-1 block bg-[linear-gradient(120deg,#93c5fd,#67e8f9,#2dd4bf)] bg-clip-text text-transparent animate-shimmer">
                  Payroll Infrastructure
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
                Manage payouts, automate compliance, and enable local cash-out with a cinematic dashboard built for modern global teams.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  onClick={wallet.connectWallet}
                  disabled={wallet.loading || wallet.isConnected}
                  className={`inline-flex h-12 items-center justify-center rounded-xl px-6 text-sm font-semibold transition-all ${
                    wallet.isConnected
                      ? 'cursor-default border border-emerald-300/35 bg-emerald-500/15 text-emerald-200'
                      : 'bg-[linear-gradient(120deg,#0284c7,#06b6d4,#14b8a6)] text-white shadow-[0_22px_50px_-22px_rgba(6,182,212,1)] hover:-translate-y-0.5'
                  }`}
                >
                  {wallet.isConnected ? 'Wallet Connected' : 'Launch Payroll'}
                </button>
                <a
                  href="#flow"
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-300/30 bg-white/[0.04] px-6 text-sm font-semibold text-slate-100 transition-colors hover:border-cyan-300/50 hover:text-cyan-200"
                >
                  See Flow
                </a>
              </div>

              <div className="mt-9 flex flex-wrap items-center gap-5">
                <p className="text-sm text-slate-300">Trusted by payroll operators</p>
                <div className="flex -space-x-3">
                  {members.map((initial, index) => (
                    <div
                      key={initial}
                      className="grid h-11 w-11 place-items-center rounded-full border-2 border-[#060b18] bg-[linear-gradient(135deg,rgba(6,182,212,0.6),rgba(14,116,144,0.82))] text-xs font-semibold text-white shadow-[0_0_0_1px_rgba(125,211,252,0.45)]"
                      style={{ zIndex: members.length - index }}
                    >
                      {initial}
                    </div>
                  ))}
                </div>
              </div>

              {!wallet.freighterInstalled && (
                <p className="mt-6 text-sm text-amber-200/90">
                  Freighter wallet not detected yet. Install or enable it, then reconnect.
                </p>
              )}
            </div>

            <div className="relative mx-auto w-full max-w-[520px]">
              <div className="absolute inset-0 rounded-[2.5rem] bg-[radial-gradient(circle,_rgba(6,182,212,0.22)_0%,_rgba(6,182,212,0)_70%)] blur-2xl" />
              <div className="relative rounded-[2.5rem] border border-white/12 bg-white/[0.045] p-6 shadow-[0_50px_100px_-55px_rgba(56,189,248,1)] backdrop-blur-xl">
                <svg viewBox="0 0 500 440" className="w-full animate-float" role="img" aria-label="LumenShake payroll crystal">
                  <defs>
                    <linearGradient id="crystalMain" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#cffafe" />
                      <stop offset="50%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>
                    <linearGradient id="crystalBase" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#164e63" />
                      <stop offset="100%" stopColor="#0b1327" />
                    </linearGradient>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="10" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  <polygon points="250,24 336,168 164,168" fill="url(#crystalMain)" filter="url(#glow)" />
                  <polygon points="122,170 378,170 420,298 80,298" fill="url(#crystalBase)" stroke="#7dd3fc" strokeWidth="2" />
                  <polygon points="152,186 348,186 372,274 128,274" fill="rgba(56,189,248,0.23)" stroke="rgba(186,230,253,0.8)" strokeWidth="1.5" />
                  <text
                    x="250"
                    y="245"
                    textAnchor="middle"
                    fill="#e0f2fe"
                    style={{ fontSize: '58px', fontWeight: 700, letterSpacing: '2px' }}
                    className="font-display"
                  >
                    USDC
                  </text>
                  <circle cx="110" cy="333" r="10" fill="#38bdf8" opacity="0.75" />
                  <circle cx="390" cy="325" r="7" fill="#5eead4" opacity="0.7" />
                  <path d="M56 338 C118 330, 172 352, 236 344" stroke="#67e8f9" strokeWidth="2" fill="none" opacity="0.5" />
                  <path d="M240 344 C304 336, 356 356, 442 340" stroke="#93c5fd" strokeWidth="2" fill="none" opacity="0.55" />
                </svg>
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { value: '550k+', label: 'Cash-out touchpoints' },
              { value: '24/7', label: 'Support coverage' },
              { value: '<5s', label: 'Average settlement' },
              { value: '99.99%', label: 'Payroll execution uptime' },
            ].map((stat) => (
              <article
                key={stat.label}
                className="rounded-2xl border border-white/12 bg-white/[0.03] p-5 backdrop-blur-xl transition-transform hover:-translate-y-1"
              >
                <p className="font-display text-3xl font-semibold text-cyan-200">{stat.value}</p>
                <p className="mt-1 text-sm text-slate-300">{stat.label}</p>
              </article>
            ))}
          </section>

          <section id="features" className="space-y-8">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">Secure and Private</p>
              <h2 className="mt-3 font-display text-3xl font-semibold text-white md:text-4xl">
                Built for Real Payroll Pressure
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-slate-300">
                Every surface is designed to move funds quickly, protect operations, and give finance teams confidence from day one.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {featureCards.map((card, index) => (
                <article
                  key={card.title}
                  className="group relative rounded-3xl border border-white/12 bg-[linear-gradient(165deg,rgba(15,23,42,0.94),rgba(12,18,36,0.85))] p-6 shadow-[0_25px_70px_-45px_rgba(56,189,248,0.9)] transition-all hover:-translate-y-1.5 hover:border-cyan-300/35"
                >
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-200/35 bg-cyan-300/15 text-cyan-100">
                    {index === 0 && (
                      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M12 3v18M7 8h10M7 16h10" />
                        <path d="M5 12h14" />
                      </svg>
                    )}
                    {index === 1 && (
                      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M4 12h16" />
                        <path d="m13 5 7 7-7 7" />
                      </svg>
                    )}
                    {index === 2 && (
                      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M12 3 5 7v5c0 5 3.4 8.2 7 9 3.6-.8 7-4 7-9V7l-7-4Z" />
                      </svg>
                    )}
                  </div>

                  <h3 className="font-display text-2xl font-semibold text-white">{card.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">{card.description}</p>
                  <p className="mt-5 text-sm font-semibold text-cyan-200">{card.chip}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <h2 className="font-display text-3xl font-semibold leading-tight text-white sm:text-4xl">
                Trade with confidence and run payroll from one resilient platform.
              </h2>
              <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-300">
                Follow live transfer status, automate treasury routines, and keep every stakeholder informed with clear operational telemetry.
              </p>

              <ul className="mt-7 space-y-3 text-slate-200">
                {[
                  'Dedicated payroll orchestration with recurring schedules',
                  'Live settlement states, retries, and exception visibility',
                  'Cash-out intelligence for local currency accessibility',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#flow"
                className="mt-8 inline-flex h-12 items-center justify-center rounded-xl border border-cyan-300/45 bg-cyan-300/10 px-6 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-300/20"
              >
                Explore Flow
              </a>
            </div>

            <div className="relative mx-auto w-full max-w-[460px] rounded-[2rem] border border-white/15 bg-white/[0.05] p-8 backdrop-blur-xl">
              <div className="absolute -right-9 -top-8 h-24 w-24 rounded-2xl border border-cyan-300/40 bg-cyan-300/20 blur-[1px]" />
              <div className="absolute -bottom-9 -left-8 h-28 w-28 rounded-3xl border border-sky-300/35 bg-sky-300/20" />

              <div className="relative grid grid-cols-3 gap-4">
                {[72, 108, 142, 84, 126, 102].map((height, index) => (
                  <div
                    key={height + index}
                    className="rounded-xl border border-cyan-300/30 bg-[linear-gradient(180deg,rgba(103,232,249,0.65),rgba(30,64,175,0.25))]"
                    style={{ height: `${height}px` }}
                  />
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-cyan-200/25 bg-[#081325]/95 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">Live batch</p>
                <p className="mt-2 font-display text-2xl font-semibold text-white">USDC 148,290</p>
                <p className="mt-1 text-sm text-slate-300">28 salaries processing now</p>
              </div>
            </div>
          </section>

          <section id="flow" className="space-y-8">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">How it works</p>
              <h2 className="mt-3 font-display text-3xl font-semibold text-white md:text-4xl">Simple, Fast, Controlled</h2>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {steps.map((step, index) => (
                <article
                  key={step.title}
                  className="rounded-2xl border border-white/12 bg-white/[0.03] p-6 backdrop-blur-xl"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-cyan-300/20 font-display text-sm font-semibold text-cyan-100">
                    0{index + 1}
                  </span>
                  <h3 className="mt-4 font-display text-xl font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">{step.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="faq" className="space-y-8">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">FAQ</p>
              <h2 className="mt-3 font-display text-3xl font-semibold text-white md:text-4xl">Answers Before You Deploy</h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {faqs.map((faq, index) => (
                <article
                  key={faq.question}
                  className="rounded-2xl border border-white/12 bg-[#0b1428]/90 p-1 transition-colors hover:border-cyan-300/40"
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="flex w-full items-center justify-between gap-4 rounded-xl px-5 py-4 text-left"
                  >
                    <span className="font-medium text-white">{faq.question}</span>
                    <svg
                      className={`h-5 w-5 flex-shrink-0 text-cyan-200 transition-transform ${
                        openFAQ === index ? 'rotate-180' : ''
                      }`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                    </svg>
                  </button>

                  {openFAQ === index && (
                    <div className="px-5 pb-5">
                      <p className="text-sm leading-relaxed text-slate-300">{faq.answer}</p>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-cyan-300/25 bg-[linear-gradient(115deg,rgba(8,47,73,0.86),rgba(8,37,56,0.86),rgba(15,23,42,0.9))] px-6 py-12 text-center shadow-[0_35px_90px_-40px_rgba(6,182,212,0.95)] md:px-12">
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-200/80">Ready to launch</p>
            <h2 className="mt-4 font-display text-3xl font-semibold text-white md:text-4xl">
              Build a Payroll Experience Teams Actually Trust
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-200/90">
              Connect your wallet, configure your payout logic, and ship global payroll with the speed and transparency modern teams expect.
            </p>
            <button
              onClick={wallet.connectWallet}
              disabled={wallet.loading || wallet.isConnected}
              className={`mt-8 inline-flex h-12 items-center justify-center rounded-xl px-7 text-sm font-semibold transition-all ${
                wallet.isConnected
                  ? 'cursor-default border border-emerald-300/35 bg-emerald-500/15 text-emerald-200'
                  : 'bg-white text-slate-900 shadow-[0_24px_45px_-22px_rgba(255,255,255,0.65)] hover:-translate-y-0.5'
              }`}
            >
              {wallet.isConnected ? walletAddressLabel : 'Connect Wallet to Start'}
            </button>
          </section>
        </main>

        <footer className="mt-16 border-t border-white/10 pt-7 text-sm text-slate-400">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p>© 2026 LumenShake. Designed for global payroll execution.</p>
            <div className="flex items-center gap-5">
              <a href="#features" className="transition-colors hover:text-cyan-200">
                Features
              </a>
              <a href="#flow" className="transition-colors hover:text-cyan-200">
                Flow
              </a>
              <a href="#faq" className="transition-colors hover:text-cyan-200">
                Support
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
