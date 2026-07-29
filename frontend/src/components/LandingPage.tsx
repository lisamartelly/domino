import { useEffect, useRef, useState } from "react";
import { subscribeToNewsletter } from "../services/api";

const HERO_IMAGES = [
  { src: "/images/hero/hero-group.jpg", position: "center 60%" },
  { src: "/images/hero/other-plant-boys.jpg", position: "center 40%" },
  { src: "/images/hero/crafty.jpg", position: "center" },
  { src: "/images/hero/book-club.jpg", position: "center" },
  { src: "/images/hero/card-game.jpg", position: "center" },
  { src: "/images/hero/catan.jpg", position: "center 30%" },
  { src: "/images/hero/hikers.jpg", position: "center 60%" },
];

const CYCLE_MS = 6000;

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export function LandingPage() {
  const [current, setCurrent] = useState(0);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const timer = setInterval(
      () => setCurrent((i) => (i + 1) % HERO_IMAGES.length),
      CYCLE_MS
    );
    return () => clearInterval(timer);
  }, []);

  async function handleNewsletterSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      await subscribeToNewsletter(email);
      setSubmitted(true);
      setEmail("");
    } catch {
      setError("Something went wrong — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream-50">
      {/* ── Hero: Mobile ── */}
      <div className="md:hidden flex flex-col">
        {/* Photo with logo overlay */}
        <div className="relative">
          <img
            src="/images/hero/mobile-hero-2.png"
            alt="Friends together"
            className="w-full object-cover max-h-[70vh]"
          />
          <div className="absolute inset-0 bg-charcoal-950/25" />
          <img
            src="/images/logos/DSC_Primary_Cream.png"
            alt="Domino Social Club"
            className="absolute bottom-[15%] left-1/2 -translate-x-1/2 w-80"
          />
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
            <svg
              className="w-5 h-5 text-cream-50/60 animate-bounce"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* CTA band */}
        <section className="bg-primary-500 py-6 px-6 text-center">
          <p className="text-white text-xl font-semibold leading-snug mb-1">
            Where people meet their people
          </p>
          <p className="text-white/70 text-sm mb-5">
            Connecting the good folks of Minneapolis &amp; Saint Paul through activities, events, and matchmaking
          </p>
          <button
            onClick={() => scrollTo("join")}
            className="w-full max-w-xs mx-auto bg-white hover:bg-cream-50 text-primary-500 font-semibold py-3 px-8 rounded-lg transition-colors shadow-md text-sm tracking-wide uppercase"
          >
            Join the Club
          </button>
          <div className="flex justify-center gap-6 mt-3">
            <button
              onClick={() => scrollTo("about")}
              className="text-white/70 hover:text-white text-sm font-medium transition-colors"
            >
              Details
            </button>
            <button
              onClick={() => scrollTo("contact")}
              className="text-white/70 hover:text-white text-sm font-medium transition-colors"
            >
              Contact
            </button>
          </div>
        </section>
      </div>

      {/* ── Hero: Desktop ── */}
      <section className="relative hidden md:flex min-h-screen items-center justify-center overflow-hidden">
        {HERO_IMAGES.map((img, i) => (
          <div
            key={img.src}
            className="absolute inset-0 bg-cover transition-opacity duration-[1500ms] ease-in-out grayscale"
            style={{
              backgroundImage: `url('${img.src}')`,
              backgroundPosition: img.position,
              opacity: i === current ? 1 : 0,
            }}
          />
        ))}
        <div className="absolute inset-0 bg-charcoal-950/70" />

        <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
          <img
            src="/images/logos/DSC_Primary_Cream.png"
            alt="Domino Social Club"
            className="h-80 mx-auto mb-8"
          />
          <p className="text-cream-50 text-2xl font-semibold leading-snug max-w-lg mx-auto mb-4">
            Where people meet their people
          </p>
          <p className="text-cream-100 text-lg leading-relaxed max-w-lg mx-auto mb-12">
          Connecting the good folks of Minneapolis &amp; Saint Paul through activities, events, and matchmaking
          </p>

          <div className="flex flex-row justify-center gap-4">
            <button
              onClick={() => scrollTo("about")}
              className="bg-white/10 hover:bg-white/20 backdrop-blur text-cream-50 font-semibold py-3 px-8 rounded-lg transition-colors border border-cream-50/25 text-sm tracking-wide uppercase"
            >
              Details
            </button>
            <button
              onClick={() => scrollTo("join")}
              className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors shadow-lg hover:shadow-xl text-sm tracking-wide uppercase"
            >
              Join the Club
            </button>
            <button
              onClick={() => scrollTo("contact")}
              className="bg-white/10 hover:bg-white/20 backdrop-blur text-cream-50 font-semibold py-3 px-8 rounded-lg transition-colors border border-cream-50/25 text-sm tracking-wide uppercase"
            >
              Contact Us
            </button>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <svg
            className="w-6 h-6 text-cream-50/50 animate-bounce"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="h-1.5 bg-gradient-to-r from-primary-500 via-accent1-500 to-primary-500" />

      {/* ── About ── */}
      <section id="about" className="bg-cream-50 py-20 md:py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-charcoal-900 tracking-wide uppercase">
              About Domino
            </h2>
            <span className="block mt-3 mx-auto h-1 w-16 rounded-full bg-primary-500" />
          </div>

          <div className="space-y-16 md:space-y-24">
            {[
              {
                label: "Mission",
                image: "/images/about/happy-girls.jpg",
                imageAlt: "Happy friends together",
                paragraphs: [
                  "Domino is here to help people find their people. Whether you're looking for meaningful friendships, romantic partnership, or a stronger sense of community, we're here to make connecting a little easier.",
                  "We know making the right connections can be hard, so we're here to help. Tell us who you are, what you're looking for, and what matters to you, and let us take it from there.",
                ],
              },
              {
                label: "Events",
                image: "/images/about/plant-boys.jpg",
                imageAlt: "Friends with plants",
                paragraphs: [
                  "We LOVE sending an invite, breaking the ice, and bringing the right people together.",
                  "The best connections happen when we have something in common and opportunities to see each other more than once. That's why we create events centered around shared interests, welcoming environments, and genuine conversation. No more awkward mixers or endless swiping.",
                  "Creating the ideal environment for connections to flourish is our bread and butter. Whether it's a creative class, game night, outdoor adventure, volunteer event, or something entirely new, our events are designed to take the pressure off and make meeting people feel easy.",
                ],
              },
              {
                label: "Matchmaking",
                image: "/images/about/sparklers.jpg",
                imageAlt: "Sparklers celebration",
                paragraphs: [
                  "Sometimes the right introduction just needs a little help.",
                  "At Domino, matchmaking goes beyond our events. We take the time to get to know our members and make thoughtful introductions for both friendship and romance. Whether you're hoping to expand your social circle, you're tired of dating apps, or you're looking for something more intentional, we're here to help.",
                  "Looking for friends who share your interests and values? Looking for love or a partner for the long haul? We'll keep an eye out for someone we think you'll genuinely connect with, and when we see a promising match, we'll reach out and make the introduction.",
                  "Met someone at a Domino event and wish you'd gotten their number? We've got you. If the interest is mutual, we'll help make the connection. Whether it's a new friendship or the start of something more, we're here to help great conversations turn into lasting relationships.",
                ],
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col md:flex-row gap-10 md:gap-14 items-center"
              >
                <div className="w-full md:w-4/12 flex-shrink-0 px-4 md:px-6">
                  <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-[4/5]">
                    <img
                      src={item.image}
                      alt={item.imageAlt}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/30 to-transparent" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="mb-4">
                    <span className="text-2xl md:text-3xl font-bold text-charcoal-900 tracking-wide uppercase">
                      {item.label}
                    </span>
                    <span className="block mt-2 h-1 w-12 rounded-full bg-accent1-500" />
                  </h3>
                  <div className="space-y-3">
                    {item.paragraphs.map((paragraph, i) => (
                      <p
                        key={i}
                        className="text-charcoal-500 leading-relaxed"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="h-1.5 bg-gradient-to-r from-primary-500 via-accent1-500 to-primary-500" />

      {/* ── Join the Club ── */}
      <section id="join" className="bg-white py-20 md:py-28 px-6">
        <div className="max-w-xl mx-auto text-center">
          <div className="mb-4">
            <h2 className="text-4xl md:text-5xl font-bold text-charcoal-900 tracking-wide uppercase">
              Join the Club
            </h2>
            <span className="block mt-3 mx-auto h-1 w-16 rounded-full bg-primary-500" />
          </div>
          <p className="text-charcoal-500 leading-relaxed mb-4">
            Be the first to hear about upcoming events, new experiences, and
            opportunities to meet incredible people right here in the Twin Cities.
          </p>
          <p className="text-charcoal-500 leading-relaxed mb-10">
            Join our newsletter and follow us on{" "}
            <a
              href="https://instagram.com/dominosocial.club"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 font-medium underline underline-offset-2"
            >
              Instagram
            </a>{" "}
            and{" "}
            <a
              href="https://tiktok.com/@dominosocialclub"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 font-medium underline underline-offset-2"
            >
              TikTok
            </a>{" "}
            to stay in the loop.
          </p>

          {/* Newsletter signup */}
          {submitted ? (
            <div className="rounded-2xl border border-accent1-500/30 bg-accent1-100/50 p-6">
              <p className="text-charcoal-900 font-semibold">You're on the list! 🎉</p>
              <p className="text-charcoal-500 text-sm mt-1">
                We'll be in touch soon.
              </p>
            </div>
          ) : (
            <>
              <form
                ref={formRef}
                onSubmit={handleNewsletterSubmit}
                className="flex flex-col sm:flex-row gap-3 mb-8"
              >
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  className="flex-1 rounded-lg border border-charcoal-200 px-4 py-3.5 text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent bg-cream-50 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3.5 px-8 rounded-lg transition-colors shadow-md hover:shadow-lg whitespace-nowrap disabled:opacity-60"
                >
                  {submitting ? "Signing up…" : "Newsletter Sign Up"}
                </button>
              </form>
              {error && (
                <p className="text-red-600 text-sm -mt-5 mb-4">{error}</p>
              )}
            </>
          )}

        </div>
      </section>

      {/* Gradient divider */}
      <div className="h-1.5 bg-gradient-to-r from-primary-500 via-accent1-500 to-primary-500" />

      {/* ── Contact Us / Footer ── */}
      <footer id="contact" className="bg-charcoal-950 py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-cream-50 mb-8">
            Contact Us
          </h2>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-12">
            <a
              href="https://instagram.com/dominosocial.club"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-charcoal-300 hover:text-cream-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
              <span>@dominosocial.club</span>
            </a>

            <a
              href="https://tiktok.com/@dominosocialclub"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-charcoal-300 hover:text-cream-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z" />
              </svg>
              <span>@dominosocialclub</span>
            </a>

            <a
              href="mailto:hello@dominosocial.club"
              className="flex items-center gap-2 text-charcoal-300 hover:text-cream-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              <span>hello@dominosocial.club</span>
            </a>
          </div>

          <div className="border-t border-charcoal-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
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
        </div>
      </footer>
    </div>
  );
}
