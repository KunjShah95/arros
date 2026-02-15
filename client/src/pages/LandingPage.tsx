import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Brain, 
  Search, 
  Shield, 
  Zap, 
  Database, 
  Network,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  BarChart3,
  GitBranch,
  Layers,
  MessageSquare,
  ChevronRight
} from 'lucide-react';
import { Button, Card, Badge } from '../components/ui';

const features = [
  {
    icon: Brain,
    title: 'Multi-Agent Intelligence',
    description: '7 specialized AI agents work together - Planner, Research, Critic, Synthesizer, Memory, Action, and Meta Evaluator.',
    color: 'flame',
  },
  {
    icon: Shield,
    title: 'Truth Verification',
    description: 'Automatic fact-checking, hallucination detection, and contradiction identification with confidence scores.',
    color: 'electric',
  },
  {
    icon: Database,
    title: 'Persistent Memory',
    description: 'Build your personal knowledge graph over time. Remember everything you research with vector embeddings.',
    color: 'mint',
  },
  {
    icon: Zap,
    title: 'Real-Time Updates',
    description: 'Watch agents work in real-time. WebSocket-powered progress tracking for every research task.',
    color: 'flame',
  },
  {
    icon: Network,
    title: 'Knowledge Graph',
    description: 'Visualize connections between concepts. See how your research builds a connected knowledge base.',
    color: 'electric',
  },
  {
    icon: BarChart3,
    title: 'Actionable Outputs',
    description: 'Generate PRDs, architecture plans, decision matrices, and code scaffolds from your research.',
    color: 'mint',
  },
];

const howItWorks = [
  {
    step: 1,
    title: 'Ask a Question',
    description: 'Enter any research query - from simple facts to complex comparisons.',
    icon: MessageSquare,
  },
  {
    step: 2,
    title: 'Agents Research',
    description: 'Multiple AI agents search, verify, and analyze sources in parallel.',
    icon: Search,
  },
  {
    step: 3,
    title: 'Verify & Synthesize',
    description: 'Claims are verified, contradictions detected, and findings synthesized.',
    icon: GitBranch,
  },
  {
    step: 4,
    title: 'Knowledge Stored',
    description: 'Results are stored in your personal knowledge graph for future reference.',
    icon: Layers,
  },
];

