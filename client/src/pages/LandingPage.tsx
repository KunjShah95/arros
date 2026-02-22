import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Zap,
  Sparkles,
  ArrowRight,
  BookOpen,
  Mic,
  FileSearch,
  Globe,
  Shield,
  GraduationCap,
  History,
  Layout,
  Layers,
  Search,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { SanskritButton, Card, Badge, Divider, Mandala, DivyaSparkle, cn } from '../components/ui';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

function SectionNumber({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono text-saffron tracking-widest uppercase opacity-60">Section</span>
        <span className="text-xl font-display font-bold text-saffron">{number}</span>
      </div>
      <div className="h-px w-12 bg-saffron/20" />
      <span className="text-[10px] font-mono text-ash uppercase tracking-[0.3em] font-semibold">{title}</span>
    </div>
  );
}

function GridBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-40 shadow-[inset_0_0_150px_rgba(9,10,15,1)]" />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-saffron/5 to-transparent" />
      <div className="absolute bottom-0 left-0 w-1/2 h-full bg-gradient-to-r from-peacock/5 to-transparent" />

      {/* Decorative vertical lines */}
      <div className="absolute left-[10%] top-0 bottom-0 w-px bg-smoke/20 hidden lg:block" />
      <div className="absolute left-[30%] top-0 bottom-0 w-px bg-smoke/20 hidden lg:block" />
      <div className="absolute right-[30%] top-0 bottom-0 w-px bg-smoke/20 hidden lg:block" />
      <div className="absolute right-[10%] top-0 bottom-0 w-px bg-smoke/20 hidden lg:block" />
    </div>
  );
}

