import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, ArrowRight, Menu, X } from 'lucide-react';
import { Button, Card, cn } from '../components/ui';
import { ParticleHero } from '../components/ParticleHero';
import { AgentCouncil } from '../components/AgentCouncil';
import { KnowledgeGraphDemo } from '../components/KnowledgeGraphDemo';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { SourceTicker } from '../components/SourceTicker';
import { TerminalFooter } from '../components/TerminalFooter';

function FadeInSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navItems = ['The Council', 'Knowledge Graph', 'Omni-Modal', 'Sutras'];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#030305] text-[#e8e6e1] font-['Space_Grotesk']">
      {/* Navigation */}
      <nav className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 lg:px-12 py-6',
        scrolled ? 'bg-[#030305]/80 backdrop-blur-md border-b border-white/5' : 'bg-transparent'
      )}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#ff7b00] flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-['Cinzel'] font-bold tracking-tight">ARROS</span>
          </div>

          <div className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(' ', '-')}`}
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <a href="/signin" className="text-sm text-white/60 hover:text-white transition-colors">Sign In</a>
            <Button variant="primary" onClick={() => window.location.href = '/app'}>
              Initialize
            </Button>
          </div>

          <button className="lg:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 lg:py-32 px-6 lg:px-12 min-h-screen flex items-center overflow-hidden">
        <ParticleHero />
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-5xl lg:text-7xl font-['Cinzel'] font-bold mb-6 text-white"
            >
              Building Your <span className="text-[#ff7b00]">Digital Atman.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-lg text-white/60 max-w-xl mx-auto mb-10 leading-relaxed"
            >
              ARROS is not an AI. It is an Autonomous Research & Reasoning OS—a council of specialized agents that critique, verify, and synthesize through a rigorous academic lens. Your second brain, fully realized.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            >
              <Button 
                variant="primary" 
                size="lg" 
                className="bg-[#ff7b00] hover:bg-[#ff7b00]/90"
                onClick={() => window.location.href = '/app'}
              >
                Initialize Connection
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="grid grid-cols-3 gap-8 border-t border-white/10 pt-8"
            >
              <div>
                <span className="block text-2xl font-['Cinzel'] font-bold text-[#ff7b00]">
                  <AnimatedCounter end={100000000} />
                </span>
                <span className="text-xs text-white/40 uppercase tracking-wider">Sutras Digested</span>
              </div>
              <div>
                <span className="block text-2xl font-['Cinzel'] font-bold text-white">5 Agents</span>
                <span className="text-xs text-white/40 uppercase tracking-wider">in Council</span>
              </div>
              <div>
                <span className="block text-2xl font-['Cinzel'] font-bold text-white">∞</span>
                <span className="text-xs text-white/40 uppercase tracking-wider">Knowledge Span</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section 01: The Council */}
      <section id="the-council" className="py-24 lg:py-32 px-6 lg:px-12 bg-[#121214]">
        <div className="max-w-7xl mx-auto">
          <FadeInSection>
            <div className="mb-16">
              <span className="text-sm font-mono text-[#ff7b00] mb-4 block">01 // THE ARCHITECTURE</span>
              <h2 className="text-4xl lg:text-5xl font-['Cinzel'] font-bold mb-6 text-white">
                The 5-Agent Council: <br />
                <span className="text-[#ff7b00]">Decentralized Intelligence.</span>
              </h2>
              <p className="text-white/60 max-w-lg text-lg leading-relaxed">
                Unlike shallow LLMs that generate and hope, ARROS deploys a council of specialized agents that critique, verify, and synthesize information through a rigorous academic lens. Each agent holds a specific dharma. Together, they reach conclusions no single model can.
              </p>
            </div>
          </FadeInSection>

          <AgentCouncil />
        </div>
      </section>

      {/* Section 02: Omni-Modal */}
      <section id="omni-modal" className="py-24 lg:py-32 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <FadeInSection>
            <span className="text-sm font-mono text-[#ff7b00] mb-4 block">02 // THE SENSES</span>
            <h2 className="text-4xl lg:text-5xl font-['Cinzel'] font-bold mb-6 text-white">
              Beyond Text. <br />
              <span className="text-[#ff7b00]">Omni-Modal Insight.</span>
            </h2>
            <p className="text-white/60 max-w-lg text-lg leading-relaxed mb-16">
              ARROS doesn't just read. It hears, sees, and remembers. Your voice memos, research papers, and visual data are woven into a single living identity—indexed, cross-referenced, and ready for synthesis.
            </p>
          </FadeInSection>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { emoji: '🎙️', title: 'Voice', desc: 'Drop a voice memo. ARROS transcribes, timestamps, and embeds it into your knowledge graph—linked to every relevant concept you have ever saved.' },
              { emoji: '📄', title: 'Documents', desc: 'Upload PDFs, epubs, or handwritten notes. OCR, semantic chunking, and citation extraction happen in seconds. Not stored. Understood.' },
              { emoji: '🖼️', title: 'Vision', desc: 'Paste an image. ARROS detects objects, extracts text, reads charts, and connects visual insights to your existing research corpus.' },
            ].map((item, i) => (
              <FadeInSection key={item.title} delay={i * 0.1}>
                <Card className="p-8 bg-[#121214] border border-white/10 hover:border-[#ff7b00]/30 transition-colors h-full">
                  <span className="text-4xl mb-4 block">{item.emoji}</span>
                  <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">{item.desc}</p>
                </Card>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* Section 03: Knowledge Graph */}
      <section id="knowledge-graph" className="py-24 lg:py-32 px-6 lg:px-12 bg-[#121214]">
        <div className="max-w-7xl mx-auto">
          <FadeInSection>
            <span className="text-sm font-mono text-[#ff7b00] mb-4 block">03 // THE ATMAN</span>
            <h2 className="text-4xl lg:text-5xl font-['Cinzel'] font-bold mb-6 text-white">
              Your Second Brain, <br />
              <span className="text-[#ff7b00]">Fully Realized.</span>
            </h2>
            <p className="text-white/60 max-w-lg text-lg leading-relaxed mb-12">
              ARROS does not collect information. It digests it into wisdom. From academic papers to personal epiphanies, it builds a cohesive knowledge base that grows as you do—every connection visible, every source traceable.
            </p>
          </FadeInSection>

          <FadeInSection delay={0.2}>
            <KnowledgeGraphDemo />
          </FadeInSection>

          <FadeInSection delay={0.3}>
            <p className="text-sm text-white/40 mt-4 font-mono">Sample query loaded: "Consciousness in Artificial Systems" • 47 nodes • 89 edges</p>
          </FadeInSection>
        </div>
      </section>

      {/* Section 04: The Sutras */}
      <section id="sutras" className="py-24 lg:py-32 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <FadeInSection>
            <span className="text-sm font-mono text-[#ff7b00] mb-4 block">04 // THE CORPUS</span>
            <h2 className="text-4xl lg:text-5xl font-['Cinzel'] font-bold mb-4 text-white">
              100 Million Sutras. <br />
              <span className="text-[#ff7b00]">One Living Memory.</span>
            </h2>
          </FadeInSection>

          <FadeInSection delay={0.1}>
            <SourceTicker />
          </FadeInSection>

          <FadeInSection delay={0.2}>
            <p className="text-white/60 max-w-lg text-lg leading-relaxed mt-8">
              Ancient wisdom and modern research, ingested with equal rigor. The Council does not discriminate by era—only by veracity.
            </p>
          </FadeInSection>
        </div>
      </section>

      {/* Section 05: Reasoning Transparency */}
      <section id="the-dharma" className="py-24 lg:py-32 px-6 lg:px-12 bg-[#121214]">
        <div className="max-w-7xl mx-auto">
          <FadeInSection>
            <span className="text-sm font-mono text-[#ff7b00] mb-4 block">05 // THE DHARMA</span>
            <h2 className="text-4xl lg:text-5xl font-['Cinzel'] font-bold mb-6 text-white">
              We Show <span className="text-[#ff7b00]">Our Work.</span>
            </h2>
            <p className="text-white/60 max-w-lg text-lg leading-relaxed mb-16">
              In an era of AI-generated noise, trust must be proven—not promised. Every output from ARROS includes a reasoning trail: which agents contributed, what sources were weighted, where biases were flagged, and how consensus was reached.
            </p>
          </FadeInSection>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Cite Your Sources', desc: 'Every claim links to its origin document' },
              { title: 'Show Your Work', desc: 'Expandable reasoning trail for complex syntheses' },
              { title: 'Bias Audit', desc: "The Critic's dissent is always visible, never hidden" },
            ].map((item, i) => (
              <FadeInSection key={item.title} delay={i * 0.1}>
                <Card className="p-8 bg-[#030305] border border-white/10 h-full">
                  <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">{item.desc}</p>
                </Card>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* Terminal Footer */}
      <footer className="py-16 px-6 lg:px-12 border-t border-white/10 bg-[#030305]">
        <div className="max-w-3xl mx-auto">
          <TerminalFooter />
          
          <div className="mt-12 text-center text-sm text-white/40">
            <p>ARROS — Autonomous Research & Reasoning OS</p>
            <p className="mt-2">Building Your Digital Atman.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}