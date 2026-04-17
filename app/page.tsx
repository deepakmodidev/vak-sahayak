import Link from 'next/link';

export default function MarketingPage() {
  return (
    <div className="relative min-h-screen bg-transparent text-foreground font-sans selection:bg-primary selection:text-white flex flex-col items-center">
      {/* 1. Hero Gradient Background */}
      <div className="absolute top-0 left-0 w-full z-10 overflow-hidden pointer-events-none opacity-60">
        <img 
          src="https://assets.sarvam.ai/assets/home/hero-gradient.svg" 
          className="w-full h-full object-cover transform -translate-y-1/4" 
          alt=""
        />
      </div>

      <div className="relative z-10 w-full flex flex-col items-center">
        {/* 2. Header */}
        <header className="fixed top-8 z-50 w-full max-w-6xl px-6">
          <div className="bg-white border border-border rounded-full px-8 py-3 flex items-center justify-between shadow-sm">
            <Link href="/" className="flex items-center gap-3">
              <img src="/vak-sahayak.png" alt="Logo" className="h-7 w-auto" />
              <span className="text-xl font-semibold tracking-tight">Vak Sahayak</span>
            </Link>
            <nav className="hidden lg:flex items-center gap-10 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              <Link href="/portal" className="hover:text-primary transition-colors">Portal</Link>
              <Link href="#" className="hover:text-primary transition-colors">Solution</Link>
              <Link href="#" className="hover:text-primary transition-colors">Security</Link>
              <Link href="#" className="hover:text-primary transition-colors">Company</Link>
            </nav>
            <div className="flex items-center gap-3">
              <Link href="/portal" className="bg-[#111111] text-white px-6 py-2 rounded-full text-xs font-semibold hover:bg-black transition-all">
                Launch Portal
              </Link>
              <Link href="#" className="bg-secondary text-secondary-foreground border border-border px-6 py-2 rounded-full text-xs font-semibold hover:bg-muted transition-all">
                Talk to Sales
              </Link>
            </div>
          </div>
        </header>

        {/* 3. Hero Section */}
        <section className="pt-32 pb-16 flex flex-col items-center text-center px-6 max-w-6xl">
          <div className="mb-4">
            <img src="https://assets.sarvam.ai/assets/svgs/motif.svg" alt="" className="h-10 w-auto" />
          </div>

          <div className="bg-indigo-50 border border-indigo-100 text-indigo-600 px-5 py-1 rounded-full mb-10">
            <span className="text-xs font-semibold tracking-wide">Bharat&apos;s Sovereign Voice Platform</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-serif leading-tight tracking-tight mb-8">
            Voice portals for every citizen.
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-12 max-w-4xl font-medium">
            Simplified public services through natural conversation.<br />
            Filling government forms is now as simple as speaking.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link href="/portal" className="bg-[#111111] text-white px-10 py-4 rounded-full text-base font-semibold hover:bg-black transition-all shadow-md">
              Launch Voice Portal
            </Link>
            <Link href="#" className="bg-white text-foreground border border-border px-10 py-4 rounded-full text-base font-semibold hover:bg-secondary transition-all">
              Explore Form Library
            </Link>
          </div>
        </section>

        {/* 4. Footer Credit */}
        <div className="w-full max-w-6xl px-6">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground mb-10">Powered by Frontier Infrastructure</p>
            <div className="flex flex-wrap justify-center items-center gap-x-16 gap-y-8 grayscale opacity-50 contrast-125">
              <img src="https://assets.sarvam.ai/assets/svgs/sarvam-wordmark-black.svg" className="h-5" alt="Sarvam AI" />
              <div className="text-lg font-black tracking-tighter">LIVEKIT</div>
              <div className="text-lg font-black tracking-tighter">GROQ</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
