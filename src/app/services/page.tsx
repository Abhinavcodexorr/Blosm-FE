"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LazyImage from "@/components/LazyImage";
import { getCategories } from "@/services/api";
import { useLoginModal } from "@/context/LoginModalContext";
import { formatAud } from "@/lib/formatCurrency";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=85";

export default function ServicesPage() {
  const { handleBookNow } = useLoginModal();
  const [services, setServices] = useState<
    { name: string; description: string; items: string[]; image: string; alt: string; price?: number | string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategories()
      .then(setServices)
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, []);
  return (
    <main className="min-h-screen">
      <Header />
      <section className="pt-32 pb-20 bg-rose-50/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-[0.3em] text-rose-700/80 mb-4">Our Offerings</p>
            <h1 className="font-display text-4xl md:text-6xl font-light text-charcoal mb-6">
              Luxurious Salon Services
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Experience premium women-only services in Perth. Designed for elegance and convenience in a calming, private atmosphere.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-600">Loading services...</div>
          ) : (
            <div>
              <div className="space-y-16">
                {services.map((service, index) => (
              <div
                key={index}
                className="bg-white overflow-hidden shadow-sm border border-gray-100 rounded-2xl flex flex-col md:flex-row"
              >
                <div className="md:w-2/5 aspect-[4/3] md:aspect-auto md:min-h-[320px] relative overflow-hidden">
                  <LazyImage
                    fill
                    src={service.image}
                    alt={service.alt}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = FALLBACK_IMAGE;
                    }}
                  />
                </div>
                <div className="p-10 md:p-16 flex-1 flex flex-col">
                  <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
                    <h2 className="font-display text-2xl md:text-3xl font-light text-charcoal">
                      {service.name}
                    </h2>
                    {formatAud(service.price) ? (
                      <p className="text-lg md:text-xl font-semibold text-[#8B6914] tabular-nums shrink-0">
                        {formatAud(service.price)}
                      </p>
                    ) : null}
                  </div>
                  <p className="text-gray-600 mb-8 max-w-2xl">{service.description}</p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(service.items || []).map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-gray-700">
                        <span className="w-2 h-2 bg-rose-400 rounded-full" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto flex w-full justify-end border-t border-gray-100 pt-6">
                    <button
                      type="button"
                      onClick={() => handleBookNow(service.name)}
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
            ))}
          </div>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