const stats = [
  { value: '7', label: 'AI Agents', color: 'flame' },
  { value: '99%', label: 'Accuracy', color: 'mint' },
  { value: '10x', label: 'Faster Research', color: 'electric' },
  { value: '∞', label: 'Knowledge Growth', color: 'flame' },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-void relative overflow-hidden">
      {/* Grain overlay */}
      <div className="noise-overlay" />
      
      {/* Background patterns */}
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-flame/5 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-electric/5 rounded-full blur-[120px]" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-smoke/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-flame flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-flame-glow to-flame opacity-0 group-hover:opacity-100 transition-opacity" />
              <Sparkles className="w-5 h-5 text-white relative z-10" />
            </div>
            <span className="font-display font-bold text-xl text-chalk tracking-tight">NEXUS</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/app" className="text-sm text-silver hover:text-chalk transition-colors">
              Launch App
            </Link>
            <Link to="/app">
              <Button variant="primary" size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-24 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center relative"
          >
            {/* Floating badge */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate border border-smoke mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-mint animate-pulse" />
              <span className="text-sm text-silver">Powered by GPT-4 & Claude</span>
            </motion.div>
            
            {/* Main headline */}
            <h1 className="display-xl font-display font-bold text-chalk mb-6 text-balance">
              Research at the{' '}
              <span className="gradient-text">speed of thought</span>
            </h1>
            
            <p className="text-xl text-silver max-w-2xl mx-auto mb-10 leading-relaxed">
              An autonomous research platform that plans, verifies, remembers, and evolves. 
              Build your personal knowledge OS with AI agents that think, verify, and synthesize.
            </p>
            
            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/app">
                <Button variant="electric" size="lg" className="gap-2 group">
                  Start Researching
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button variant="secondary" size="lg" className="gap-2">
                <Sparkles className="w-5 h-5" />
                Watch Demo
              </Button>
            </div>
          </motion.div>

          {/* Demo preview card */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mt-20 relative"
          >
            {/* Glow behind */}
            <div className="absolute inset-0 bg-gradient-to-t from-flame/10 via-transparent to-electric/10 rounded-3xl blur-2xl" />
            
            <div className="relative rounded-2xl border border-smoke bg-slate/80 backdrop-blur-xl overflow-hidden shadow-2xl">
              {/* Window controls */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-smoke/50 bg-graphite">
                <div className="w-3 h-3 rounded-full bg-error/80" />
                <div className="w-3 h-3 rounded-full bg-warning/80" />
                <div className="w-3 h-3 rounded-full bg-mint/80" />
                <span className="ml-4 text-xs text-ash">nexus.research</span>
              </div>
              
              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Agent cards */}
                <div className="space-y-3">
                  <AgentStatus 
                    icon={Brain} 
                    title="Planning research strategy..." 
                    subtext="Planner Agent"
                    color="flame"
                    delay={0}
                  />
                  <AgentStatus 
                    icon={Search} 
                    title="Found 15 relevant sources" 
                    subtext="Research Agent"
                    color="electric"
                    delay={0.1}
                  />
                  <AgentStatus 
                    icon={CheckCircle2} 
                    title="12 claims verified, 3 flagged" 
                    subtext="Critic Agent"
                    color="mint"
                    delay={0.2}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-smoke/50 bg-slate/30">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className={`text-5xl font-display font-bold text-${stat.color} mb-2`}>
                  {stat.value}
                </div>
                <div className="text-silver">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="flame" className="mb-4">Beyond Traditional Search</Badge>
            <h2 className="display-lg font-display font-bold text-chalk mb-4">
              Your Personal Knowledge OS
            </h2>
            <p className="text-lg text-silver max-w-2xl mx-auto">
              Unlike Perplexity or ChatGPT, Nexus builds persistent knowledge that grows with every query.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card hover className="h-full group">
                  <div className={`w-14 h-14 rounded-xl bg-${feature.color}/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`w-7 h-7 text-${feature.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-chalk mb-2">{feature.title}</h3>
                  <p className="text-silver text-sm leading-relaxed">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 bg-slate/30 relative">
        <div className="absolute inset-0 dot-pattern opacity-30" />
        
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-16">
            <Badge variant="electric" className="mb-4">The Process</Badge>
            <h2 className="display-lg font-display font-bold text-chalk mb-4">
              How Nexus Works
            </h2>
            <p className="text-lg text-silver max-w-2xl mx-auto">
              A society of AI agents working in harmony to answer your questions
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
                viewport={{ once: true }}
                className="relative"
              >
                <Card className="h-full text-center">
                  <div className="w-16 h-16 rounded-2xl bg-flame/10 flex items-center justify-center mx-auto mb-4 relative">
                    <step.icon className="w-8 h-8 text-flame" />
                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-flame text-white text-sm font-bold flex items-center justify-center">
                      {step.step}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-chalk mb-2">{step.title}</h3>
                  <p className="text-silver text-sm">{step.description}</p>
                </Card>
                
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <ChevronRight className="w-6 h-6 text-ash" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-flame/5 to-transparent" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center relative"
        >
          <Card variant="elevated" className="p-12 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-flame/10 rounded-full blur-[100px]" />
            
            <div className="relative">
              <h2 className="display-md font-display font-bold text-chalk mb-4">
                Ready to build your second brain?
              </h2>
              <p className="text-lg text-silver mb-8 max-w-xl mx-auto">
                Start researching smarter with autonomous AI agents that remember everything.
              </p>
              <Link to="/app">
                <Button variant="electric" size="lg" className="gap-2">
                  Start Free Research
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-smoke/50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-flame flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-chalk">NEXUS</span>
            </div>
            <p className="text-sm text-ash">
              © 2026 Nexus Research OS. Built with AI agents.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function AgentStatus({ 
  icon: Icon, 
  title, 
  subtext, 
  color,
  delay 
}: { 
  icon: React.ElementType; 
  title: string; 
  subtext: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="flex items-center gap-3 p-3 rounded-xl bg-graphite/50 border border-smoke/50"
    >
      <div className={`w-10 h-10 rounded-lg bg-${color}/10 flex items-center justify-center`}>
        <Icon className={`w-5 h-5 text-${color}`} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-chalk">{title}</p>
        <p className="text-xs text-ash">{subtext}</p>
      </div>
    </motion.div>
  );
}
