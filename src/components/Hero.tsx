"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLoginModal } from "@/context/LoginModalContext";

// Unsplash - verified salon/beauty photos (woman at salon, hair styling, salon interior)
const heroImages = [
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1920&q=85",
  "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=1920&q=85",
  "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=1920&q=85",
  "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1920&q=85",
];

export default function Hero() {
  const { handleBookNow } = useLoginModal();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background images */}
      <div className="absolute inset-0">
        {heroImages.map((src, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-[1500ms] ease-in-out ${
              index === currentSlide ? "opacity-100 z-0" : "opacity-0 z-0"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              className="w-full h-full object-cover animate-slow-zoom"
            />
          </div>
        ))}
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/70 z-10" />

      {/* Content */}
      <div className={`relative z-20 max-w-5xl mx-auto px-6 text-center transition-all duration-1000 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        <p className="text-amber-200/90 text-sm uppercase tracking-[0.4em] mb-6 animate-fade-in-up">
          Perth&apos;s Women-Only Salon
        </p>
        <div className="mb-6">
          <span className="block font-display text-5xl md:text-7xl lg:text-8xl font-semibold tracking-wide uppercase logo-blosm-dark drop-shadow-2xl">
            BLOSM
          </span>
          <span className="block font-sans text-sm md:text-base uppercase tracking-[0.4em] text-white/95 mt-2">
            HAIR & BEAUTY
          </span>
        </div>
        <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-12 leading-relaxed">
          Where elegance meets expertise. Experience transformative beauty in a sanctuary designed exclusively for women.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            type="button"
            onClick={() => handleBookNow()}
            className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-amber-500 text-white font-medium tracking-wide hover:bg-amber-600 transition-all duration-300 shadow-lg hover:shadow-amber-500/30"
          >
            Book Appointment
          </button>
          <Link
            href="#services"
            className="inline-flex items-center justify-center gap-2 px-10 py-4 border-2 border-white/80 text-white font-medium tracking-wide hover:bg-white/10 transition-all duration-300"
          >
            Our Services
          </Link>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-3">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-1 rounded-full transition-all duration-500 ${
              index === currentSlide ? "bg-amber-400 w-10" : "bg-white/40 w-3 hover:bg-white/60"
            }`}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 hidden md:block">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center pt-2">
          <div className="w-1 h-2 bg-white/70 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
}
