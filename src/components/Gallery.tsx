"use client";

import ScrollReveal from "./ScrollReveal";
import LazyImage from "./LazyImage";

// Unsplash - verified salon/beauty gallery
const images = [
  { src: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=85", alt: "Salon interior" },
  { src: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&q=85", alt: "Hair styling" },
  { src: "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=800&q=85", alt: "Salon mirror" },
  { src: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=800&q=85", alt: "Nail salon" },
  { src: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&q=85", alt: "Salon station" },
  { src: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800&q=85", alt: "Salon interior" },
];

export default function Gallery() {
  return (
    <section className="pt-12 md:pt-16 pb-8 md:pb-10 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <ScrollReveal direction="up">
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-1.5 bg-amber-100 text-amber-800 text-xs font-medium tracking-[0.3em] uppercase rounded-full mb-6">
              Portfolio
            </span>
            <h2 className="font-display text-4xl md:text-6xl font-light text-charcoal mb-6">
              Elegant Transformations
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Real results from real clients. Discover the Blosm difference.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {images.map((image, index) => (
            <ScrollReveal
              key={index}
              direction="up"
              delay={index * 60}
              className="aspect-[4/5] overflow-hidden rounded-2xl group"
            >
              <LazyImage
                src={image.src}
                alt={image.alt}
                className="transition-transform duration-700 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
