"use client";

import ScrollReveal from "./ScrollReveal";

const stats = [
  { value: "150+", label: "Happy Clients" },
  { value: "15", label: "Years of Excellence" },
  { value: "50+", label: "Expert Stylists" },
];

export default function Stats() {
  return (
    <section className="py-20 md:py-28 bg-charcoal text-white relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-transparent to-rose-900/20" />
      <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-amber-500/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-12">
          {stats.map((stat, index) => (
            <ScrollReveal key={index} direction="up" delay={index * 100}>
              <div className="text-center group">
                <span className="block font-display text-5xl md:text-6xl font-light text-amber-400 mb-3 group-hover:scale-105 transition-transform">
                  {stat.value}
                </span>
                <span className="text-sm uppercase tracking-[0.25em] text-white/70">
                  {stat.label}
                </span>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
