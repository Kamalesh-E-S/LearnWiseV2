import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ArrowRight } from 'lucide-react';

/* ── SVG dot-pattern background (inline so no extra files needed) ── */
const heroPatternUrl = `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 86c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm76-52c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm-3-11c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zM11 73c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm7-47c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z' fill='%231a202c' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E")`;

export function Home() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <div className="font-sans text-midnight bg-parchment antialiased min-h-screen">

      {/* ── HEADER ── */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-midnight">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">LearnWise</span>
          </div>

          {/* Right CTAs */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link to="/ongoing" className="text-sm font-semibold text-midnight px-4 py-2 hover:text-coral transition-colors">
                  My Roadmaps
                </Link>
                <Link
                  to="/create"
                  className="bg-coral text-white text-sm font-semibold px-6 py-2.5 rounded-full hover:opacity-90 transition-all shadow-sm"
                >
                  + New Roadmap
                </Link>
              </>
            ) : (
              <>
                <Link to="/auth" className="text-sm font-semibold text-midnight px-4 py-2 hover:text-coral transition-colors">
                  Log In
                </Link>
                <Link
                  to="/auth"
                  className="bg-coral text-white text-sm font-semibold px-6 py-2.5 rounded-full hover:opacity-90 transition-all shadow-sm"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main>
        {/* ── HERO ── */}
        <section
          style={{ backgroundColor: '#f4f7f4', backgroundImage: heroPatternUrl }}
          className="pt-36 pb-24 lg:pt-56 lg:pb-44 px-4"
        >
          <div className="max-w-5xl mx-auto text-center">
            <h1
              className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-midnight mb-8 leading-[1.1]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Master Your Craft,{' '}
              <span className="italic text-coral">One Step</span> at a Time
            </h1>

            <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
              Leave the generic behind. Embrace a curated AI-powered learning path designed for the modern artisan, thinker, and doer.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <Link
                to={isAuthenticated ? '/create' : '/auth'}
                className="w-full sm:w-auto bg-coral text-white text-lg font-bold px-10 py-5 rounded-2xl hover:scale-105 transition-all flex items-center justify-center gap-3 shadow-xl"
                style={{ boxShadow: '0 20px 40px rgba(255,127,80,0.25)' }}
              >
                Begin Your Journey
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to={isAuthenticated ? '/ongoing' : '/auth'}
                className="w-full sm:w-auto bg-transparent text-midnight text-lg font-semibold px-10 py-5 rounded-2xl border-2 border-midnight/10 hover:border-midnight/30 transition-all"
              >
                {isAuthenticated ? 'View Roadmaps' : 'See the Curriculum'}
              </Link>
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="py-24 bg-white" id="features">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2
                className="text-4xl md:text-5xl font-bold text-midnight mb-4"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                The Art of Learning
              </h2>
              <p className="text-lg text-slate-500 max-w-xl mx-auto">
                Built for those who value depth, structure, and a touch of human guidance in their digital education.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1 */}
              <div className="p-10 rounded-3xl bg-white border border-midnight/5 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                <div className="w-16 h-16 bg-sage rounded-2xl flex items-center justify-center mb-8 rotate-3">
                  <svg className="w-8 h-8 text-midnight" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-midnight mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Curated Paths
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Forget endless lists. We weave skills into stories, ensuring every lesson builds toward a masterpiece you can call your own.
                </p>
              </div>

              {/* Card 2 */}
              <div className="p-10 rounded-3xl bg-white border border-midnight/5 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 md:mt-12">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 -rotate-3" style={{ background: 'rgba(255,127,80,0.1)' }}>
                  <svg className="w-8 h-8 text-coral" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-midnight mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Mindful Momentum
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Track growth through meaningful milestones, not just checkboxes. Visualize your evolution from novice to expert.
                </p>
              </div>

              {/* Card 3 */}
              <div className="p-10 rounded-3xl bg-white border border-midnight/5 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 md:mt-24">
                <div className="w-16 h-16 bg-midnight/5 rounded-2xl flex items-center justify-center mb-8 rotate-6">
                  <svg className="w-8 h-8 text-midnight" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-midnight mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Life-First Rhythm
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Your learning should breathe. Our tools adapt to your life's changing tempo, keeping you on track without the burn-out.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-24 bg-sage/50">
          <div className="max-w-5xl mx-auto px-4">
            <div
              className="bg-midnight text-white p-12 md:p-20 rounded-[3rem] text-center relative overflow-hidden"
              style={{ boxShadow: '0 40px 80px rgba(26,32,44,0.25)' }}
            >
              {/* Subtle dot overlay */}
              <div
                className="absolute inset-0 opacity-5 pointer-events-none"
                style={{ backgroundImage: heroPatternUrl }}
              />

              <h2
                className="text-4xl md:text-6xl font-bold mb-8 relative z-10"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Ready to build something{' '}
                <span className="text-coral italic">timeless</span>?
              </h2>
              <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto font-light relative z-10">
                Join a community that values craft over speed. Your first chapter begins today.
              </p>
              <Link
                to={isAuthenticated ? '/create' : '/auth'}
                className="inline-block bg-coral text-white text-xl font-bold px-12 py-6 rounded-2xl hover:bg-white hover:text-midnight transition-all hover:scale-105 transform shadow-2xl relative z-10"
              >
                {isAuthenticated ? 'Create a Roadmap' : 'Claim Your Seat'}
              </Link>
              <p className="mt-8 text-sm text-slate-400 font-medium relative z-10 italic">
                Hand-crafted AI education • Free to get started
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-white py-12 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-midnight rounded flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </div>
              <span className="text-lg font-bold text-slate-900">LearnWise</span>
            </div>

            <div className="flex gap-8 text-sm text-slate-500">
              <a href="#features" className="hover:text-coral transition-colors">Features</a>
              <a href="#" className="hover:text-coral transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-coral transition-colors">Terms of Service</a>
            </div>

            <p className="text-sm text-slate-400">© 2025 LearnWise. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}