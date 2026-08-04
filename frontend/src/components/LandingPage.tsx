import { Link } from "react-router-dom";
import { EventCardScroller } from "./events/EventCardScroller";

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export function LandingPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="relative flex items-center justify-center overflow-hidden min-h-[60vh] md:min-h-screen">
        <img
          src="/images/hero/mobile-hero-2.png"
          alt="Friends together"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-charcoal-950/40" />

        <div className="relative z-10 text-center px-6 max-w-2xl mx-auto py-20">
          <img
            src="/images/logos/DSC_Primary_Cream.png"
            alt="Domino Social Club"
            className="h-48 md:h-80 mx-auto mb-8"
          />
          <p className="text-cream-50 text-xl md:text-2xl font-bold leading-snug max-w-lg mx-auto mb-3">
            Where people meet their people
          </p>
          <p className="text-cream-100 text-base md:text-lg leading-relaxed max-w-lg mx-auto mb-10">
            Connecting the good folks of Minneapolis &amp; Saint Paul through
            activities, events, and matchmaking
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/about"
              className="bg-accent1-500 hover:bg-accent1-600 text-charcoal-950 font-bold py-3 px-8 rounded-xl transition-colors text-sm tracking-wide uppercase"
            >
              Learn More
            </Link>
            <button
              onClick={() => scrollTo("highlights")}
              className="bg-cream-50 hover:bg-white text-primary-600 font-bold py-3 px-8 rounded-xl transition-colors text-sm tracking-wide uppercase"
            >
              Explore
            </button>
          </div>
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
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-bold text-cream-50 tracking-wide uppercase">
              About Domino
            </h2>
          </div>

          <div className="space-y-10 md:space-y-14">
            {[
              {
                label: "Mission",
                image: "/images/about/happy-girls.jpg",
                imageAlt: "Happy friends together",
                link: "/about",
                paragraphs: [
                  "Domino is here to help people find their people. Whether you're looking for meaningful friendships, romantic partnership, or a stronger sense of community, we're here to make connecting a little easier.",
                  "We know making the right connections can be hard, so we're here to help. Tell us who you are, what you're looking for, and what matters to you, and let us take it from there.",
                ],
              },
              {
                label: "Events",
                image: "/images/about/plant-boys.jpg",
                imageAlt: "Friends with plants",
                link: "/events",
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
                link: "/matchmaking",
                paragraphs: [
                  "Sometimes the right introduction just needs a little help.",
                  "At Domino, matchmaking goes beyond our events. We take the time to get to know our members and make thoughtful introductions for both friendship and romance. Whether you're hoping to expand your social circle, you're tired of dating apps, or you're looking for something more intentional, we're here to help.",
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
                    className="inline-block mt-6 bg-accent1-500 hover:bg-accent1-600 text-charcoal-950 font-bold py-2.5 px-6 rounded-xl transition-colors text-sm tracking-wide uppercase"
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
      <section className="pb-16 md:pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-cream-50 border-4 border-accent1-500 rounded-3xl p-6 md:p-10">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-accent1-500">
                Upcoming Events
              </h2>
              <p className="text-charcoal-700 mt-4 max-w-lg mx-auto leading-relaxed">
                Meet people in person at our curated events. No pressure, just
                great company.
              </p>
            </div>
            <EventCardScroller />
            <div className="text-center mt-8">
              <Link
                to="/events"
                className="inline-block bg-accent1-500 hover:bg-accent1-600 text-charcoal-950 font-bold py-3 px-8 rounded-xl transition-colors text-sm tracking-wide uppercase"
              >
                View All Events
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
