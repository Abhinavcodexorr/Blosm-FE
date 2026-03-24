import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ImageCarousel from "@/components/ImageCarousel";
import Stats from "@/components/Stats";
import WhyUs from "@/components/WhyUs";
import Services from "@/components/Services";
import Gallery from "@/components/Gallery";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <ImageCarousel />
      <Stats />
      <WhyUs />
      <Services limit={3} />
      <Gallery />
      <Testimonials />
      <Footer />
    </main>
  );
}
