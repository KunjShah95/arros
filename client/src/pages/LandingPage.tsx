import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Shield,
  GraduationCap,
  Brain,
  FileText,
  BadgeCheck,
  Star,
  Cpu,
  Search,
  Layers,
  Mic,
  Volume2,
  Eye,
  BookOpen,
} from 'lucide-react';
import { Button, Card, Badge, DivyaSparkle } from '../components/ui';

const sanskritMantras = {
  tagline: 'विद्यया अमृतमश्नुते',
  translation: 'Knowledge is immortal',
};

const agentSociety = [
  {
    number: '01',
    name: 'Planner Agent',
    description: 'विभज्यते — Breaks your query into academic subtasks with Vedic precision.',
    icon: Brain,
    tone: 'saffron',
  },
  {
    number: '02',
    name: 'Web Research Agent',
    description: 'अन्वेषणं — Fetches foundational knowledge from Wikipedia and authoritative sources.',
    icon: Search,
    tone: 'peacock',
  },
  {
    number: '03',
    name: 'Scholar Agent',
    description: 'ग्रन्थान्वेषी — Searches Semantic Scholar, arXiv for peer-reviewed papers.',
    icon: FileText,
    tone: 'gold',
  },
  {
    number: '04',
    name: 'Critic Verifier',
    description: 'परिक्षकः — Checks reliability, detects contradictions with scholarly rigor.',
    icon: Shield,
    tone: 'saffron',
  },
  {
    number: '05',
    name: 'Synthesizer Agent',
    description: 'सङ्ग्राहकः — Produces structured academic report with citations.',
    icon: Layers,
    tone: 'peacock',
  },
];

const outputPreview = [
  { label: 'Confidence', value: '0.87', detail: 'Multi-source verification' },
  { label: 'Verified Sources', value: '6', detail: 'Peer-reviewed + web' },
  { label: 'Contradictions', value: '1', detail: 'Flagged & noted' },
];

const exampleOutputSections = [
  'प्रस्तावना (Introduction)',
  'मूलभूतसंकल्पनानि (Concepts)',
  'शोधनिष्कर्षानि (Key Findings)',
  'अनुप्रयोगः (Applications)',
  'चुनौतयः (Challenges)',
  'भविष्यदिशानि (Future)',
  'उपसंहारः (Conclusion)',
  'मुख्यबिन्दवः (Takeaways)',
  'अधिकग्रहणाय (Further Reading)',
  'संदर्भसूची (References)',
];

const testimonials = [
  {
    quote: 'ARROS transformed my research workflow. The citations are real and structure follows ancient sutra tradition — concise and precise.',
    name: 'Priya Sharma',
    role: 'PhD Scholar, IIT Delhi',
  },
  {
    quote: 'From Chandrayaan to AI — India leads again. ARROS helps students like me write literature reviews in minutes, not days.',
    name: 'Arjun Krishnan',
    role: 'Data Science, IIT Madras',
  },
];

