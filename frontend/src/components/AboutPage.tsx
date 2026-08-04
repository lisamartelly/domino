export function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Page header */}
      <div className="text-center mb-14">
        <h1 className="text-4xl md:text-5xl font-bold text-cream-50 tracking-wide uppercase">
          About Domino
        </h1>
      </div>

      <div className="space-y-10 md:space-y-14">
        {/* ── Mission ── */}
        <section className="bg-cream-50 border-4 border-accent1-500 rounded-3xl p-6 md:p-10 flex flex-col md:flex-row gap-8 md:gap-12 items-center">
          <div className="w-full md:w-5/12 flex-shrink-0">
            <div className="rounded-2xl overflow-hidden aspect-[4/5]">
              <img
                src="/images/about/happy-girls.jpg"
                alt="Happy friends together"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-bold text-accent1-500 mb-4">
              Our Mission
            </h2>
            <div className="space-y-4 text-charcoal-700 leading-relaxed">
              <p>
                Domino is here to help people find their people. Whether you're
                looking for meaningful friendships, romantic partnership, or a
                stronger sense of community, we're here to make connecting a
                little easier.
              </p>
              <p>
                We know making the right connections can be hard, so we're here
                to help. Tell us who you are, what you're looking for, and what
                matters to you, and let us take it from there.
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

        {/* ── Our Story ── */}
        <section className="bg-cream-50 border-4 border-accent1-500 rounded-3xl p-6 md:p-10 flex flex-col md:flex-row-reverse gap-8 md:gap-12 items-center">
          <div className="w-full md:w-5/12 flex-shrink-0">
            <div className="rounded-2xl overflow-hidden aspect-[4/5]">
              <img
                src="/images/about/plant-boys.jpg"
                alt="Friends with plants"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-bold text-accent1-500 mb-4">
              Our Story
            </h2>
            <div className="space-y-4 text-charcoal-700 leading-relaxed">
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam
                auctor, nisl nec ultricies lacinia, nisl nisl aliquam nisl, nec
                aliquam nisl nisl sit amet nisl. Donec auctor, nisl nec
                ultricies lacinia.
              </p>
              <p>
                Duis aute irure dolor in reprehenderit in voluptate velit esse
                cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
                cupidatat non proident, sunt in culpa qui officia deserunt
                mollit anim id est laborum.
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

        {/* ── Values ── */}
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
              Our Values
            </h2>
            <div className="space-y-4 text-charcoal-700 leading-relaxed">
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus
                lacinia odio vitae vestibulum vestibulum. Cras venenatis euismod
                malesuada. Nulla facilisi. Etiam non diam ante.
              </p>
              <p>
                Ut enim ad minim veniam, quis nostrud exercitation ullamco
                laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure
                dolor in reprehenderit in voluptate velit esse cillum dolore eu
                fugiat nulla pariatur.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
