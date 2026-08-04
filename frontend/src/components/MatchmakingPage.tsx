export function MatchmakingPage() {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Page header */}
      <div className="text-center mb-14">
        <h1 className="text-4xl md:text-5xl font-bold text-cream-50 tracking-wide uppercase">
          Matchmaking
        </h1>
        <p className="text-cream-100 text-lg mt-6 max-w-2xl mx-auto leading-relaxed">
          Sometimes the right introduction just needs a little help. At Domino,
          we take the time to get to know our members and make thoughtful
          introductions for both friendship and romance.
        </p>
      </div>

      <div className="space-y-10 md:space-y-14">
        {/* ── How It Works ── */}
        <section className="bg-cream-50 border-4 border-accent1-500 rounded-3xl p-6 md:p-10 flex flex-col md:flex-row gap-8 md:gap-12 items-center">
          <div className="w-full md:w-5/12 flex-shrink-0">
            <div className="rounded-2xl overflow-hidden aspect-[4/5]">
              <img
                src="/images/about/sparklers.jpg"
                alt="Sparklers celebration"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-bold text-accent1-500 mb-4">
              How It Works
            </h2>
            <div className="space-y-4 text-charcoal-700 leading-relaxed">
              <p>
                Whether you're hoping to expand your social circle, you're tired
                of dating apps, or you're looking for something more intentional,
                we're here to help.
              </p>
              <p>
                Looking for friends who share your interests and values? Looking
                for love or a partner for the long haul? We'll keep an eye out
                for someone we think you'll genuinely connect with, and when we
                see a promising match, we'll reach out and make the introduction.
              </p>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat.
              </p>
            </div>
          </div>
        </section>

        {/* ── Friendship ── */}
        <section className="bg-cream-50 border-4 border-accent1-500 rounded-3xl p-6 md:p-10 flex flex-col md:flex-row-reverse gap-8 md:gap-12 items-center">
          <div className="w-full md:w-5/12 flex-shrink-0">
            <div className="rounded-2xl overflow-hidden aspect-[4/5]">
              <img
                src="/images/about/happy-girls.jpg"
                alt="Friends laughing"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-bold text-accent1-500 mb-4">
              Friendship Matching
            </h2>
            <div className="space-y-4 text-charcoal-700 leading-relaxed">
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus
                lacinia odio vitae vestibulum vestibulum. Cras venenatis euismod
                malesuada. Nulla facilisi.
              </p>
              <p>
                Duis aute irure dolor in reprehenderit in voluptate velit esse
                cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
                cupidatat non proident, sunt in culpa qui officia deserunt
                mollit anim id est laborum.
              </p>
            </div>
          </div>
        </section>

        {/* ── Romance ── */}
        <section className="bg-cream-50 border-4 border-accent1-500 rounded-3xl p-6 md:p-10 flex flex-col md:flex-row gap-8 md:gap-12 items-center">
          <div className="w-full md:w-5/12 flex-shrink-0">
            <div className="rounded-2xl overflow-hidden aspect-[4/5]">
              <img
                src="/images/about/plant-boys.jpg"
                alt="Friends at event"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-bold text-accent1-500 mb-4">
              Romance Matching
            </h2>
            <div className="space-y-4 text-charcoal-700 leading-relaxed">
              <p>
                Met someone at a Domino event and wish you'd gotten their
                number? We've got you. If the interest is mutual, we'll help
                make the connection.
              </p>
              <p>
                Whether it's a new friendship or the start of something more,
                we're here to help great conversations turn into lasting
                relationships.
              </p>
              <p>
                Sed ut perspiciatis unde omnis iste natus error sit voluptatem
                accusantium doloremque laudantium, totam rem aperiam, eaque ipsa
                quae ab illo inventore veritatis et quasi architecto beatae vitae
                dicta sunt explicabo.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
