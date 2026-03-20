"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import LazyImage from "@/components/LazyImage";
import { getCategories } from "@/services/api";
import { useLoginModal } from "@/context/LoginModalContext";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=85";

export default function ServicesPage() {
  const { handleBookNow } = useLoginModal();
  const [services, setServices] = useState<{ name: string; description: string; items: string[]; image: string; alt: string }[]>([]);
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
                <div className="p-10 md:p-16 flex-1">
                  <h2 className="font-display text-2xl md:text-3xl font-light text-charcoal mb-4">
                    {service.name}
                  </h2>
                  <p className="text-gray-600 mb-8 max-w-2xl">{service.description}</p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(service.items || []).map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-gray-700">
                        <span className="w-2 h-2 bg-rose-400 rounded-full" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => handleBookNow(service.name)}
                    className="inline-flex items-center gap-2 mt-8 text-amber-700 font-semibold hover:text-amber-800 transition-colors"
                  >
                    Book Now
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-rose-700 hover:text-rose-800 font-medium"
            >
              ← Back to Home
            </Link>
          </div>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
