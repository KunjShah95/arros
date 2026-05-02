import { motion } from 'framer-motion';
import { Brain, Target, Heart } from 'lucide-react';

const VALUES = [
  { icon: Brain, title: 'Rigorous Reasoning', description: 'We do not hallucinate. Every claim is sourced, every inference traced.' },
  { icon: Target, title: 'Your Priorities', description: 'This is your knowledge, not ours. You decide what matters.' },
  { icon: Heart, title: 'Built for Thinking', description: 'Designed for those who read, question, and seek understanding.' },
];

export function TrustSection() {
  return (
    <section id="about" className="py-24 lg:py-32 px-6 lg:px-12 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-4xl lg:text-5xl font-medium text-[#1A1A1A] mb-4"
        >
          About ARROS
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-[#6B7B6B] text-lg mb-12 max-w-2xl"
        >
          Born from the frustration of forgotten reading and lost insights. 
          ARROS exists for researchers, students, and curious minds who want 
          their knowledge to actually accumulate.
        </motion.p>

        <div className="grid md:grid-cols-3 gap-6">
          {VALUES.map((value, i) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 bg-[#FAFAF5] border border-[#E5E5E0]"
            >
              <value.icon className="w-5 h-5 text-[#C45A3B] mb-4" />
              <h3 className="font-body font-semibold text-[#1A1A1A] text-lg mb-2">{value.title}</h3>
              <p className="text-sm text-[#6B7B6B] leading-relaxed">{value.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}