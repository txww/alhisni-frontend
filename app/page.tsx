import Hero from "@/components/hero/Hero";
import ServicesSection from "@/components/sections/ServicesSection";
import TeachersSection from "@/components/sections/TeachersSection";
import AboutSection from "@/components/sections/AboutSection";

export default function Home() {
  return (
    <main>
      <Hero />
      <AboutSection />
      <ServicesSection />
      <TeachersSection />
    </main>
  );
}
