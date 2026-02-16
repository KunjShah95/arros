import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Shield,
  Network,
  Brain,
  Zap,
  BadgeCheck,
  Star,
} from 'lucide-react';
import { Button, Card, Badge } from '../components/ui';

const featureRail = [
  {
    title: 'Proof-first research',
    description: 'Every claim is traced to evidence with confidence weighting and contradiction flags.',
    icon: Shield,
    tone: 'flame',
  },
  {
    title: 'Living knowledge graph',
    description: 'Connect insights automatically and watch your thinking compound over time.',
    icon: Network,
    tone: 'electric',
  },
  {
    title: 'Agent orchestration',
    description: 'Seven specialist agents coordinate planning, searching, critique, and synthesis.',
    icon: Brain,
    tone: 'mint',
  },
];

const proofSignals = [
  { label: 'Evidence depth', value: 'L4', detail: 'Multi-source verification' },
  { label: 'Signal clarity', value: '92%', detail: 'Contradiction sweep' },
  { label: 'Synthesis time', value: '3m', detail: 'Parallel agent run' },
];

const testimonials = [
  {
    quote: 'Nexus feels like having a research lab on call — it shows the receipts, not just the summary.',
    name: 'Riya Patel',
    role: 'Product Strategy, Helix Labs',
  },
  {
    quote: 'We cut our discovery time by 60% because the system surfaces contradictions before we ship.',
    name: 'Marcus Lee',
    role: 'Founder, Synthline',
  },
];

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-void relative overflow-hidden">
      <div className="noise-overlay" />
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="absolute -top-32 right-10 w-[540px] h-[540px] bg-flame/12 rounded-full blur-[180px]" />
      <div className="absolute bottom-0 left-0 w-[520px] h-[520px] bg-electric/12 rounded-full blur-[180px]" />

      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-smoke/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-none bg-flame flex items-center justify-center relative overflow-hidden cut-card">
              <div className="absolute inset-0 bg-gradient-to-br from-flame-glow to-flame opacity-0 group-hover:opacity-100 transition-opacity" />
              <Sparkles className="w-5 h-5 text-void relative z-10" />
            </div>
            <span className="font-display font-bold text-xl text-chalk tracking-tight">NEXUS</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-silver">
            <a href="#proof" className="hover:text-chalk transition-colors">Proof</a>
            <a href="#system" className="hover:text-chalk transition-colors">System</a>
            <a href="#clients" className="hover:text-chalk transition-colors">Clients</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/signin" className="text-sm text-silver hover:text-chalk transition-colors hidden sm:block">
              Sign in
            </Link>
            <Link to="/signup">
              <Button variant="primary" size="sm">Create account</Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="pt-36 pb-24 px-6 relative">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.05fr_0.95fr] gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <Badge variant="flame" className="mb-5">Proof-native research OS</Badge>
            <h1 className="display-xl font-display font-bold text-chalk text-balance">
              Evidence-first research for teams that move fast.
            </h1>
            <p className="text-lg text-silver mt-6 max-w-xl">
              Nexus delivers verified synthesis, transparent sources, and an evolving memory system. Spend time deciding — not hunting for proof.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Button
                variant="electric"
                size="lg"
                className="gap-2"
                onClick={() => navigate('/signup')}
              >
                Start free
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/signin')}
              >
                Sign in
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap gap-3 text-xs text-ash uppercase tracking-[0.24em]">
              <span className="cut-card cut-border bg-slate/60 px-4 py-2">No credit card</span>
              <span className="cut-card cut-border bg-slate/60 px-4 py-2">Proof ledger</span>
              <span className="cut-card cut-border bg-slate/60 px-4 py-2">Agent orchestration</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="prism-frame p-6 bg-graphite/80 backdrop-blur-xl">
              <div className="prism-beam" />
              <div className="relative">
                <div className="flex items-center justify-between text-xs text-ash uppercase tracking-[0.3em]">
                  <span>Proof console</span>
                  <span>Live</span>
                </div>

                <div className="mt-6 space-y-4">
                  {proofSignals.map((signal) => (
                    <div key={signal.label} className="cut-card cut-border bg-slate/70 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-ash uppercase tracking-[0.2em]">{signal.label}</span>
                        <span className="text-lg font-display text-chalk">{signal.value}</span>
                      </div>
                      <p className="text-sm text-silver mt-2">{signal.detail}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 cut-card bg-graphite/70 p-4">
                  <div className="flex items-center gap-2 text-sm text-chalk">
                    <BadgeCheck className="w-4 h-4 text-electric" />
                    Verified synthesis — 17 sources, 3 contradictions surfaced.
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-ash uppercase tracking-[0.2em]">
                    <span>Cycle time</span>
                    <span className="text-chalk tracking-normal">2m 48s</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-6 border-y border-smoke/50 bg-slate/30" id="proof">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          {featureRail.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full cut-card cut-border">
                <div className={`w-12 h-12 cut-card bg-${feature.tone}/10 flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-6 h-6 text-${feature.tone}`} />
                </div>
                <h3 className="text-lg font-semibold text-chalk mb-2">{feature.title}</h3>
                <p className="text-sm text-silver leading-relaxed">{feature.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="py-24 px-6" id="system">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_1fr] gap-10">
          <div>
            <Badge variant="electric" className="mb-4">System clarity</Badge>
            <h2 className="display-lg font-display text-chalk">
              The research stack that never loses the thread.
            </h2>
            <p className="text-lg text-silver mt-5 max-w-xl">
              Each session captures hypothesis, sources, contradictions, and outputs in a single traceable flow. When you return, the system resumes with context.
            </p>
            <div className="mt-8 grid gap-4">
              {[
                { label: 'Autonomous planning', detail: 'Multi-step research plans with adaptive prompts.' },
                { label: 'Source verification', detail: 'Confidence scoring for every claim and link.' },
                { label: 'Operational handoff', detail: 'Actionable outputs ready for docs, teams, or tooling.' },
              ].map((item) => (
                <div key={item.label} className="cut-card cut-border bg-slate/60 p-4">
                  <div className="text-xs text-ash uppercase tracking-[0.2em]">{item.label}</div>
                  <p className="text-sm text-silver mt-2">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="cut-card cut-border bg-graphite/70 p-5">
              <div className="flex items-center justify-between text-xs text-ash uppercase tracking-[0.2em]">
                <span>Agent cadence</span>
                <span className="text-chalk tracking-normal">7 active</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="cut-card bg-slate/70 p-3">
                  <div className="text-ash">Planner</div>
                  <div className="text-chalk mt-1">Evidence map built</div>
                </div>
                <div className="cut-card bg-slate/70 p-3">
                  <div className="text-ash">Critic</div>
                  <div className="text-chalk mt-1">3 contradictions flagged</div>
                </div>
                <div className="cut-card bg-slate/70 p-3">
                  <div className="text-ash">Synthesizer</div>
                  <div className="text-chalk mt-1">Decision brief ready</div>
                </div>
                <div className="cut-card bg-slate/70 p-3">
                  <div className="text-ash">Memory</div>
                  <div className="text-chalk mt-1">Graph updated</div>
                </div>
              </div>
            </div>
            <div className="cut-card cut-border bg-slate/60 p-5">
              <div className="flex items-center gap-3 text-sm text-chalk">
                <Zap className="w-4 h-4 text-flame" />
                Ship-ready output in minutes, with proof attached.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-slate/30" id="clients">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <Badge variant="flame">Client signals</Badge>
              <h2 className="display-md font-display text-chalk mt-3">Teams choosing verified intelligence.</h2>
            </div>
            <div className="hidden md:flex items-center gap-2 text-ash text-xs uppercase tracking-[0.2em]">
              <Star className="w-4 h-4 text-electric" />
              4.9/5 operator score
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {testimonials.map((item) => (
              <Card key={item.name} className="cut-card cut-border">
                <p className="text-silver text-base leading-relaxed">“{item.quote}”</p>
                <div className="mt-4 text-xs text-ash uppercase tracking-[0.2em]">
                  {item.name}
                  <span className="block text-silver tracking-normal mt-1">{item.role}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-flame/10 to-transparent" />
        <div className="max-w-5xl mx-auto">
          <Card variant="elevated" className="p-12 cut-card cut-border">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div>
                <h2 className="display-md font-display text-chalk">Ready to launch your proof stack?</h2>
                <p className="text-lg text-silver mt-4 max-w-xl">
                  Create an account and jump straight into the Nexus workspace. Everything routes to the main app the moment you authenticate.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Button variant="electric" size="lg" className="gap-2" onClick={() => navigate('/signup')}>
                  Create account
                  <ArrowRight className="w-5 h-5" />
                </Button>
                <Button variant="secondary" size="lg" onClick={() => navigate('/signin')}>
                  Sign in
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <footer className="py-10 px-6 border-t border-smoke/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 cut-card bg-flame flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-void" />
            </div>
            <span className="font-display font-bold text-chalk">NEXUS</span>
          </div>
          <div className="text-sm text-ash">© 2026 Nexus Research OS. Verified intelligence at speed.</div>
        </div>
      </footer>
    </div>
  );
}