export function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-void text-chalk selection:bg-peacock selection:text-void font-body overflow-hidden">
      <GridBackground />
      <div className="noise-overlay" />

      {/* Navigation */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 lg:px-12",
        scrolled ? "py-4 bg-void/80 backdrop-blur-xl border-b border-white/5" : "py-8 bg-transparent"
      )}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 cut-card bg-gradient-to-br from-saffron to-gold flex items-center justify-center shadow-lg shadow-saffron/20">
              <Brain className="w-5 h-5 text-void" />
            </div>
            <div>
              <span className="text-xl font-display font-bold tracking-tight text-white block">ARROS</span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-saffron font-bold -mt-1 block">Ancient Intelligence</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-10">
            {['Architecture', 'Capabilities', 'Academic Path', 'Community'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(' ', '-')}`}
                className="text-[11px] uppercase tracking-[0.2em] font-bold text-ash hover:text-saffron transition-colors"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-6">
            <a href="/signin" className="text-[11px] uppercase tracking-[0.2em] font-bold text-chalk hover:text-saffron transition-colors">SignIn</a>
            <SanskritButton variant="primary" className="px-6 py-2.5 text-[10px] tracking-[0.15em] rounded-lg">
              Initialize OS
            </SanskritButton>
          </div>

          <button className="lg:hidden text-chalk" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-6 lg:px-12 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial="initial"
            animate="animate"
            variants={staggerContainer}
            className="relative z-10"
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-saffron/10 border border-saffron/20 mb-8">
              <DivyaSparkle className="text-saffron" />
              <span className="text-[10px] font-mono text-saffron uppercase tracking-[0.2em] font-bold">Vedic Era Reasoning Engine</span>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="display-xl font-display font-bold mb-8 leading-[0.9]">
              Building Your <br />
              <span className="bg-gradient-to-r from-saffron via-gold to-peacock bg-clip-text text-transparent">
                Digital Atman.
              </span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="text-lg text-silver max-w-xl mb-12 leading-relaxed">
              ARROS is the world's first Autonomous Research & Reasoning OS that weaves together ancient Indian wisdom with cutting-edge synthesis. Not just an AI, but a second brain that remembers, reasonings, and realizes.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4">
              <SanskritButton variant="primary" onClick={() => window.location.href = '/app'}>
                Experience ARROS
                <ArrowRight className="w-4 h-4 ml-2" />
              </SanskritButton>
              <SanskritButton variant="secondary" onClick={() => window.location.href = '/app'}>
                The Scholar's Path
              </SanskritButton>
            </motion.div>

            <motion.div variants={fadeInUp} className="mt-16 grid grid-cols-3 gap-8 border-t border-smoke/30 pt-8">
              <div>
                <span className="block text-2xl font-display font-bold text-white">100M+</span>
                <span className="text-[10px] uppercase tracking-widest text-ash">Sutras Digested</span>
              </div>
              <div>
                <span className="block text-2xl font-display font-bold text-white">5-Agent</span>
                <span className="text-[10px] uppercase tracking-widest text-ash">Council Logic</span>
              </div>
              <div>
                <span className="block text-2xl font-display font-bold text-white">Infinite</span>
                <span className="text-[10px] uppercase tracking-widest text-ash">Knowledge Span</span>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative hidden lg:block"
          >
            <div className="relative aspect-square max-w-lg mx-auto">
              <Mandala className="absolute inset-0 w-full h-full scale-150 animate-[spin_60s_linear_infinite] opacity-30" size="lg" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 cut-card bg-void border border-saffron/20 flex items-center justify-center overflow-hidden relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-saffron/10 via-transparent to-peacock/10" />
                  <Brain className="w-24 h-24 text-saffron group-hover:scale-110 transition-transform duration-500" />
                  <div className="prism-beam" />
                </div>
              </div>

              {/* Floating feature tags */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-0 right-0 p-4 cut-card bg-graphite border border-smoke/50"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-peacock animate-pulse" />
                  <span className="text-[10px] font-mono text-silver uppercase tracking-widest">Synthesis Engine Active</span>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-10 -left-10 p-4 cut-card bg-graphite border border-smoke/50"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-saffron animate-pulse" />
                  <span className="text-[10px] font-mono text-silver uppercase tracking-widest">Knowledge Graph Wired</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section 01: The Council */}
      <section id="architecture" className="relative py-32 px-6 lg:px-12 bg-obsidian/50">
        <div className="max-w-7xl mx-auto">
          <SectionNumber number="01" title="The Architecture" />

          <div className="grid lg:grid-cols-12 gap-12 items-end mb-20">
            <div className="lg:col-span-7">
              <h2 className="display-lg font-display font-bold mb-6">
                The 5-Agent Council: <br />
                <span className="text-saffron">Decentralized Intelligence.</span>
              </h2>
            </div>
            <div className="lg:col-span-5 pb-2">
              <p className="text-silver text-sm leading-relaxed max-w-sm">
                Unlike shallow LLMs, ARROS deploys a council of specialized agents that critique, verify, and synthesize information through a rigorous academic lens.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { title: "The Planner", icon: Layout, desc: "Architects the research trajectory", color: "saffron" },
              { title: "Web Sage", icon: Search, desc: "Traverses the global network", color: "peacock" },
              { title: "The Scholar", icon: BookOpen, desc: "Deep-dives into academic arcana", color: "gold" },
              { title: "The Critic", icon: Shield, desc: "Verification & bias neutralization", color: "saffron" },
              { title: "The Weaver", icon: Layers, desc: "Synthesis of the final revelation", color: "peacock" }
            ].map((agent, i) => (
              <motion.div
                key={agent.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group"
              >
                <Card className="h-full p-8 bg-slate/50 border-smoke/30 hover:border-saffron/30 transition-all group-hover:-translate-y-2 cut-card">
                  <div className={cn(
                    "w-12 h-12 cut-card flex items-center justify-center mb-6",
                    agent.color === 'saffron' ? "bg-saffron/10 text-saffron" :
                      agent.color === 'peacock' ? "bg-peacock/10 text-peacock" : "bg-gold/10 text-gold"
                  )}>
                    <agent.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-display font-bold text-white mb-2 uppercase tracking-widest">{agent.title}</h3>
                  <p className="text-xs text-ash leading-relaxed">{agent.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 02: Modalities */}
      <section id="capabilities" className="relative py-32 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-20 items-center">
            <div className="lg:w-1/2">
              <SectionNumber number="02" title="Capabilities" />
              <h2 className="display-lg font-display font-bold mb-8">
                Beyond Text. <br />
                <span className="text-peacock">Omni-Modal Insight.</span>
              </h2>
              <p className="text-silver mb-10 leading-relaxed text-sm">
                ARROS doesn't just read; it hears, sees, and remembers. Your notes, voice recordings, and research papers are woven into a single living identity.
              </p>

              <div className="space-y-6">
                {[
                  { title: "Voice Studio", icon: Mic, depth: "98%", status: "Active" },
                  { title: "Knowledge Scanner", icon: FileSearch, depth: "4K Res", status: "Active" },
                  { title: "Context Graph", icon: Globe, depth: "Infinite", status: "Active" }
                ].map((item) => (
                  <div key={item.title} className="flex items-center gap-6 p-4 cut-card bg-graphite/40 border border-smoke/30 group hover:border-saffron/30 transition-colors">
                    <div className="w-10 h-10 cut-card bg-void flex items-center justify-center text-saffron group-hover:bg-saffron group-hover:text-void transition-colors">
                      <item.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">{item.title}</span>
                        <span className="text-[10px] text-peacock font-mono">{item.status}</span>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-ash tracking-widest uppercase">
                        <span>Depth: {item.depth}</span>
                        <div className="h-px flex-1 bg-smoke/30" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:w-1/2 relative">
              <div className="relative z-10 p-4 cut-card bg-slate shadow-2xl border-smoke/50 rotate-3 group hover:rotate-0 transition-transform duration-500">
                <div className="flex items-center gap-2 mb-4 border-b border-smoke/30 pb-4">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-error" />
                    <div className="w-2.5 h-2.5 rounded-full bg-warning" />
                    <div className="w-2.5 h-2.5 rounded-full bg-peacock" />
                  </div>
                  <div className="bg-void px-3 py-1 rounded-md text-[9px] font-mono text-ash uppercase tracking-tighter">
                    arros://workspace/knowledge-graph
                  </div>
                </div>
                <div className="aspect-video bg-void cut-card flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 grid-pattern opacity-20" />
                  <History className="w-16 h-16 text-saffron/20 animate-pulse" />
                  <div className="absolute bottom-4 left-4 right-4 flex gap-2 overflow-hidden no-scrollbar">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="flex-shrink-0 w-24 h-16 bg-graphite/50 cut-card border border-smoke/30" />
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-peacock/5 blur-[120px] -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Section 03: The Vision */}
      <section className="relative py-32 px-6 lg:px-12 bg-obsidian">
        <div className="max-w-4xl mx-auto text-center">
          <SectionNumber number="03" title="The Realization" />
          <h2 className="display-lg font-display font-bold mb-8">
            Your Second Brain, <br />
            <span className="bg-gradient-to-r from-saffron to-gold bg-clip-text text-transparent italic">Fully Realized.</span>
          </h2>
          <p className="text-lg text-silver mb-12">
            ARROS doesn't just collect information. it digests it into wisdom. From academic papers to personal epiphanies, it builds a cohesive knowledge base that grows as you do.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <SanskritButton variant="primary" className="px-12 py-5" onClick={() => window.location.href = '/app'}>
              Initialize Your Atman
            </SanskritButton>
            <SanskritButton variant="outline" className="px-12 py-5" onClick={() => window.location.href = '/app'}>
              View Protocol
            </SanskritButton>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-24 px-6 lg:px-12 border-t border-smoke/30 bg-void">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-20">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 cut-card bg-gradient-to-br from-saffron to-gold flex items-center justify-center">
                  <Brain className="w-5 h-5 text-void" />
                </div>
                <span className="text-xl font-display font-bold tracking-tight text-white uppercase">ARROS</span>
              </div>
              <p className="text-sm text-ash max-w-xs leading-relaxed">
                Empowering the next generation of scholars and thinkers with ancient-inspired autonomous intelligence.
              </p>
            </div>

            <div>
              <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-saffron mb-8">Architecture</h4>
              <ul className="space-y-4 text-xs font-bold text-ash uppercase tracking-widest">
                <li><a href="#" className="hover:text-gold transition-colors">OS Core</a></li>
                <li><a href="#" className="hover:text-gold transition-colors">Agent Council</a></li>
                <li><a href="#" className="hover:text-gold transition-colors">Vedic Engine</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-saffron mb-8">Connection</h4>
              <ul className="space-y-4 text-xs font-bold text-ash uppercase tracking-widest">
                <li><a href="#" className="hover:text-gold transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-gold transition-colors">Discord</a></li>
                <li><a href="#" className="hover:text-gold transition-colors">Warpcast</a></li>
              </ul>
            </div>
          </div>

          <Divider className="opacity-20 mb-8" />

          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-ash">© 2026 ARROS — Autonomous Research & Reasoning OS</span>
            <div className="flex gap-8 text-[10px] uppercase tracking-[0.2em] font-bold text-ash">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Vedic License</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 z-[100] bg-void p-8 flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-center mb-16">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 cut-card bg-saffron flex items-center justify-center">
                    <Brain className="w-5 h-5 text-void" />
                  </div>
                  <span className="text-xl font-display font-bold uppercase">ARROS</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X />
                </button>
              </div>
              <div className="space-y-8">
                {['Architecture', 'Capabilities', 'Academic Path', 'Community'].map((item) => (
                  <a key={item} href="#" className="block text-2xl font-display font-bold uppercase tracking-widest text-white hover:text-saffron">
                    {item}
                  </a>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <SanskritButton variant="primary" className="w-full">Initialize OS</SanskritButton>
              <SanskritButton variant="secondary" className="w-full">SignIn</SanskritButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default LandingPage;
