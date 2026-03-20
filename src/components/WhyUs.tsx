"use client";

import ScrollReveal from "./ScrollReveal";

const features = [
  {
    title: "Premium Products",
    description: "We use only the finest, professional-grade products. Your hair and skin deserve nothing less.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: "Flexible Timing",
    description: "We work around your schedule. Early mornings, late evenings—we're here when you need us.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Women-Only Sanctuary",
    description: "A private, welcoming space exclusively for women in Perth. Feel comfortable and valued in a place designed just for you.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
];

export default function WhyUs() {
  return (
    <section className="pt-12 md:pt-16 pb-24 md:pb-36 bg-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-80 h-80 bg-amber-50/50 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-rose-50/50 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="max-w-7xl mx-auto px-6 relative">
        <ScrollReveal direction="up">
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-1.5 bg-amber-100 text-amber-800 text-xs font-medium tracking-[0.3em] uppercase rounded-full mb-6">
              Why Blosm
            </span>
            <h2 className="font-display text-4xl md:text-6xl font-light text-charcoal mb-6">
              The Blosm Difference
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Every detail designed for your comfort and beauty. Experience what sets us apart.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-12 md:gap-8">
          {features.map((feature, index) => (
            <ScrollReveal key={index} direction="up" delay={index * 80}>
              <div className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 mb-6 group-hover:bg-amber-200 group-hover:text-amber-800 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="font-display text-xl font-medium text-charcoal mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
