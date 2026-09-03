import { Sparkles } from 'lucide-react'
import { LandingDropzone } from '@/components/vibeguard/landing-dropzone'
import { FeatureCards } from '@/components/vibeguard/feature-cards'
import { AnimatedHeroTitle } from '@/components/vibeguard/animated-hero-title'

export default function LandingPage() {
  return (
    <div className="mx-auto w-full max-w-[1200px] py-8 md:py-14">
      {/* HERO */}
      <section className="flex flex-col items-center text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-cyan/5 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-cyan">
          <Sparkles className="size-3.5" />
          Real-Time Security Engine
        </span>

        <AnimatedHeroTitle className="mt-6" />

        <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
          AI Code Security &amp; Real-Time Vulnerability Audit Engine
        </p>
      </section>

      {/* DROPZONE + FLOATING FEATURE CARDS */}
      <section className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-5 lg:items-start">
        <div className="lg:col-span-3">
          <LandingDropzone />
        </div>
        <div className="lg:col-span-2">
          <FeatureCards />
        </div>
      </section>
    </div>
  )
}
