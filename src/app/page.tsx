// ============================================================
// HOMEPAGE — importa secciones en orden narrativo
// ============================================================
import { Navbar } from '@/components/layout/Navbar'
import { HeroSection } from '@/components/sections/HeroSection'
import { FeaturedSection } from '@/components/sections/FeaturedSection'
import { ThreeDSection } from '@/components/sections/ThreeDSection'
import { AboutSection } from '@/components/sections/AboutSection'
import { ContactSection } from '@/components/sections/ContactSection'
import { Footer } from '@/components/layout/Footer'

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <FeaturedSection />
        <ThreeDSection />
        <AboutSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  )
}
