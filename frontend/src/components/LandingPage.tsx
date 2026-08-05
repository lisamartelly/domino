import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EventCardScroller } from "./events/EventCardScroller";
import { getFeaturedEvents, type EventSummaryDto } from "../services/api";

export function LandingPage() {
  const [featuredEvents, setFeaturedEvents] = useState<EventSummaryDto[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

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
            href="https://domino-social-club.beehiiv.com/"
            target="_blank"
            rel="noopener noreferrer"
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

      {/* ── Content highlights ── */}
      <section id="highlights" className="py-16 md:py-24 px-6">
        <div className="max-w-5xl mx-auto">

          <div className="space-y-10 md:space-y-14">
            {[
              {
                label: "About Us",
                image: "/images/about/happy-girls.jpg",
                imageAlt: "Happy friends together",
                link: "/about",
                paragraphs: [
                  "Domino was founded by two friends who wanted more ways to meet people that were based in real life.",
                  "Whether you're looking for friendships, romantic partnership, or a stronger sense of community, Domino has something for you, no apps involved.",
                ],
              },
              {
                label: "Events",
                image: "/images/about/plant-boys.jpg",
                imageAlt: "Friends with plants",
                link: "/events",
                paragraphs: [
                  "We create events centered around shared interests, and we facilitate conversation so you actually get to know people! We also have recurring series you can join.",
                  "When we have something in common or opportunities to see each other more than once, the pressure is lower. This lets us be ourselves and make real connections. Join us!", 
                ],
              },
              {
                label: "Matchmaking",
                image: "/images/about/sparklers.jpg",
                imageAlt: "Sparklers celebration",
                link: "/matchmaking",
                paragraphs: [
                  "We have a knack for spotting a great pair.",
                  "If you opt into Matchmaking, we'll take the time to get to know you and make thoughtful introductions for both friendship and romance. Time to revive the blind(ish) date!",
                ],
              },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-cream-50 border-4 border-accent1-500 rounded-3xl p-6 md:p-10 flex flex-col md:flex-row gap-8 md:gap-12 items-center"
              >
                <div className="w-full md:w-4/12 flex-shrink-0">
                  <div className="rounded-2xl overflow-hidden aspect-[4/5]">
                    <img
                      src={item.image}
                      alt={item.imageAlt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl md:text-3xl font-bold text-accent1-500 mb-4">
                    {item.label}
                  </h3>
                  <div className="space-y-3">
                    {item.paragraphs.map((paragraph, i) => (
                      <p
                        key={i}
                        className="text-charcoal-700 leading-relaxed"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  <Link
                    to={item.link}
                    className="inline-block mt-6 bg-accent1-500 hover:bg-accent1-600 text-white font-bold py-2.5 px-6 rounded-xl transition-colors text-sm tracking-wide uppercase"
                  >
                    Learn more &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Upcoming Events scroller ── */}
      {!eventsLoading && featuredEvents.length > 0 && (
        <section className="pb-16 md:pb-24 px-6">
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
                <Link
                  to="/events"
                  className="inline-block bg-accent1-500 hover:bg-accent1-600 text-white font-bold py-3 px-8 rounded-xl transition-colors text-sm tracking-wide uppercase"
                >
                  View All Events
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
