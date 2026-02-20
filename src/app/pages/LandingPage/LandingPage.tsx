import './LandingPage.css'

export default function LandingPage() {
  return (
    <div className="landing-page-container bg-bg-base text-text-primary overflow-hidden">

      <div className="orb orb-purple" />
      <div className="orb orb-cyan" />

      <div className="dot-grid" />

      <nav className="relative z-10 flex items-center justify-between px-10 py-5">
        <div className="flex items-center gap-2.5">
          <span className="text-base font-bold tracking-widest uppercase text-text-primary opacity-90">
            JobScraper
          </span>
        </div>
        <a href="/api/auth/signin" className="btn-primary">
          Sign in with Google
        </a>
      </nav>

      <main className="relative z-10 flex h-[calc(100vh-72px)] flex-col items-center justify-center px-6 text-center">
        <h1 className="headline mb-5">
          Stop applying to{' '}
          <br />
          <span className="glow-text-primary">jobs you won't get.</span>
        </h1>

        <p className="mb-10 max-w-md text-base leading-relaxed text-text-secondary">
          Drop in your resume. We scrape the web, score every listing against your experience,
          and show you what's actually worth applying to.
        </p>

        <a href="/api/auth/signin" className="btn-hero mb-16">
          Get started &rarr;
        </a>

        <div className="mock-card">
          <div className="mock-card-inner">
            <div className="flex items-start justify-between gap-4">
              <div className="text-left">
                <div className="mb-1 text-sm font-semibold text-text-primary">Senior Frontend Engineer</div>
                <div className="text-xs text-text-muted">Stripe · Remote · $160–200k</div>
              </div>
              <div className="match-badge">94%</div>
            </div>
            <div className="mt-3 flex gap-2">
              {['React', 'TypeScript', 'Next.js'].map(s => (
                <span key={s} className="skill-chip">{s}</span>
              ))}
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}