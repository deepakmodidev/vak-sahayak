import Link from 'next/link';
import { ArrowRight, Brain, CheckCircle, Ear, Mic, Volume2 } from 'lucide-react';

/**
 * PRODUCTION-GRADE MODULAR PITCH DECK
 *
 * Each section is isolated for maintainability while strictly preserving
 * the "No-Fluff" design system and sub-second animation performance.
 */

// --- 1. SHARED ASSETS & BACKGROUNDS ---

function BackgroundMotif() {
  return (
    <div className="pointer-events-none absolute top-0 left-0 z-10 w-full overflow-hidden opacity-60">
      <img
        src="https://assets.sarvam.ai/assets/pages/home/hero-gradient.svg"
        className="h-auto w-full -translate-y-2/3 scale-150 transform object-cover"
        alt=""
      />
    </div>
  );
}

// --- 2. HEADER & NAVIGATION ---

function MainHeader() {
  return (
    <header className="fixed top-4 z-50 w-full max-w-6xl px-4 sm:px-6">
      <div className="border-border flex items-center justify-between gap-2 rounded-full border bg-white px-4 py-3 shadow sm:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <img src="/vak-sahayak.png" alt="Logo" className="h-8 w-auto" />
          <span className="font-serif text-xl font-bold tracking-tight sm:text-2xl">Vak Sahayak</span>
        </Link>
        <nav className="text-muted-foreground hidden items-center gap-10 text-xs font-medium tracking-widest uppercase lg:flex">
          <Link href="/portal" className="hover:text-primary transition-colors">
            Portal
          </Link>
          <Link href="#technology" className="hover:text-primary transition-colors">
            Solution
          </Link>
          <Link href="#impact" className="hover:text-primary transition-colors">
            Impact
          </Link>
        </nav>
        <div className="flex shrink-0 items-center gap-3">
          <Link
            href="/portal"
            className="rounded-full bg-[#111111] px-4 py-2 text-xs font-semibold whitespace-nowrap text-white transition-all hover:bg-black sm:px-6"
          >
            Launch Portal
          </Link>
          <Link
            href="/portal"
            className="bg-secondary text-secondary-foreground border-border hover:bg-muted hidden rounded-full border px-6 py-2 text-xs font-semibold whitespace-nowrap transition-all sm:inline-flex"
          >
            Platform Help
          </Link>
        </div>
      </div>
    </header>
  );
}

// --- 3. HERO SECTION ---

function HeroSection() {
  return (
    <section className="flex max-w-6xl flex-col items-center px-6 pt-32 pb-16 text-center">
      <div className="mb-4">
        <img src="https://assets.sarvam.ai/assets/motifs/ui/motif.svg" alt="" className="h-10 w-auto" />
      </div>

      <div className="mx-auto mb-10 flex w-full max-w-md flex-col items-center">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-80"></div>
        <div className="py-4">
          <span className="text-sm font-medium tracking-[0.2em] text-indigo-900/90 uppercase">
            Bharat&apos;s Sovereign Voice Assistant
          </span>
        </div>
        <div className="h-px w-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-80"></div>
      </div>

      <h1 className="mb-8 font-serif text-5xl leading-tight tracking-tight md:text-7xl">
        Bharat&apos;s Sovereign Voice Platform.
      </h1>

      <p className="text-muted-foreground mb-12 max-w-4xl text-center text-lg leading-relaxed font-medium md:text-xl">
        Simplified public services through natural conversation.
        <br />
        Filling government forms is now as simple as speaking.
      </p>

      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <Link
          href="/portal"
          className="rounded-full bg-[#111111] px-10 py-4 text-base font-semibold text-white shadow-md transition-all hover:bg-black"
        >
          Launch Vak Sahayak
        </Link>
        <Link
          href="#impact"
          className="text-foreground border-border hover:bg-secondary rounded-full border bg-white px-10 py-4 text-base font-semibold transition-all"
        >
          View Key Use Cases
        </Link>
      </div>

      <div className="w-full pt-20">
        <p className="text-muted-foreground mb-10 text-xs font-bold tracking-[0.3em] uppercase">
          Integration Tech Stack
        </p>
        <div className="flex scale-90 flex-wrap items-center justify-center gap-x-16 gap-y-8 opacity-50 contrast-125 grayscale">
          <div className="text-3xl font-bold tracking-widest">LiveKit</div>
          <img
            src="https://assets.sarvam.ai/assets/brand/logos/sarvam-wordmark-black.svg"
            className="h-5"
            alt="Sarvam AI"
          />
          <div className="text-3xl font-bold tracking-widest">Groq</div>
        </div>
      </div>
    </section>
  );
}

// --- 4. SLIDE 01: THE VISION ---

