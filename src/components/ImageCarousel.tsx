"use client";

const carouselImages = [
  { src: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80", alt: "Salon interior" },
  { src: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&q=80", alt: "Hair styling" },
  { src: "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=600&q=80", alt: "Salon mirror" },
  { src: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=600&q=80", alt: "Salon chairs" },
  { src: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=600&q=80", alt: "Nail salon" },
  { src: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600&q=80", alt: "Beauty salon" },
  { src: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80", alt: "Beauty makeup" },
  { src: "https://images.unsplash.com/photo-1622287162716-f311baa1a2b8?w=600&q=80", alt: "Hair color" },
];

export default function ImageCarousel() {
  const duplicated = [...carouselImages, ...carouselImages];

  return (
    <section className="py-12 overflow-hidden bg-rose-50/50">
      <div className="flex animate-scroll gap-6">
        {duplicated.map((img, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-72 md:w-80 aspect-[4/5] overflow-hidden rounded-lg shadow-md"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.src}
              alt={img.alt}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
