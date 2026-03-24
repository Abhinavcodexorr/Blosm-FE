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

type ServicesProps = {
  /** If set, only this many cards are shown (e.g. 3 on the home page). */
  limit?: number;
};

export default function Services({ limit }: ServicesProps) {
  const { handleBookNow } = useLoginModal();
  const [services, setServices] = useState<{ title: string; description: string; image: string; tag?: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getServices()
      .then(setServices)
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, []);

  const displayed = limit != null ? services.slice(0, limit) : services;
  const gridClass =
    limit != null
      ? "grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 items-stretch"
      : "grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 items-stretch";

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

        <div className={gridClass}>
          {displayed.map((service, index) => (
            <ScrollReveal key={index} direction="up" delay={index * 60} className="h-full min-h-0">
              <div className="group relative flex h-full min-h-0 flex-col bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-amber-200/50">
                <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-gray-100">
                  <LazyImage
                    fill
                    src={service.image}
                    alt={service.title}
                    className="transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = FALLBACK_IMAGES[service.title] || "/images/services/hair-cutting.svg";
                    }}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  {service.tag && (
                    <span className="absolute top-5 right-5 z-10 px-4 py-1.5 bg-amber-500 text-white text-xs font-semibold tracking-wider uppercase rounded-full shadow-lg">
                      {service.tag}
                    </span>
                  )}
                </div>

                <div className="flex flex-1 min-h-0 flex-col gap-4 p-8">
                  <h3 className="font-display text-2xl font-medium text-charcoal shrink-0 group-hover:text-amber-800 transition-colors">
                    {service.title}
                  </h3>
                  <p className="min-h-0 flex-1 text-gray-600 leading-relaxed text-[15px] md:text-base">
                    {service.description}
                  </p>
                  <div className="shrink-0 mt-auto flex w-full justify-end border-t border-gray-100 pt-5">
                    <button
                      type="button"
                      onClick={() => handleBookNow(service.title)}
                      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-amber-500/25 transition-all duration-200 hover:from-amber-600 hover:to-amber-700 hover:shadow-lg hover:shadow-amber-500/30 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 group/btn"
                    >
                      Book Now
                      <svg
                        className="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-0.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.25}
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {limit != null && (
          <div className="mt-12 text-center">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 text-sm font-semibold text-amber-800 hover:text-amber-900 transition-colors"
            >
              View all services
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
