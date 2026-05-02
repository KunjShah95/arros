import { motion } from 'framer-motion';
import { Link2, FileSearch, Shield } from 'lucide-react';

const FEATURES = [
  { icon: Link2, title: 'Cite Sources', description: 'Every claim links to its origin document' },
  { icon: FileSearch, title: 'Reasoning Trail', description: 'Expandable agent reasoning for complex syntheses' },
  { icon: Shield, title: 'Bias Audit', description: "The Critic's dissent is always visible, never hidden" },
];

export function TrustSection() {
  return (
    <section id="dharma" className="py-24 lg:py-32 px-6 lg:px-12 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <span className="text-xs font-mono text-[#C45A3B]">05 — Dharma</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-4xl lg:text-5xl font-medium text-[#1A1A1A] mb-12"
        >
          We Show Our Work.
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 border border-[#E5E5E0]"
            >
              <feature.icon className="w-5 h-5 text-[#C45A3B] mb-4" />
              <h3 className="font-body font-semibold text-[#1A1A1A] text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-[#6B7B6B]">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}