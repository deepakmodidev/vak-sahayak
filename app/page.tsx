import Link from 'next/link';
import { Mic, Ear, Brain, Volume2, CheckCircle, ArrowRight } from 'lucide-react';

/**
 * PRODUCTION-GRADE MODULAR PITCH DECK
 * 
 * Each section is isolated for maintainability while strictly preserving
 * the "No-Fluff" design system and sub-second animation performance.
 */

// --- 1. SHARED ASSETS & BACKGROUNDS ---

function BackgroundMotif() {
  return (
    <div className="absolute top-0 left-0 w-full z-10 overflow-hidden pointer-events-none opacity-60">
      <img 
        src="https://assets.sarvam.ai/assets/home/hero-gradient.svg" 
        className="w-full h-auto object-cover transform -translate-y-2/3 scale-150" 
        alt=""
      />
    </div>
  );
}

// --- 2. HEADER & NAVIGATION ---

function MainHeader() {
  return (
    <header className="fixed top-4 z-50 w-full max-w-6xl px-6">
      <div className="bg-white border border-border rounded-full px-8 py-3 flex items-center justify-between shadow">
        <Link href="/" className="flex items-center gap-3">
          <img src="/vak-sahayak.png" alt="Logo" className="h-8 w-auto" />
          <span className="text-2xl font-serif font-bold tracking-tight">Vak Sahayak</span>
        </Link>
        <nav className="hidden lg:flex items-center gap-10 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          <Link href="/portal" className="hover:text-primary transition-colors">Portal</Link>
          <Link href="#technology" className="hover:text-primary transition-colors">Solution</Link>
          <Link href="#impact" className="hover:text-primary transition-colors">Impact</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/portal" className="bg-[#111111] text-white px-6 py-2 rounded-full text-xs font-semibold hover:bg-black transition-all">
            Launch Portal
          </Link>
          <Link href="/portal" className="bg-secondary text-secondary-foreground border border-border px-6 py-2 rounded-full text-xs font-semibold hover:bg-muted transition-all">
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
    <section className="pt-32 pb-16 flex flex-col items-center text-center px-6 max-w-6xl">
      <div className="mb-4">
        <img src="https://assets.sarvam.ai/assets/svgs/motif.svg" alt="" className="h-10 w-auto" />
      </div>

      <div className="mb-10 w-full max-w-md mx-auto flex flex-col items-center">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-80"></div>
        <div className="py-4">
          <span className="text-sm font-medium tracking-[0.2em] uppercase text-indigo-900/90">
            Bharat&apos;s Sovereign Voice Assistant
          </span>
        </div>
        <div className="w-full h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-80"></div>
      </div>

      <h1 className="text-5xl md:text-7xl font-serif leading-tight tracking-tight mb-8">
        Bharat&apos;s Sovereign Voice Platform.
      </h1>

      <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-12 max-w-4xl font-medium text-center">
        Simplified public services through natural conversation.<br />
        Filling government forms is now as simple as speaking.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Link href="/portal" className="bg-[#111111] text-white px-10 py-4 rounded-full text-base font-semibold hover:bg-black transition-all shadow-md">
          Launch Vak Sahayak
        </Link>
        <Link href="#impact" className="bg-white text-foreground border border-border px-10 py-4 rounded-full text-base font-semibold hover:bg-secondary transition-all">
          View Key Use Cases
        </Link>
      </div>

      <div className="pt-20 w-full">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground mb-10">Integration Tech Stack</p>
        <div className="flex flex-wrap justify-center items-center gap-x-16 gap-y-8 grayscale opacity-50 contrast-125 scale-90">
          <div className="text-3xl font-bold tracking-widest">LiveKit</div>
          <img src="https://assets.sarvam.ai/assets/svgs/sarvam-wordmark-black.svg" className="h-5" alt="Sarvam AI" />
          <div className="text-3xl font-bold tracking-widest">Groq</div>
        </div>
      </div>
    </section>
  );
}

// --- 4. SLIDE 01: THE VISION ---

function VisionSection() {
  return (
    <section id="vision" className="w-full py-32 border-t border-border bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-20">
          <div className="lg:w-1/2">
            <div className="text-xs font-bold tracking-[0.3em] uppercase text-primary mb-12">01 / 04 — The Vision</div>
            <h2 className="text-4xl md:text-5xl font-serif leading-tight mb-8">
              Bridging the language gap for the next billion.
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-10">
              India&apos;s digital growth is limited by language barriers. Vak Sahayak brings sovereign AI to the grassroots, making complex government services accessible to every citizen in all 22 scheduled regional languages.
            </p>
            <div className="flex items-center gap-6">
              <span className="text-sm font-semibold uppercase tracking-widest text-foreground">Sovereign. Multilingual. Scale.</span>
            </div>
          </div>
          <div className="lg:w-1/2 relative">
            <img 
              src="https://assets.sarvam.ai/tr:f-auto/assets/companyLogos/home-section-2.webp" 
              alt="Vision Map" 
              className="w-full h-auto rounded-3xl"
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
    <section id="technology" className="w-full py-32 border-t border-border bg-white relative overflow-hidden">
      {/* Sovereign Mesh Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(190,18,60,0.05),transparent)] pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://assets.sarvam.ai/assets/home/hero-gradient.svg')] opacity-[0.03] grayscale pointer-events-none transform rotate-180"></div>
      
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="flex flex-col items-center text-center mb-24">
          <div className="text-xs font-bold tracking-[0.3em] uppercase text-primary mb-12">02 / 04 — Technology</div>
          <h2 className="text-4xl md:text-5xl font-serif leading-tight mb-8">
            The Vak Sahayak Intelligence Pipeline.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl">
            A sub-second loop that transforms raw audio into sovereign intelligence and empathetic response.
          </p>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
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
        `}} />

        <div className="relative flex flex-col lg:flex-row items-stretch justify-between gap-8 lg:gap-0">
          <div className="hidden lg:block absolute top-[2.5rem] left-0 w-full h-1 bg-indigo-100 z-0 overflow-hidden pipeline-track rounded-full">
            <div className="absolute top-0 left-0 w-1/4 h-full bg-gradient-to-r from-transparent via-primary to-transparent falling-beam" style={{ animationDelay: '0s' }}></div>
            <div className="absolute top-0 left-0 w-1/4 h-full bg-gradient-to-r from-transparent via-primary to-transparent falling-beam" style={{ animationDelay: '1.5s' }}></div>
            <div className="absolute top-0 left-0 w-1/4 h-full bg-gradient-to-r from-transparent via-primary to-transparent falling-beam" style={{ animationDelay: '3s' }}></div>
          </div>

          {[
            { label: "Input", title: "User Voice", desc: "11+ regional accents", Icon: Mic },
            { label: "Listen", title: "Saaras STT", desc: "22-language ASR", Icon: Ear },
            { label: "Think", title: "Sovereign LLM", desc: "Intent & Reasoning", Icon: Brain },
            { label: "Speak", title: "Bulbul TTS", desc: "Natural Synthesis", Icon: Volume2 },
            { label: "Output", title: "Citizen Help", desc: "Real-time Action", Icon: CheckCircle }
          ].map((step, i) => (
            <div key={i} className="relative z-10 flex flex-col items-center lg:w-1/5 group">
              <div className="w-20 h-20 rounded-full bg-white border border-border flex items-center justify-center shadow-sm group-hover:border-primary group-hover:scale-110 transition-all duration-500 mb-8 pulse-icon" style={{ animationDelay: `${i * 0.5}s` }}>
                <step.Icon className="w-8 h-8 text-primary group-hover:text-primary transition-colors" />
              </div>
              <div className="text-center px-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary block mb-2">{step.label}</span>
                <h4 className="font-bold text-base mb-2 uppercase tracking-tight text-indigo-950">{step.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
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
    <section id="impact" className="w-full py-32 border-t border-border bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-24">
          <div className="text-xs font-bold tracking-[0.3em] uppercase text-primary mb-6 text-center">03 / 04 — Impact</div>
          <h2 className="text-4xl md:text-5xl font-serif leading-tight mb-8 text-center max-w-3xl mx-auto">
            Transforming public service delivery at every level.
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {[
            { title: "Aadhaar Registration", desc: "Helping citizens update their biometrics and demographic details via simple voice commands.", color: "bg-blue-50/80" },
            { title: "Kisan Credit Card", desc: "Enabling farmers to apply for credit and view schemes in their regional dialect without intermediaries.", color: "bg-emerald-50/80" },
            { title: "Direct Benefit Transfer", desc: "Simplified verification for welfare schemes, pensions, and subsidies for elderly citizens.", color: "bg-orange-50/80" },
            { title: "Ayushman Bharat", desc: "Voice-based registration for health IDs and checking eligibility for cashless medical treatment.", color: "bg-rose-50/80" },
            { title: "MGNREGA Payments", desc: "Allowing rural workers to check job card status and track pending wage payments via simple voice queries.", color: "bg-violet-50/80" },
            { title: "LPG Gas Booking", desc: "Enabling seamless cylinder booking and subsidy tracking for Ujjwala beneficiaries in 22+ regional variants.", color: "bg-teal-50/80" }
          ].map((item, i) => (
            <div key={i} className={`p-10 rounded-3xl border border-border ${item.color} flex flex-col justify-between group h-full`}>
              <div>
                <img 
                  src="https://assets.sarvam.ai/assets/product-samvaad/products/samvaad-motif-02.svg" 
                  alt="" 
                  className="h-12 w-auto mb-10 opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500" 
                />
                <h3 className="text-2xl font-serif mb-4 leading-tight">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
              <div className="mt-12 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] hover:text-primary hover:translate-x-1 transition-all cursor-pointer">
                Solution Details <ArrowRight className="w-4 h-4" />
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
  return (
    <section id="languages" className="w-full py-32 border-t border-border bg-[#fafafa]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col items-center text-center mb-24">
          <div className="text-xs font-bold tracking-[0.3em] uppercase text-primary mb-12">04 / 04 — Languages</div>
          <h2 className="text-4xl md:text-6xl font-serif leading-tight mb-8">
            Voices that Power a Nation.
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl">
            True sovereignty starts with language. Vak Sahayak supports the 22 scheduled languages of Bharat, ensuring no citizen is left behind.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          <div className="lg:w-5/12 flex justify-center">
            <div className="relative group w-full max-w-sm">
              <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full scale-150 group-hover:bg-primary/10 transition-all duration-700"></div>
              <img 
                src="https://assets.sarvam.ai/assets/product-samvaad/products/samvaad-motif-01.svg" 
                alt="Vak Sahayak Motif" 
                className="relative z-10 w-full h-auto opacity-90 transition-transform duration-700 group-hover:scale-110 drop-shadow-2xl"
              />
            </div>
          </div>

          <div className="lg:w-7/12">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {[
                { name: "English", script: "Hello", color: "bg-slate-50/60" },
                { name: "Hindi", script: "नमस्ते", color: "bg-orange-50/60" },
                { name: "Bengali", script: "নমস্কার", color: "bg-blue-50/60" },
                { name: "Marathi", script: "नमस्कार", color: "bg-emerald-50/60" },
                { name: "Telugu", script: "నమస్కారం", color: "bg-yellow-50/60" },
                { name: "Tamil", script: "வணக்கம்", color: "bg-rose-50/60" },
                { name: "Gujarati", script: "નમસ્તે", color: "bg-indigo-50/60" },
                { name: "Urdu", script: "السلام علیکم", color: "bg-zinc-50/60" },
                { name: "Kannada", script: "ನಮಸ್ಕಾರ", color: "bg-cyan-50/60" },
                { name: "Odia", script: "ନମସ୍କାର", color: "bg-amber-50/60" },
                { name: "Malayalam", script: "നമസ്കാരം", color: "bg-lime-50/60" },
                { name: "Punjabi", script: "ਸਤਿ ਸ੍ਰੀ ਅকাল", color: "bg-teal-50/60" },
                { name: "Assamese", script: "নমস্কাৰ", color: "bg-sky-50/60" },
                { name: "Maithili", script: "नमस्कार", color: "bg-fuchsia-50/60" },
                { name: "Santali", script: "ᱡᱚᱦᱟᱨ", color: "bg-slate-50/60" },
                { name: "Kashmiri", script: "نمستے", color: "bg-violet-50/60" },
                { name: "Nepali", script: "नमस्ते", color: "bg-red-50/60" },
                { name: "Sindhi", script: "نمستي", color: "bg-pink-50/60" },
                { name: "Konkani", script: "नमस्कार", color: "bg-emerald-50/50" },
                { name: "Dogri", script: "नमस्ते", color: "bg-indigo-50/50" },
                { name: "Manipuri", script: "খুরুমজরি", color: "bg-orange-50/50" },
                { name: "Bodo", script: "खुलुमबाय", color: "bg-blue-50/50" },
                { name: "Sanskrit", script: "नमो नमः", color: "bg-yellow-50/50" }
              ].map((lang, i) => (
                <div key={i} className={`py-2 px-3 rounded-xl border border-border ${lang.color} flex flex-col items-center justify-center text-center group hover:border-primary transition-all cursor-default`}>
                  <div className="text-lg font-bold mb-0.5 text-indigo-950">{lang.script}</div>
                  <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground group-hover:text-primary">{lang.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// --- 8. CALL TO ACTION & FOOTER ---

function CTASection() {
  return (
    <section className="w-full py-32 border-t border-border">
      <div className="max-w-6xl mx-auto px-6">
        <div className="bg-gradient-to-b from-[#1c2130] via-[#3b4765] to-[#c6d4ee] rounded-3xl p-16 md:p-24 text-center text-white relative overflow-hidden group shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2),_0_10px_40px_rgba(0,0,0,0.05)]">
           <div className="relative z-10 w-full flex flex-col items-center">
              <h2 className="text-4xl md:text-5xl font-serif mb-10 text-center text-white">Empower Bharat with Voice.</h2>
              <p className="text-lg md:text-xl text-white/80 mb-14 max-w-xl leading-relaxed text-center mx-auto">
                Deploy Vak Sahayak in your organization and bridge the digital language gap for every citizen.
              </p>
              <Link href="/portal" className="bg-gradient-to-b from-[#e2e8f4] to-[#c1ccdf] text-[#1c2130] px-12 py-5 rounded-full text-lg font-bold hover:brightness-110 transition-all shadow-[inset_0_-2px_10px_rgba(0,0,0,0.1),_0_10px_20px_rgba(0,0,0,0.1)] hover:scale-105">
                Get Started Now
              </Link>
           </div>
           <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 h-64 w-64 pointer-events-none">
             <img 
               src="https://assets.sarvam.ai/assets/svgs/motif.svg" 
               className="w-full h-full object-contain transform rotate-180 mix-blend-screen" 
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
    <div className="relative min-h-screen bg-transparent text-foreground font-sans selection:bg-primary selection:text-white flex flex-col items-center">
      <BackgroundMotif />

      <div className="relative z-10 w-full flex flex-col items-center">
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
