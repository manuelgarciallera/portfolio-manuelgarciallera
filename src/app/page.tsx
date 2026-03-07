// ============================================================
// HOMEPAGE — importa secciones en orden narrativo
// Cada sección es independiente y editable por separado
// ============================================================
import { Navbar }          from '@/components/layout/Navbar'
import { HeroSection }     from '@/components/sections/HeroSection'
import { FeaturedSection } from '@/components/sections/FeaturedSection'
import { Footer }          from '@/components/layout/Footer'

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <FeaturedSection />
        {/* Las demás secciones se irán añadiendo aquí en orden */}
      </main>
      <Footer />
    </>
  )
}
