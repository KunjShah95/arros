import { motion } from 'framer-motion';
import { Mic, FileText, Image, Brain, Database, Link2 } from 'lucide-react';

const FEATURES = [
  { icon: Mic, title: 'Voice Input', description: 'Drop voice memos. We transcribe, timestamp, and embed them into your knowledge graph.' },
  { icon: FileText, title: 'Document Processing', description: 'Upload PDFs or epubs. OCR and citation extraction happen in seconds.' },
  { icon: Image, title: 'Vision Analysis', description: 'Paste images. We detect objects, extract text, read charts.' },
  { icon: Brain, title: 'Persistent Memory', description: 'Your research lives in one place. Connected, searchable, forever.' },
  { icon: Database, title: 'Source Tracking', description: 'Every claim traces to its origin. No more forgotten citations.' },
  { icon: Link2, title: 'Knowledge Graph', description: 'See how your ideas connect. Visualize your thinking.' },
];

export function CapabilitiesSection() {
  return (
    <section id="features" className="py-24 lg:py-32 px-6 lg:px-12 bg-[#F5F5F0]">
      <div className="max-w-7xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-4xl lg:text-5xl font-medium text-[#1A1A1A] mb-4"
        >
          What You Get
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-[#6B7B6B] text-lg mb-12 max-w-2xl"
        >
          A second brain that actually works. Not a inbox for forgotten links, but a living 
          knowledge system that grows with you.
        </motion.p>

        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="p-8 bg-white border border-[#E5E5E0]"
            >
              <feature.icon className="w-6 h-6 text-[#C45A3B] mb-4" />
              <h3 className="font-body font-semibold text-[#1A1A1A] text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-[#6B7B6B] leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}