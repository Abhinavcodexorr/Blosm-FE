"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ScrollReveal from "./ScrollReveal";
import LazyImage from "./LazyImage";
import { getServices } from "@/services/api";
import { useLoginModal } from "@/context/LoginModalContext";

const FALLBACK_IMAGES: Record<string, string> = {
  "Hair Cutting": "/images/services/hair-cutting.svg",
  "Keratin Treatment": "/images/services/keratin.svg",
  "Hair Smoothening": "/images/services/smoothening.svg",
  "Beauty & Facial": "/images/services/beauty-facial.svg",
  "Hair Coloring": "/images/services/hair-coloring.svg",
  "Nail Care": "/images/services/nail-care.svg",
};

export default function Services() {
  const { handleBookNow } = useLoginModal();
  const [services, setServices] = useState<{ title: string; description: string; image: string; tag?: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getServices()
      .then(setServices)
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section id="services" className="pt-24 md:pt-36 pb-12 md:pb-16">
        <div className="max-w-7xl mx-auto px-6 text-center py-16">
          <p className="text-gray-600">Loading services…</p>
        </div>
      </section>
    );
  }

  if (!services.length) return null;

  return (
    <section id="services" className="pt-24 md:pt-36 pb-12 md:pb-16 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-100/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="max-w-7xl mx-auto px-6 relative">
        <ScrollReveal direction="up">
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-1.5 bg-amber-100 text-amber-800 text-xs font-medium tracking-[0.3em] uppercase rounded-full mb-6">
              Our Services
            </span>
            <h2 className="font-display text-4xl md:text-6xl font-light text-charcoal mb-6">
              Luxurious Transformations
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Premium women-only services in Perth. Every treatment is a journey to your best self.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {services.map((service, index) => (
            <ScrollReveal key={index} direction="up" delay={index * 60}>
              <div className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-amber-200/50">
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <LazyImage
                    src={service.image}
                    alt={service.title}
                    className="transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = FALLBACK_IMAGES[service.title] || "/images/services/hair-cutting.svg";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  {service.tag && (
                    <span className="absolute top-5 right-5 px-4 py-1.5 bg-amber-500 text-white text-xs font-semibold tracking-wider uppercase rounded-full shadow-lg">
                      {service.tag}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-8">
                  <h3 className="font-display text-2xl font-medium text-charcoal mb-4 group-hover:text-amber-800 transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    {service.description}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleBookNow(service.title)}
                    className="inline-flex items-center gap-2 text-amber-700 font-semibold hover:text-amber-800 transition-colors group/btn"
                  >
                    Book Now
                    <svg className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
