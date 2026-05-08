import { motion } from 'framer-motion';
import { BookOpen, FileText, Scale, Clock, Link2, CheckCircle2 } from 'lucide-react';

const FEATURES = [
  { 
    icon: BookOpen, 
    title: 'Paper Discovery', 
    description: 'Enter a topic, get 100+ relevant papers auto-screened with TL;DR extraction. Stop searching manually.' 
  },
  { 
    icon: FileText, 
    title: 'IEEE Citation Generator', 
    description: 'One-click IEEE/APA/MLA/BibTeX formatting. No more formatting headaches or missed citations.' 
  },
  { 
    icon: Scale, 
    title: 'Evidence Verification', 
    description: 'Every claim traces to its source. Epistemic labels show if evidence is supported, inconsistent, or suggestive.' 
  },
  { 
    icon: CheckCircle2, 
    title: 'PRISMA Tracker', 
    description: 'Systematic review documentation made simple. Auto-generate your flow diagram and audit trail.' 
  },
  { 
    icon: Clock, 
    title: 'Time Saved', 
    description: 'Graduate students save 2+ hours per session. Focus on writing, not searching and formatting.' 
  },
  { 
    icon: Link2, 
    title: 'Zotero Integration', 
    description: 'Sync with your existing library. Import citations and export to Overleaf in one click.' 
  },
];

export function CapabilitiesSection() {
  return (
    <section id="features" className="py-24 lg:py-32 px-6 lg:px-12 bg-[#F5F5F0]">
      <div className="max-w-7xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-4xl lg:text-5xl font-medium text-[#1A1A2E] mb-4"
        >
          Academic Research, Simplified
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-[#6B7B6B] text-lg mb-12 max-w-2xl"
        >
          Everything you need to write peer-reviewed papers faster. From paper discovery to citation formatting, ARROS handles the tedious work.
        </motion.p>

        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="p-8 bg-white border border-[#E5E5E0] hover:border-[#2D4A6F]/30 hover:shadow-lg transition-all"
            >
              <feature.icon className="w-6 h-6 text-[#2D4A6F] mb-4" />
              <h3 className="font-body font-semibold text-[#1A1A2E] text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-[#6B7B6B] leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
