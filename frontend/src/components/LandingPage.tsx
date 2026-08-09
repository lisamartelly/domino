import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EventCardScroller } from "./events/EventCardScroller";
import { getFeaturedEvents, subscribeToNewsletter, type EventSummaryDto } from "../services/api";

export function LandingPage() {
  const [featuredEvents, setFeaturedEvents] = useState<EventSummaryDto[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [nlEmail, setNlEmail] = useState("");
  const [nlSubmitted, setNlSubmitted] = useState(false);
  const [nlSubmitting, setNlSubmitting] = useState(false);
  const [nlError, setNlError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getFeaturedEvents()
      .then((data) => {
        if (!cancelled) setFeaturedEvents(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setEventsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  async function handleNlSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nlEmail.trim()) return;
    setNlSubmitting(true);
    setNlError(null);
    try {
      await subscribeToNewsletter(nlEmail);
      setNlSubmitted(true);
      setNlEmail("");
    } catch {
      setNlError("Something went wrong — please try again.");
    } finally {
      setNlSubmitting(false);
    }
  }

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative flex items-center justify-center overflow-hidden min-h-[60vh] md:min-h-screen">
        <img
          src="/images/hero/paddleboarding.jpg"
          alt="Friends together"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-primary-950/50" />
        <div className="absolute inset-0 bg-primary-500/30" />

        <div className="relative z-10 text-center px-6 max-w-2xl mx-auto py-20">
          <img
            src="/images/logos/DSC_Primary_Cream.png"
            alt="Domino Social Club"
            className="h-48 md:h-80 mx-auto mb-8"
          />
          <p className="text-cream-50 text-xl md:text-2xl font-bold leading-snug max-w-lg mx-auto mb-3">
            Where people meet their people.  
            <br />
            Based in real life. No apps, swiping, or profiles.
          </p>
          <p className="text-cream-100 text-base md:text-lg leading-relaxed max-w-lg mx-auto mb-10">
            Connecting the good folks of Minneapolis &amp; Saint Paul through
            activities, events, and matchmaking
          </p>

          <a
            href="#newsletter"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("newsletter")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="inline-block bg-accent1-500 hover:bg-accent1-600 text-white font-bold py-3 px-8 rounded-xl transition-colors text-sm tracking-wide uppercase"
          >
            JOIN THE CLUB
          </a>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
          <svg
            className="w-6 h-6 text-cream-50/60 animate-bounce"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── Events ── */}
      <section className="pt-16 md:pt-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-cream-50 border-4 border-accent1-500 rounded-3xl p-6 md:p-10 flex flex-col md:flex-row gap-8 md:gap-12 items-center">
            <div className="w-full md:w-4/12 flex-shrink-0">
              <div className="rounded-2xl overflow-hidden aspect-[5/3] md:aspect-square">
                <img src="/images/about/IMG_2797.JPG" alt="Domino event" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl md:text-3xl font-bold text-accent1-500 mb-4">Events to Foster Connection</h3>
              <p className="text-charcoal-700 leading-relaxed mb-3">Our events are centered around shared interests, welcoming environments, and genuine conversation</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-accent2-50 border-4 border-accent1-500 rounded-2xl p-5">
                  <h4 className="text-lg font-bold text-accent1-500 mb-2">Unique & Fun</h4>
                  <p className="text-charcoal-700 text-sm leading-relaxed">
                    Creative, interest-based events led by friendly experts
                  </p>
                </div>
                <div className="bg-accent2-50 border-4 border-accent1-500 rounded-2xl p-5">
                  <h4 className="text-lg font-bold text-accent1-500 mb-2">Recurring</h4>
                  <p className="text-charcoal-700 text-sm leading-relaxed">
                    Build relationships naturally, over time, without pressure
                  </p>
                </div>
                <div className="bg-accent2-50 border-4 border-accent1-500 rounded-2xl p-5">
                  <h4 className="text-lg font-bold text-accent1-500 mb-2">Facilitated</h4>
                  <p className="text-charcoal-700 text-sm leading-relaxed">
                    Meaningful conversation built in so you <em>actually</em> get to know people
                  </p>
                </div>
              </div>
              <div className="text-center md:text-left mt-6">
                <Link to="/events" className="inline-block bg-accent1-500 hover:bg-accent1-600 text-white font-bold py-2.5 px-6 rounded-xl transition-colors text-sm tracking-wide uppercase">
                  View All Events &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Upcoming Events scroller ── */}
      {!eventsLoading && featuredEvents.length > 0 && (
        <section className="py-10 md:py-14 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="bg-cream-50 border-4 border-accent1-500 rounded-3xl p-6 md:p-10">
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold text-accent1-500">
                  Upcoming Events
                </h2>
                <p className="text-charcoal-700 mt-4 max-w-lg mx-auto leading-relaxed">
                  We design all of our events to be engaging and specific so you can find yourself among who you're looking for and actually get to know them.
                </p>
              </div>
              <EventCardScroller events={featuredEvents} />
              <div className="text-center mt-8">
                <Link to="/events" className="inline-block bg-accent1-500 hover:bg-accent1-600 text-white font-bold py-3 px-8 rounded-xl transition-colors text-sm tracking-wide uppercase">
                  View All Events
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Newsletter CTA ── */}
      <section id="newsletter-cta" className="py-6 md:py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-accent1-200 border-4 border-cream-50 rounded-3xl p-6 md:p-10 flex flex-col md:flex-row gap-8 md:gap-12 items-center">
            <div className="w-full md:w-3/12 flex-shrink-0 flex justify-center">
              <img
                src="/images/avatars/Smiley1_Charcoal.png"
                alt="Domino smiley"
                className="w-32 md:w-40"
              />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl md:text-3xl font-bold text-charcoal-800 mb-2">
                Want to join the club?
              </h3>
              <p className="text-charcoal-700 leading-relaxed mb-6">
                Sign up for the newsletter to hear when more events go live!
              </p>
              {nlSubmitted ? (
                <div className="rounded-2xl border-2 border-accent1-500 bg-white p-4">
                  <p className="text-charcoal-900 font-bold">You're on the list!</p>
                  <p className="text-charcoal-500 text-sm mt-1">We'll be in touch soon.</p>
                </div>
              ) : (
                <>
                  <form onSubmit={handleNlSubmit} className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      required
                      placeholder="your@email.com"
                      value={nlEmail}
                      onChange={(e) => setNlEmail(e.target.value)}
                      disabled={nlSubmitting}
                      className="flex-1 rounded-xl border-2 border-charcoal-200 bg-white px-4 py-3 text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-accent1-500 focus:border-accent1-500 disabled:opacity-60"
                    />
                    <button
                      type="submit"
                      disabled={nlSubmitting}
                      className="bg-charcoal-500 hover:bg-charcoal-600 text-white font-bold py-3 px-6 rounded-xl transition-colors whitespace-nowrap disabled:opacity-60"
                    >
                      {nlSubmitting ? "Signing up…" : "Sign me up!"}
                    </button>
                  </form>
                  {nlError && <p className="text-red-600 text-sm mt-2">{nlError}</p>}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Matchmaking ── */}
      <section className="py-10 md:py-14 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-cream-50 border-4 border-accent1-500 rounded-3xl p-6 md:p-10 flex flex-col md:flex-row gap-8 md:gap-12 items-center">
            <div className="w-full md:w-4/12 flex-shrink-0">
              <div className="rounded-2xl overflow-hidden aspect-[4/5]">
                <img src="/images/about/matchmaking.jpg" alt="Matchmaking" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl md:text-3xl font-bold text-accent1-500 mb-4">Matchmaking For Regular People</h3>
              <div className="space-y-3">
                <p className="text-charcoal-700 leading-relaxed">
                Picture us as your persistent friend who thinks they know someone you'd really like (because it's true).
                </p>
                <p className="text-charcoal-700 leading-relaxed">
                  If you opt into Matchmaking, we'll take the time to get to know you and make thoughtful introductions for both friendship and romance.
                </p>
              </div>
              <div className="text-center md:text-left mt-6">
                <Link to="/matchmaking" className="inline-block bg-accent1-500 hover:bg-accent1-600 text-white font-bold py-2.5 px-6 rounded-xl transition-colors text-sm tracking-wide uppercase">
                  Learn about our process &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── About Us ── */}
      <section className="pb-16 md:pb-24 pt-10 md:pt-14 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-cream-50 border-4 border-accent1-500 rounded-3xl p-6 md:p-10 flex flex-col md:flex-row gap-8 md:gap-12 items-center">
            <div className="w-full md:w-4/12 flex-shrink-0">
              <div className="rounded-2xl overflow-hidden aspect-[4/5]">
                <img src="/images/about/us.jpg" alt="The Domino team" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl md:text-3xl font-bold text-accent1-500 mb-4">And who are we?</h3>
              <div className="space-y-3">
                <p className="text-charcoal-700 leading-relaxed">
                  Domino was founded by two friends who thought it shouldn't be so hard to meet people.
                </p>
                <p className="text-charcoal-700 leading-relaxed">
                  We hope you'll join us on our endeavor to bring folks together!
                </p>
                <p className="text-charcoal-700 leading-relaxed">
                  Whether you're looking for friendships, romantic partnership, or a stronger sense of community, Domino has something for you, no apps involved.
                </p>
              </div>
              <div className="text-center md:text-left mt-6">
                <Link to="/about" className="inline-block bg-accent1-500 hover:bg-accent1-600 text-white font-bold py-2.5 px-6 rounded-xl transition-colors text-sm tracking-wide uppercase">
                  Learn more about us &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