function VisionSection() {
  return (
    <section id="vision" className="border-border w-full overflow-hidden border-t bg-white py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center gap-20 lg:flex-row">
          <div className="lg:w-1/2">
            <div className="text-primary mb-12 text-xs font-bold tracking-[0.3em] uppercase">
              01 / 04 — The Vision
            </div>
            <h2 className="mb-8 font-serif text-4xl leading-tight md:text-5xl">
              Bridging the language gap for the next billion.
            </h2>
            <p className="text-muted-foreground mb-10 text-lg leading-relaxed">
              India&apos;s digital growth is limited by language barriers. Vak Sahayak brings
              sovereign AI to the grassroots, making complex government services accessible to every
              citizen in all 22 scheduled regional languages.
            </p>
            <div className="flex items-center gap-6">
              <span className="text-foreground text-sm font-semibold tracking-widest uppercase">
                Sovereign. Multilingual. Scale.
              </span>
            </div>
          </div>
          <div className="relative lg:w-1/2">
            <img
              src="https://assets.sarvam.ai/tr:f-auto/assets/logos/customers/home-section-2.webp"
              alt="Vision Map"
              className="h-auto w-full rounded-3xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// --- 5. SLIDE 02: TECHNOLOGY PIPELINE ---

function TechnologyPipeline() {
  return (
    <section
      id="technology"
      className="border-border relative w-full overflow-hidden border-t bg-white py-32"
    >
      {/* Sovereign Mesh Gradient */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(190,18,60,0.05),transparent)]"></div>
      <div className="pointer-events-none absolute top-0 left-0 h-full w-full rotate-180 transform bg-[url('https://assets.sarvam.ai/assets/pages/home/hero-gradient.svg')] opacity-[0.03] grayscale"></div>

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div className="mb-24 flex flex-col items-center text-center">
          <div className="text-primary mb-12 text-xs font-bold tracking-[0.3em] uppercase">
            02 / 04 — Technology
          </div>
          <h2 className="mb-8 font-serif text-4xl leading-tight md:text-5xl">
            The Vak Sahayak Intelligence Pipeline.
          </h2>
          <p className="text-muted-foreground max-w-2xl text-lg">
            A sub-second loop that transforms raw audio into sovereign intelligence and empathetic
            response.
          </p>
        </div>

        <style
          dangerouslySetInnerHTML={{
            __html: `
          @keyframes beam-flow {
            0% { transform: translateX(-100%); opacity: 0; }
            20% { opacity: 1; }
            80% { opacity: 1; }
            100% { transform: translateX(500%); opacity: 0; }
          }
          @keyframes icon-pulse {
            0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(190, 18, 60, 0); }
            50% { transform: scale(1.05); box-shadow: 0 0 20px 2px rgba(190, 18, 60, 0.1); }
          }
          .pipeline-track {
            overflow: hidden;
            mask-image: linear-gradient(90deg, transparent, black 15%, black 85%, transparent);
          }
          .falling-beam {
            animation: beam-flow 4s infinite linear;
          }
          .pulse-icon {
            animation: icon-pulse 3s infinite ease-in-out;
          }
        `,
          }}
        />

        <div className="relative flex flex-col items-stretch justify-between gap-8 lg:flex-row lg:gap-0">
          <div className="pipeline-track absolute top-[2.5rem] left-0 z-0 hidden h-1 w-full overflow-hidden rounded-full bg-indigo-100 lg:block">
            <div
              className="via-primary falling-beam absolute top-0 left-0 h-full w-1/4 bg-gradient-to-r from-transparent to-transparent"
              style={{ animationDelay: '0s' }}
            ></div>
            <div
              className="via-primary falling-beam absolute top-0 left-0 h-full w-1/4 bg-gradient-to-r from-transparent to-transparent"
              style={{ animationDelay: '1.5s' }}
            ></div>
            <div
              className="via-primary falling-beam absolute top-0 left-0 h-full w-1/4 bg-gradient-to-r from-transparent to-transparent"
              style={{ animationDelay: '3s' }}
            ></div>
          </div>

          {[
            { label: 'Input', title: 'User Voice', desc: '11+ regional accents', Icon: Mic },
            { label: 'Listen', title: 'Saaras STT', desc: '22-language ASR', Icon: Ear },
            { label: 'Think', title: 'Sovereign LLM', desc: 'Intent & Reasoning', Icon: Brain },
            { label: 'Speak', title: 'Bulbul TTS', desc: 'Natural Synthesis', Icon: Volume2 },
            { label: 'Output', title: 'Citizen Help', desc: 'Real-time Action', Icon: CheckCircle },
          ].map((step, i) => (
            <div key={i} className="group relative z-10 flex flex-col items-center lg:w-1/5">
              <div
                className="border-border group-hover:border-primary pulse-icon mb-8 flex h-20 w-20 items-center justify-center rounded-full border bg-white shadow-sm transition-all duration-500 group-hover:scale-110"
                style={{ animationDelay: `${i * 0.5}s` }}
              >
                <step.Icon className="text-primary group-hover:text-primary h-8 w-8 transition-colors" />
              </div>
              <div className="px-4 text-center">
                <span className="text-primary mb-2 block text-[10px] font-bold tracking-[0.2em] uppercase">
                  {step.label}
                </span>
                <h4 className="mb-2 text-base font-bold tracking-tight text-indigo-950 uppercase">
                  {step.title}
                </h4>
                <p className="text-muted-foreground text-xs leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// --- 6. SLIDE 03: USE CASE IMPACT ---

function ImpactSection() {
  return (
    <section id="impact" className="border-border w-full border-t bg-white py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-24 text-center">
          <div className="text-primary mb-6 text-center text-xs font-bold tracking-[0.3em] uppercase">
            03 / 04 — Impact
          </div>
          <h2 className="mx-auto mb-8 max-w-3xl text-center font-serif text-4xl leading-tight md:text-5xl">
            Transforming public service delivery at every level.
          </h2>
        </div>

        <div className="mb-20 grid grid-cols-1 gap-8 md:grid-cols-3">
          {[
            {
              title: 'Aadhaar Registration',
              desc: 'Helping citizens update their biometrics and demographic details via simple voice commands.',
              color: 'bg-blue-50/80',
            },
            {
              title: 'Kisan Credit Card',
              desc: 'Enabling farmers to apply for credit and view schemes in their regional dialect without intermediaries.',
              color: 'bg-emerald-50/80',
            },
            {
              title: 'Direct Benefit Transfer',
              desc: 'Simplified verification for welfare schemes, pensions, and subsidies for elderly citizens.',
              color: 'bg-orange-50/80',
            },
            {
              title: 'Ayushman Bharat',
              desc: 'Voice-based registration for health IDs and checking eligibility for cashless medical treatment.',
              color: 'bg-rose-50/80',
            },
            {
              title: 'MGNREGA Payments',
              desc: 'Allowing rural workers to check job card status and track pending wage payments via simple voice queries.',
              color: 'bg-violet-50/80',
            },
            {
              title: 'LPG Gas Booking',
              desc: 'Enabling seamless cylinder booking and subsidy tracking for Ujjwala beneficiaries in 22+ regional variants.',
              color: 'bg-teal-50/80',
            },
          ].map((item, i) => (
            <div
              key={i}
              className={`border-border rounded-3xl border p-10 ${item.color} group flex h-full flex-col justify-between`}
            >
              <div>
                <img
                  src="https://www.sarvam.ai/assets/motifs/models/model-03.svg"
                  alt=""
                  className="mb-10 h-12 w-auto opacity-40 grayscale transition-all duration-500 group-hover:opacity-100 group-hover:grayscale-0"
                />
                <h3 className="mb-4 font-serif text-2xl leading-tight">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
              <div className="hover:text-primary mt-12 flex cursor-pointer items-center gap-3 text-xs font-bold tracking-[0.2em] uppercase transition-all hover:translate-x-1">
                Solution Details <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// --- 7. SLIDE 04: LINGUISTIC MOSAIC ---

function LinguisticMosaic() {
  const languages = [
    { name: 'English', script: 'Hello' },
    { name: 'Hindi', script: 'नमस्ते' },
    { name: 'Bengali', script: 'নমস্কার' },
    { name: 'Marathi', script: 'नमस्कार' },
    { name: 'Telugu', script: 'నమస్కారం' },
    { name: 'Tamil', script: 'வணக்கம்' },
    { name: 'Gujarati', script: 'નમસ્તે' },
    { name: 'Urdu', script: 'السلام علیکم' },
    { name: 'Kannada', script: 'ನಮಸ್ಕಾರ' },
    { name: 'Odia', script: 'ନମସ୍କାର' },
    { name: 'Malayalam', script: 'നമസ്കാരം' },
    { name: 'Punjabi', script: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ' },
    { name: 'Assamese', script: 'নমস্কাৰ' },
    { name: 'Maithili', script: 'नमस्कार' },
    { name: 'Santali', script: 'ᱡᱚᱦᱟᱨ' },
    { name: 'Kashmiri', script: 'نمستے' },
    { name: 'Nepali', script: 'नमस्ते' },
    { name: 'Sindhi', script: 'نمستي' },
    { name: 'Konkani', script: 'नमस्कार' },
    { name: 'Dogri', script: 'नमस्ते' },
    { name: 'Manipuri', script: 'খুরুমজরি' },
    { name: 'Bodo', script: 'खुलुमबाय' },
    { name: 'Sanskrit', script: 'नमो नमः' },
  ];
  const mid = Math.ceil(languages.length / 2);
  const columns = [languages.slice(0, mid), languages.slice(mid)];

  const renderCard = (lang: { name: string; script: string }, i: number) => (
    <div
      key={i}
      className="group hover:border-primary/40 flex cursor-default flex-col items-center justify-center gap-2 rounded-2xl border border-black/[0.06] bg-white/60 px-2 py-4 text-center backdrop-blur-sm transition-all duration-300 hover:bg-white"
    >
      <span className="text-foreground text-xl leading-none font-medium">{lang.script}</span>
      <span className="text-muted-foreground/60 group-hover:text-primary text-[10px] font-semibold tracking-[0.16em] uppercase transition-colors">
        {lang.name}
      </span>
    </div>
  );

  return (
    <section id="languages" className="border-border w-full border-t bg-[#fafafa] py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-24 flex flex-col items-center text-center">
          <div className="text-primary mb-12 text-xs font-bold tracking-[0.3em] uppercase">
            04 / 04 — Languages
          </div>
          <h2 className="mb-8 font-serif text-4xl leading-tight md:text-6xl">
            Voices that power a nation
          </h2>
          <p className="text-muted-foreground max-w-3xl text-lg">
            True sovereignty starts with language. Vak Sahayak supports the 22 scheduled languages
            of Bharat, ensuring no citizen is left behind.
          </p>
        </div>

        {/* Languages flank the motif: grid · image · grid */}
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-stretch lg:gap-10">
          {/* Left language column */}
          <div className="grid w-full grid-cols-2 gap-4 lg:flex-1">
            {columns[0].map(renderCard)}
          </div>

          {/* Center motif */}
          <div className="flex w-full items-center justify-center lg:w-[30rem] lg:shrink-0 xl:w-[36rem]">
            <div className="group relative mx-auto w-full max-w-sm lg:max-w-xl">
              <div className="bg-primary/5 group-hover:bg-primary/10 absolute inset-0 scale-150 rounded-full blur-3xl transition-all duration-700"></div>
              <img
                src="https://www.sarvam.ai/assets/motifs/models/model-01.svg"
                alt="Vak Sahayak Motif"
                className="relative z-10 h-auto w-full opacity-100 drop-shadow-2xl"
              />
            </div>
          </div>

          {/* Right language column */}
          <div className="grid w-full grid-cols-2 gap-4 lg:flex-1">
            {columns[1].map(renderCard)}
          </div>
        </div>
      </div>
    </section>
  );
}

// --- 8. CALL TO ACTION & FOOTER ---

function CTASection() {
  return (
    <section className="border-border w-full border-t py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#1c2130] via-[#3b4765] to-[#c6d4ee] p-16 text-center text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2),_0_10px_40px_rgba(0,0,0,0.05)] md:p-24">
          <div className="relative z-10 flex w-full flex-col items-center">
            <h2 className="mb-10 text-center font-serif text-4xl text-white md:text-5xl">
              Empower Bharat with Voice.
            </h2>
            <p className="mx-auto mb-14 max-w-xl text-center text-lg leading-relaxed text-white/80 md:text-xl">
              Deploy Vak Sahayak in your organization and bridge the digital language gap for every
              citizen.
            </p>
            <Link
              href="/portal"
              className="rounded-full bg-gradient-to-b from-[#e2e8f4] to-[#c1ccdf] px-12 py-5 text-sm sm:text-lg font-semibold text-[#1c2130] shadow-[inset_0_-2px_10px_rgba(0,0,0,0.1),_0_10px_20px_rgba(0,0,0,0.1)] transition-all hover:scale-105 hover:brightness-110"
            >
              Get Started Now
            </Link>
          </div>
          <div className="pointer-events-none absolute -bottom-16 left-1/2 h-64 w-64 -translate-x-1/2">
            <img
              src="https://assets.sarvam.ai/assets/motifs/ui/motif.svg"
              className="h-full w-full rotate-180 transform object-contain mix-blend-screen"
              alt=""
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// --- MAIN PAGE ASSEMBLY ---

export default function MarketingPage() {
  return (
    <div className="text-foreground selection:bg-primary relative flex min-h-screen w-full flex-col items-center overflow-x-clip bg-transparent font-sans selection:text-white">
      <BackgroundMotif />

      <div className="relative z-10 flex w-full flex-col items-center">
        <MainHeader />
        <HeroSection />

        {/* --- PITCH DECK SLIDES --- */}
        <VisionSection />
        <TechnologyPipeline />
        <ImpactSection />
        <LinguisticMosaic />
        <CTASection />

        <div className="w-full py-10" />
      </div>
    </div>
  );
}
