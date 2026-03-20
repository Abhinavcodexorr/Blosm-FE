"use client";

import ScrollReveal from "./ScrollReveal";

const testimonials = [
  {
    quote: "I felt pampered and valued from the moment I walked in. The service was exceptional, and the atmosphere was serene. Blosm is now my go-to salon.",
    author: "Emily Smith",
    location: "Perth",
    rating: 5,
  },
  {
    quote: "The elegant ambiance and attentive staff made my visit unforgettable. I highly recommend Blosm for any woman seeking a premium salon experience.",
    author: "Sarah Lee",
    location: "Perth",
    rating: 5,
  },
  {
    quote: "Best keratin treatment I've ever had. My hair has never looked or felt better. Worth every penny.",
    author: "Jessica Chen",
    location: "Perth",
    rating: 5,
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 md:py-36 bg-gradient-to-b from-rose-50 to-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <ScrollReveal direction="up">
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-1.5 bg-amber-100 text-amber-800 text-xs font-medium tracking-[0.3em] uppercase rounded-full mb-6">
              Testimonials
            </span>
            <h2 className="font-display text-4xl md:text-6xl font-light text-charcoal mb-6">
              Client Love
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Hear what our clients say about their luxurious experiences at Blosm.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <ScrollReveal key={index} direction="up" delay={index * 100}>
              <div className="bg-white p-10 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                <div className="flex gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-amber-500 text-xl">★</span>
                  ))}
                </div>
                <blockquote className="text-gray-600 leading-relaxed mb-8 text-lg">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>
                <div>
                  <span className="font-semibold text-charcoal">{testimonial.author}</span>
                  <span className="text-gray-400 ml-2">• {testimonial.location}</span>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
