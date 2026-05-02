import { motion } from 'framer-motion';
import { Mic, FileText, Image } from 'lucide-react';

const FEATURES = [
  { icon: Mic, title: 'Voice', description: 'Voice memos → transcription + graph embedding' },
  { icon: FileText, title: 'Documents', description: 'PDF/Epub → OCR + citation extraction' },
  { icon: Image, title: 'Vision', description: 'Images → object detection + chart reading' },
];

export function CapabilitiesSection() {
  return (
    <section id="capabilities" className="py-24 lg:py-32 px-6 lg:px-12 bg-[#F5F5F0]">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <span className="text-xs font-mono text-[#C45A3B]">02 — Capabilities</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-4xl lg:text-5xl font-medium text-[#1A1A1A] mb-4"
        >
          Beyond Text.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-[#6B7B6B] text-lg mb-12"
        >
          Voice. Documents. Vision. Your research, unified.
        </motion.p>

        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 bg-white border border-[#E5E5E0]"
            >
              <feature.icon className="w-8 h-8 text-[#6B7B6B] mb-4" />
              <h3 className="font-body font-semibold text-[#1A1A1A] text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-[#6B7B6B]">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}