const features = [
  {
    icon: Mic,
    title: 'Voice Input (STT)',
    description: 'Speak in Hindi, English, or any Indian language — ARROS understands.',
    sanskrit: 'श्रवणं',
  },
  {
    icon: Volume2,
    title: 'Voice Output (TTS)',
    description: 'Listen to your research in 10+ Indian languages with natural voices.',
    sanskrit: 'उच्चारणं',
  },
  {
    icon: Eye,
    title: 'Vision Documents',
    description: 'Upload PDFs, images — ARROS extracts text and creates citations.',
    sanskrit: 'दर्शनं',
  },
  {
    icon: BookOpen,
    title: 'Memory & Continuity',
    description: 'Research sessions persist. Continue where you left off.',
    sanskrit: 'स्मृतिः',
  },
];

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-void relative overflow-hidden">
      {/* Atmospheric layers */}
      <div className="noise-overlay" />
      <div className="absolute inset-0 grid-pattern opacity-30" />
      
      {/* Saffron glow - top right */}
      <div className="absolute -top-32 right-10 w-[540px] h-[540px] bg-saffron/10 rounded-full blur-[180px]" />
      {/* Peacock glow - bottom left */}
      <div className="absolute bottom-0 left-0 w-[520px] h-[520px] bg-peacock/10 rounded-full blur-[180px]" />
      {/* Gold glow - center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gold/8 rounded-full blur-[150px]" />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-smoke/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-none bg-gradient-to-br from-saffron via-peacock to-gold flex items-center justify-center relative overflow-hidden cut-card">
              <GraduationCap className="w-5 h-5 text-void relative z-10" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display font-bold text-xl text-chalk tracking-tight">ARROS</span>
              <span className="text-[9px] text-ash uppercase tracking-[0.25em]">Academic Research OS</span>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-silver">
            <a href="#features" className="hover:text-chalk transition-colors flex items-center gap-1">
              <DivyaSparkle className="w-3 h-3 text-gold" />
              Features
            </a>
            <a href="#agents" className="hover:text-chalk transition-colors">Agents</a>
            <a href="#output" className="hover:text-chalk transition-colors">Output</a>
            <a href="#testimonials" className="hover:text-chalk transition-colors">Students</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/signin" className="text-sm text-silver hover:text-chalk transition-colors hidden sm:block">
              Sign in
            </Link>
            <Link to="/signup">
              <Button variant="peacock" size="sm">Start Researching</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-36 pb-24 px-6 relative">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Sanskrit Tagline */}
            <div className="mb-6 flex items-center gap-3">
              <Badge variant="gold" className="font-serif">{sanskritMantras.tagline}</Badge>
              <span className="text-xs text-ash italic">{sanskritMantras.translation}</span>
            </div>
            
            <h1 className="display-xl font-display font-bold text-chalk text-balance">
              Your personal<br />
              <span className="text-saffron">research assistant</span><br />
              <span className="text-peacock">with memory</span>
            </h1>
            <p className="text-lg text-silver mt-6 max-w-xl leading-relaxed">
              ARROS — Academic Research OS — turns any topic into a verified, 
              citation-backed research report. Built in India, for Indian students.
            </p>
            
            {/* Trust indicators */}
            <div className="mt-8 flex flex-wrap gap-3 text-xs text-ash uppercase tracking-[0.2em]">
              <span className="cut-card cut-border bg-slate/60 px-4 py-2 flex items-center gap-2">
                <BadgeCheck className="w-3.5 h-3.5 text-peacock" />
                Verified citations
              </span>
              <span className="cut-card cut-border bg-slate/60 px-4 py-2 flex items-center gap-2">
                <Brain className="w-3.5 h-3.5 text-gold" />
                Session memory
              </span>
              <span className="cut-card cut-border bg-slate/60 px-4 py-2 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-saffron" />
                Semantic Scholar
              </span>
            </div>
            
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Button
                variant="peacock"
                size="lg"
                className="gap-2"
                onClick={() => navigate('/signup')}
              >
                Start free research
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/app')}
              >
                Open workspace
              </Button>
            </div>
          </motion.div>

          {/* Live output preview - Sarvam inspired */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="prism-frame p-6 bg-graphite/80 backdrop-blur-xl">
              <div className="prism-beam" />
              <div className="relative">
                <div className="flex items-center justify-betweenash uppercase tracking-[ text-xs text-0.3em]">
                  <span>Research output</span>
                  <span className="text-peacock flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-peacock animate-pulse" />
                    Live
                  </span>
                </div>

                {/* Example query */}
                <div className="mt-4 cut-card bg-slate/80 px-4 py-3 text-sm text-chalk">
                  <span className="text-ash text-xs mr-2">Query:</span>
                  "Explain Federated Learning in Healthcare with recent research"
                </div>

                {/* Stats row */}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {outputPreview.map((signal) => (
                    <div key={signal.label} className="cut-card cut-border bg-slate/70 p-3 text-center">
                      <span className="text-xl font-display text-chalk block">{signal.value}</span>
                      <span className="text-[9px] text-ash uppercase tracking-[0.15em]">{signal.label}</span>
                    </div>
                  ))}
                </div>

                {/* Output sections */}
                <div className="mt-4 space-y-1">
                  {exampleOutputSections.slice(0, 6).map((section, i) => (
                    <motion.div
                      key={section}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.08 }}
                      className="flex items-center gap-2 text-xs text-silver"
                    >
                      <BadgeCheck className="w-3 h-3 text-peacock flex-shrink-0" />
                      {section}
                    </motion.div>
                  ))}
                  <div className="text-xs text-ash pl-5">+ {exampleOutputSections.length - 6} more sections...</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features - NEW */}
      <section className="py-20 px-6 bg-slate/30" id="features">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 text-center">
            <Badge variant="gold" className="mb-4">भारतीय AI — Built for India</Badge>
            <h2 className="display-lg font-display text-chalk">
              Full-stack research capabilities
            </h2>
            <p className="text-lg text-silver mt-4 max-w-2xl mx-auto">
              From voice input in Hindi to vision-based document scanning — 
              ARROS brings India's AI revolution to academic research.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full cut-card cut-border hover:border-peacock/30 transition-colors group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 cut-card bg-peacock/10 flex items-center justify-center group-hover:bg-peacock/20 transition-colors">
                      <feature.icon className="w-5 h-5 text-peacock" />
                    </div>
                    <span className="text-xs text-gold font-serif tracking-wider">{feature.sanskrit}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-chalk mb-2">{feature.title}</h3>
                  <p className="text-xs text-silver leading-relaxed">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Agent Society */}
      <section className="py-20 px-6 border-y border-smoke/50" id="agents">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 text-center">
            <Badge variant="peacock" className="mb-4">पञ्च एजेण्ट्स — 5-Agent Society</Badge>
            <h2 className="display-lg font-display text-chalk">
              Not a chatbot. An agent OS.
            </h2>
            <p className="text-lg text-silver mt-4 max-w-2xl mx-auto">
              Five specialized agents work in sequence — like a council of scholars. 
              Each has a specific role in building your research.
            </p>
          </div>
          <div className="grid md:grid-cols-5 gap-4">
            {agentSociety.map((agent, index) => (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                viewport={{ once: true }}
              >
                <Card className="h-full cut-card cut-border hover:border-saffron/40 transition-colors">
                  <div className="text-2xl font-display text-ash/50 mb-3">{agent.number}</div>
                  <div className={`w-10 h-10 cut-card bg-${agent.tone}/10 flex items-center justify-center mb-3`}>
                    <agent.icon className={`w-5 h-5 text-${agent.tone}`} />
                  </div>
                  <h3 className="text-sm font-semibold text-chalk mb-2">{agent.name}</h3>
                  <p className="text-xs text-silver leading-relaxed">{agent.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Output Format */}
      <section className="py-24 px-6" id="output">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_1fr] gap-12 items-start">
          <div>
            <Badge variant="saffron" className="mb-4">Academic Output Format</Badge>
            <h2 className="display-lg font-display text-chalk">
              Every report is exam-ready.
            </h2>
            <p className="text-lg text-silver mt-5 max-w-xl">
              ARROS generates structured academic reports — like ancient sutras, 
              every concept is organized, cited, and verified.
            </p>
            <div className="mt-8 grid gap-3">
              {[
                { label: 'Semantic Scholar integration', detail: 'Real papers with DOI, authors, year, citation count.' },
                { label: 'Session memory', detail: 'Say "continue my Federated Learning research" — it continues.' },
                { label: 'Confidence scoring', detail: 'Every report shows confidence %, verified sources, contradiction count.' },
              ].map((item) => (
                <div key={item.label} className="cut-card cut-border bg-slate/60 p-4">
                  <div className="flex items-center gap-2 text-sm text-chalk font-medium">
                    <BadgeCheck className="w-4 h-4 text-peacock flex-shrink-0" />
                    {item.label}
                  </div>
                  <p className="text-xs text-silver mt-1.5 pl-6">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="cut-card cut-border bg-graphite/70 p-5">
              <div className="flex items-center justify-between text-xs text-ash uppercase tracking-[0.2em] mb-4">
                <span>Report structure</span>
                <span className="text-chalk tracking-normal">10 sections</span>
              </div>
              <div className="space-y-2">
                {exampleOutputSections.map((section, i) => (
                  <div key={section} className="flex items-center gap-3 text-sm">
                    <span className="w-5 h-5 cut-card bg-saffron/20 flex items-center justify-center text-[9px] text-saffron font-bold flex-shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className={i < 7 ? 'text-chalk' : 'text-silver'}>{section}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 cut-card cut-border bg-slate/60 p-5">
              <div className="flex items-center gap-3 text-sm text-chalk">
                <Cpu className="w-4 h-4 text-peacock" />
                Average report: 90–180 seconds
              </div>
              <p className="text-xs text-ash mt-2 pl-7">Depending on topic complexity</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 bg-slate/30" id="testimonials">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <Badge variant="saffron">Student signals</Badge>
              <h2 className="display-md font-display text-chalk mt-3">भारत के विद्यार्थी — For Indian students</h2>
            </div>
            <div className="hidden md:flex items-center gap-2 text-ash text-xs uppercase tracking-[0.2em]">
              <Star className="w-4 h-4 text-gold" />
              Made in India
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {testimonials.map((item) => (
              <Card key={item.name} className="cut-card cut-border">
                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-3.5 h-3.5 text-gold fill-gold" />)}
                </div>
                <p className="text-silver text-base leading-relaxed">"{item.quote}"</p>
                <div className="mt-4 text-xs text-ash uppercase tracking-[0.2em]">
                  {item.name}
                  <span className="block text-silver tracking-normal mt-1">{item.role}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 saffron-glow" />
        <div className="max-w-5xl mx-auto relative">
          <Card variant="elevated" className="p-12 cut-card cut-border">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div>
                <h2 className="display-md font-display text-chalk">Start your first research.</h2>
                <p className="text-lg text-silver mt-4 max-w-xl">
                  Join thousands of Indian students using ARROS for 
                  literature reviews, exam prep, and research projects.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-ash">
                  <span className="cut-card bg-slate/60 px-3 py-1.5">No credit card</span>
                  <span className="cut-card bg-slate/60 px-3 py-1.5">Free tier</span>
                  <span className="cut-card bg-slate/60 px-3 py-1.5">10+ Indian languages</span>
                </div>
              </div>
              <div className="flex flex-col gap-3 flex-shrink-0">
                <Button variant="peacock" size="lg" className="gap-2" onClick={() => navigate('/signup')}>
                  Create free account
                  <ArrowRight className="w-5 h-5" />
                </Button>
                <Button variant="secondary" size="lg" onClick={() => navigate('/app')}>
                  Open workspace →
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-smoke/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 cut-card bg-gradient-to-br from-saffron via-peacock to-gold flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-void" />
            </div>
            <div>
              <span className="font-display font-bold text-chalk">ARROS</span>
              <span className="text-[9px] text-ash ml-2 uppercase tracking-widest">Academic Research OS</span>
            </div>
          </div>
          <div className="text-sm text-ash text-center">
            © 2026 ARROS — Built in India | <span className="font-serif text-gold">विद्यया अमृतमश्नुते</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
