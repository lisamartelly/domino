import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const HERO_IMAGES = [
  "/images/hero/premium_photo-1696972235468-3bfa7fa8bd9e.jpg",
  "/images/hero/premium_photo-1762541155847-1a9759cb06b6.jpg",
  "/images/hero/premium_photo-1762644219831-f779400dc779 (1).jpg",
  "/images/hero/premium_photo-1697565995290-2b6f5dca294f.jpg",
  "/images/hero/premium_photo-1762541086016-11302dd8a73a.jpg",
];

const CYCLE_MS = 6000;

export function LandingPage() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setCurrent((i) => (i + 1) % HERO_IMAGES.length),
      CYCLE_MS
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {HERO_IMAGES.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-[1500ms] ease-in-out"
            style={{
              backgroundImage: `url('${src}')`,
              opacity: i === current ? 1 : 0,
            }}
          />
        ))}
        <div className="absolute inset-0 bg-charcoal-950/70" />

        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <img
            src="/images/logos/DSC_Primary_Cream.png"
            alt="Domino Social Club"
            className="h-28 md:h-40 mx-auto mb-10"
          />
          <p className="text-cream-100 text-lg md:text-xl leading-relaxed max-w-xl mx-auto mb-10">
            Real connections, curated with care. We learn who you are, then
            hand-pick someone worth meeting.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login?view=register"
              className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3.5 px-8 rounded-lg text-lg transition-colors shadow-lg hover:shadow-xl"
            >
              Join the club
            </Link>
            <Link
              to="/login"
              className="bg-white/10 hover:bg-white/20 backdrop-blur text-cream-50 font-semibold py-3.5 px-8 rounded-lg text-lg transition-colors border border-cream-50/25"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <svg
            className="w-6 h-6 text-cream-50/50 animate-bounce"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </section>

      {/* Divider */}
      <div className="h-1.5 bg-gradient-to-r from-primary-500 via-accent1-500 to-primary-500" />

      {/* How it works */}
      <section className="bg-cream-50 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-primary-500 font-bold text-sm tracking-[0.2em] uppercase text-center mb-3">
            The process
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-charcoal-900 text-center mb-4">
            How it works
          </h2>
          <p className="text-charcoal-500 text-center max-w-2xl mx-auto mb-14">
            No swiping. No algorithms. Just thoughtful people making thoughtful
            introductions.
          </p>

          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                step: "01",
                title: "Tell us about you",
                description:
                  "Fill out a short questionnaire so our matchmakers understand what makes you tick — your interests, values, and what you're looking for.",
              },
              {
                step: "02",
                title: "We find your match",
                description:
                  "Our team reviews every profile by hand and pairs you with someone we genuinely think you'll connect with, along with a personal note on why.",
              },
              {
                step: "03",
                title: "Say yes & meet up",
                description:
                  "Both of you accept the match, unlock three curated date ideas, and take it from there. Simple as that.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center md:text-left">
                <span className="inline-block text-accent1-600 font-bold text-sm tracking-widest mb-3">
                  {item.step}
                </span>
                <h3 className="text-xl font-bold text-charcoal-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-charcoal-500 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Domino */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-primary-500 font-bold text-sm tracking-[0.2em] uppercase text-center mb-3">
            Why us
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-charcoal-900 text-center mb-14">
            Why Domino Social Club?
          </h2>

          <div className="grid sm:grid-cols-2 gap-8">
            {[
              {
                title: "Human-first matchmaking",
                description:
                  "Every match is made by a real person who has read your profile — not a formula optimizing for engagement.",
              },
              {
                title: "Quality over quantity",
                description:
                  "One intentional introduction beats a hundred empty swipes. We focus on meaningful connections.",
              },
              {
                title: "Curated date ideas",
                description:
                  "When you both say yes, you'll get three hand-picked activity suggestions to break the ice.",
              },
              {
                title: "Pressure-free",
                description:
                  "You have 24 hours to decide. No awkward messages beforehand, no obligation — just a clean yes or no.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border-l-4 border-l-primary-400 border border-charcoal-100 p-6 hover:shadow-md transition-all"
              >
                <h3 className="text-lg font-bold text-charcoal-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-charcoal-500 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative bg-primary-500 py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/50 to-primary-400/50" />
        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to meet someone worth meeting?
          </h2>
          <p className="text-primary-100 mb-10 leading-relaxed">
            Join Domino Social Club and let us handle the hard part.
          </p>
          <Link
            to="/login?view=register"
            className="inline-block bg-accent1-500 hover:bg-accent1-400 text-secondary-900 font-semibold py-3.5 px-10 rounded-lg text-lg transition-colors shadow-lg hover:shadow-xl"
          >
            Get started
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-charcoal-950 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <img
            src="/images/logos/DSC_Secondary_Cream.png"
            alt="Domino Social Club"
            className="h-6"
          />
          <p className="text-charcoal-400 text-sm">
            &copy; {new Date().getFullYear()} Domino Social Club. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
