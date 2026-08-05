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
            <div className="rounded-2xl overflow-hidden aspect-[5/3]">
              <img
                src="/images/about/IMG_2781.JPG"
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
                Domino was created to help people find their people in an authentic, 
                enjoyable way. That means no apps, no swiping! We think the best connections 
                are made in real life and we want make those easier. 
                
              </p>
              <p>
              Whether you're looking for meaningful friendships, romantic partnership, or a
                stronger sense of community, we're here for you.
              </p>
            </div>
          </div>
        </section>

        {/* ── Our Story ── */}
        <section className="bg-cream-50 border-4 border-accent1-500 rounded-3xl p-6 md:p-10 flex flex-col md:flex-row-reverse gap-8 md:gap-12 items-center">
          <div className="w-full md:w-5/12 flex-shrink-0">
            <div className="rounded-2xl overflow-hidden aspect-[1/1]">
              <img
                src="/images/about/1000000236.jpg"
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
                Hi! We're Marissa and Lisa. We've been scheming together for 15 years (including planning entire parties just to invite 1 person) and we thought it was time to bring our skills to the masses.
              </p>
              <p>After all this time, we have decades of experience in community building, individual and couples therapy, event planning, group facilitation, and, somehow, even more.</p>
              <p>
                We are so excited to bring people together and can't wait to meet you!
              </p>
            </div>
          </div>
        </section>

        {/* ── Values ── */}
        <section className="bg-cream-50 border-4 border-accent1-500 rounded-3xl p-6 md:p-10 flex flex-col md:flex-row gap-8 md:gap-12 items-center">
          <div className="w-full md:w-5/12 flex-shrink-0">
            <div className="rounded-2xl overflow-hidden aspect-[5/3]">
              <img
                src="/images/about/dinner.png"
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
                We want Domino to be warm, welcoming, and fun. We think everyone has something great to offer and we want to create spaces to allow meaningful connection to flourish.
              </p>
              <p>
                Meeting people has gotten too weird and hard. Let's course-correct and have fun together.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
