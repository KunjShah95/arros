import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  ArrowRight,
  BookOpen,
  Mic,
  FileSearch,
  Globe,
  Sparkles,
  Search,
  Shield,
  Layers,
  Menu,
  X
} from 'lucide-react';
import { Button, Card, cn } from '../components/ui';

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.8, ease: 'easeOut' }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.15
    }
  }
};

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
  const navItems = ['Architecture', 'Capabilities', 'Academic Path', 'Community'];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary font-body">
      {/* Navigation */}
      <nav className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 lg:px-12',
        scrolled ? 'py-4 bg-bg-primary/80 backdrop-blur-md border-b border-border' : 'py-8 bg-transparent'
      )}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-display font-bold tracking-tight">ARROS</span>
          </div>

          <div className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(' ', '-')}`}
                className="text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <a href="/signin" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Sign In</a>
            <Button variant="primary" onClick={() => window.location.href = '/app'}>
              Get Started
            </Button>
          </div>

          <button className="lg:hidden text-text-primary" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-24 lg:py-32 px-6 lg:px-12 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto w-full">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial="initial"
              animate="animate"
              variants={staggerContainer}
            >
              <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-4 py-2 bg-bg-secondary rounded-full mb-8">
                <Sparkles className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-accent">Vedic Era Reasoning Engine</span>
              </motion.div>

              <motion.h1 variants={fadeIn} className="display-xl font-display font-bold mb-6 leading-tight">
                Building Your <br />
                <span className="text-accent">Digital Atman.</span>
              </motion.h1>

              <motion.p variants={fadeIn} className="text-lg text-text-secondary max-w-xl mx-auto mb-10 leading-relaxed">
                ARROS is an Autonomous Research & Reasoning OS that blends ancient Indian wisdom with modern synthesis. Not just an AI, but a second brain that remembers, reasons, and helps you realize ideas faster.
              </motion.p>

              <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="primary" size="lg" onClick={() => window.location.href = '/app'}>
                  Experience ARROS
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button variant="outline" size="lg" onClick={() => window.location.href = '/app'}>
                  The Scholar's Path
                </Button>
              </motion.div>

              <motion.div variants={fadeIn} className="mt-16 grid grid-cols-3 gap-8 border-t border-border pt-8">
                <div>
                  <span className="block text-2xl font-display font-bold text-text-primary">100M+</span>
                  <span className="text-xs text-text-muted uppercase tracking-wider">Sutras Digested</span>
                </div>
                <div>
                  <span className="block text-2xl font-display font-bold text-text-primary">5-Agent</span>
                  <span className="text-xs text-text-muted uppercase tracking-wider">Council Logic</span>
                </div>
                <div>
                  <span className="block text-2xl font-display font-bold text-text-primary">Infinite</span>
                  <span className="text-xs text-text-muted uppercase tracking-wider">Knowledge Span</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section 01: The Council */}
      <section id="architecture" className="py-24 lg:py-32 px-6 lg:px-12 bg-bg-secondary">
        <div className="max-w-7xl mx-auto">
          <FadeInSection>
            <div className="mb-16">
              <h2 className="display-lg font-display font-bold mb-4">
                The 5-Agent Council: <br />
                <span className="text-accent">Decentralized Intelligence.</span>
              </h2>
              <p className="text-text-secondary max-w-lg text-lg leading-relaxed">
                Unlike shallow LLMs, ARROS deploys a council of specialized agents that critique, verify, and synthesize information through a rigorous academic lens.
              </p>
            </div>
          </FadeInSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { title: 'The Planner', icon: Search, desc: 'Architects the research trajectory' },
              { title: 'Web Sage', icon: Globe, desc: 'Traverses the global network' },
              { title: 'The Scholar', icon: BookOpen, desc: 'Deep-dives into academic arcana' },
              { title: 'The Critic', icon: Shield, desc: 'Verification & bias neutralization' },
              { title: 'The Weaver', icon: Layers, desc: 'Synthesis of the final revelation' }
            ].map((agent, i) => (
              <FadeInSection key={agent.title} delay={i * 0.1}>
                <Card className="p-8 bg-bg-primary border border-border hover:border-accent/30 transition-colors h-full">
                  <div className="w-12 h-12 bg-accent-light flex items-center justify-center mb-6">
                    <agent.icon className="w-5 h-5 text-accent" />
                  </div>
                  <h3 className="text-base font-display font-semibold text-text-primary mb-2">{agent.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{agent.desc}</p>
                </Card>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* Section 02: Modalities */}
      <section id="capabilities" className="py-24 lg:py-32 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">
            <div className="lg:w-1/2">
              <FadeInSection>
                <h2 className="display-lg font-display font-bold mb-6">
                  Beyond Text. <br />
                  <span className="text-accent">Omni-Modal Insight.</span>
                </h2>
                <p className="text-text-secondary mb-10 leading-relaxed text-lg">
                  ARROS doesn't just read; it hears, sees, and remembers. Your notes, voice recordings, and research papers are woven into a single living identity.
                </p>
              </FadeInSection>

              <div className="space-y-4">
                {[
                  { title: 'Voice Studio', icon: Mic, depth: '98%', status: 'Active' },
                  { title: 'Knowledge Scanner', icon: FileSearch, depth: '4K Res', status: 'Active' },
                  { title: 'Context Graph', icon: Globe, depth: 'Infinite', status: 'Active' }
                ].map((item) => (
                  <FadeInSection key={item.title}>
                    <div className="flex items-center gap-4 p-4 bg-bg-secondary border border-border hover:border-accent/30 transition-colors">
                      <div className="w-12 h-12 bg-accent flex items-center justify-center text-white">
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-text-primary">{item.title}</span>
                          <span className="text-xs text-accent font-mono">{item.status}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-text-muted">
                          <span>Depth: {item.depth}</span>
                          <div className="h-px flex-1 bg-border" />
                        </div>
                      </div>
                    </div>
                  </FadeInSection>
                ))}
              </div>
            </div>

            <div className="lg:w-1/2">
              <FadeInSection>
                <div className="p-6 bg-bg-secondary border border-border">
                  <div className="flex items-center gap-2 mb-4 border-b border-border pb-4">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-accent/30" />
                      <div className="w-3 h-3 rounded-full bg-text-muted/30" />
                      <div className="w-3 h-3 rounded-full bg-text-muted/30" />
                    </div>
                    <div className="bg-bg-primary px-3 py-1 text-xs font-mono text-text-secondary">
                      arros://workspace/knowledge-graph
                    </div>
                  </div>
                  <div className="aspect-video bg-bg-primary flex items-center justify-center">
                    <Globe className="w-16 h-16 text-accent/20" />
                  </div>
                </div>
              </FadeInSection>
            </div>
          </div>
        </div>
      </section>

      {/* Section 03: CTA */}
      <section className="py-24 lg:py-32 px-6 lg:px-12 bg-bg-secondary">
        <div className="max-w-3xl mx-auto text-center">
          <FadeInSection>
            <h2 className="display-lg font-display font-bold mb-6">
              Your Second Brain, <br />
              <span className="text-accent italic">Fully Realized.</span>
            </h2>
            <p className="text-lg text-text-secondary mb-12 leading-relaxed">
              ARROS doesn't just collect information. It digests it into wisdom. From academic papers to personal epiphanies, it builds a cohesive knowledge base that grows as you do.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" size="lg" onClick={() => window.location.href = '/app'}>
                Initialize Your Atman
              </Button>
              <Button variant="outline" size="lg" onClick={() => window.location.href = '/app'}>
                View Protocol
              </Button>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 lg:px-12 border-t border-border bg-bg-primary">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-accent flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-display font-bold uppercase">ARROS</span>
              </div>
              <p className="text-sm text-text-secondary max-w-xs leading-relaxed">
                Empowering the next generation of scholars and thinkers with ancient-inspired autonomous intelligence.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-4">Architecture</h4>
              <ul className="space-y-3 text-sm text-text-secondary">
                <li><a href="#" className="hover:text-accent transition-colors">OS Core</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Agent Council</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Vedic Engine</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-4">Connect</h4>
              <ul className="space-y-3 text-sm text-text-secondary">
                <li><a href="#" className="hover:text-accent transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Discord</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Warpcast</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
            <span className="text-sm text-text-muted">© 2026 ARROS — Autonomous Research & Reasoning OS</span>
            <div className="flex gap-8 text-sm text-text-muted">
              <a href="#" className="hover:text-text-primary transition-colors">Privacy</a>
              <a href="#" className="hover:text-text-primary transition-colors">Terms</a>
              <a href="#" className="hover:text-text-primary transition-colors">Vedic License</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-bg-primary p-8 flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-center mb-16">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-display font-bold uppercase">ARROS</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X />
                </button>
              </div>
              <div className="space-y-6">
                {navItems.map((item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase().replace(' ', '-')}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-2xl font-display font-bold text-text-primary"
                  >
                    {item}
                  </a>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <Button variant="primary" className="w-full" onClick={() => { setMobileMenuOpen(false); window.location.href = '/app'; }}>
                Get Started
              </Button>
              <Button variant="outline" className="w-full" onClick={() => { setMobileMenuOpen(false); window.location.href = '/signin'; }}>
                Sign In
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default LandingPage;