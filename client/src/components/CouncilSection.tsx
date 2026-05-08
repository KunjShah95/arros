import { motion } from 'framer-motion';
import { Search, FileText, Scale, BookOpen, Download } from 'lucide-react';

const STEPS = [
  { 
    name: 'Enter Topic', 
    role: 'Type your research question or paste abstract',
    icon: Search,
    detail: 'Semantic Scholar + arXiv'
  },
  { 
    name: 'Search Papers', 
    role: 'Multi-source search with auto-screening',
    icon: FileText,
    detail: 'TL;DR extraction'
  },
  { 
    name: 'Verify Claims', 
    role: 'Evidence grading + contradiction detection',
    icon: Scale,
    detail: 'Epistemic labels'
  },
  { 
    name: 'Draft Paper', 
    role: 'IEEE outline with claim→evidence map',
    icon: BookOpen,
    detail: 'Section templates'
  },
  { 
    name: 'Export', 
    role: 'BibTeX, LaTeX, Markdown, PRISMA',
    icon: Download,
    detail: 'One-click export'
  },
];

export function CouncilSection() {
  return (
    <section id="how-it-works" className="py-24 lg:py-32 px-6 lg:px-12 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-4xl lg:text-5xl font-medium text-[#1A1A2E] mb-4"
        >
          5 Steps to Your Paper
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-[#6B7B6B] text-lg mb-12 max-w-2xl"
        >
          From research question to IEEE-ready paper in minutes. Each step automates what used to take hours.
        </motion.p>

        {/* Horizontal steps */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-12">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative"
            >
              <div className="p-6 bg-[#FAFAF5] border border-[#E5E5E0] text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-[#2D4A6F]/10 rounded-full flex items-center justify-center">
                  <step.icon className="w-6 h-6 text-[#2D4A6F]" />
                </div>
                <h3 className="font-body font-semibold text-[#1A1A2E] mb-1">{step.name}</h3>
                <p className="text-xs text-[#6B7B6B] mb-2">{step.role}</p>
                <p className="text-[10px] text-[#2D4A6F] font-medium">{step.detail}</p>
              </div>
              {/* Connector arrow */}
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-[#E5E5E0]">
                  <svg className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-[#E5E5E0]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Pricing callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="grid md:grid-cols-2 gap-6"
        >
          <div className="p-6 bg-[#2D4A6F]/5 border border-[#2D4A6F]/20">
            <h4 className="font-semibold text-[#1A1A2E] mb-2">For Students</h4>
            <p className="text-sm text-[#6B7B6B] mb-4">Free access to core features. Perfect for thesis and coursework.</p>
            <span className="text-2xl font-bold text-[#2D4A6F]">Free</span>
            <p className="text-xs text-[#6B7B6B] mt-1">20 research sessions/month</p>
          </div>
          <div className="p-6 bg-[#1A1A2E] border border-[#1A1A2E]">
            <h4 className="font-semibold text-white mb-2">For Research Labs</h4>
            <p className="text-sm text-gray-400 mb-4">Unlimited access, team collaboration, API, priority support.</p>
            <span className="text-2xl font-bold text-white">Pro</span>
            <p className="text-xs text-gray-400 mt-1">Contact for pricing</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
