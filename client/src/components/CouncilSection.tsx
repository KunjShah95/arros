import { motion } from 'framer-motion';
import { Compass, BookOpen, Scale, Globe, Layers } from 'lucide-react';

const AGENTS = [
  { name: 'The Planner', role: 'Research trajectory architect', icon: Compass },
  { name: 'The Scholar', role: 'Deep academic research', icon: BookOpen },
  { name: 'The Critic', role: 'Verification & bias detection', icon: Scale },
  { name: 'Web Sage', role: 'Global information traversal', icon: Globe },
  { name: 'The Weaver', role: 'Synthesis & conclusion', icon: Layers },
];

export function CouncilSection() {
  return (
    <section id="architecture" className="py-24 lg:py-32 px-6 lg:px-12 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <span className="text-xs font-mono text-[#C45A3B]">01 — Architecture</span>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16">
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display text-4xl lg:text-5xl font-medium text-[#1A1A1A] mb-6"
            >
              The 5-Agent Council
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-[#6B7B6B] text-lg leading-relaxed"
            >
              Unlike LLMs that generate and hope, ARROS deploys five specialized agents 
              that research, verify, and synthesize through a rigorous academic lens. 
              Each agent holds a specific role. Together, they reach conclusions 
              no single model can.
            </motion.p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {AGENTS.map((agent, i) => (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="p-6 bg-[#FAFAF5] border border-[#E5E5E0] hover:border-[#1A1A1A] transition-colors"
              >
                <agent.icon className="w-4 h-4 text-[#C45A3B] mb-3" />
                <h3 className="font-body font-semibold text-[#1A1A1A] mb-1">{agent.name}</h3>
                <p className="text-sm text-[#6B7B6B]">{agent.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}