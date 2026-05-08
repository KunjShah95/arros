import { motion } from 'framer-motion';
import { BookOpen, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { IEEEPreview } from './IEEEPreview';

export function HeroSection() {
  return (
    <section className="pt-32 pb-20 lg:py-28 px-6 lg:px-12 min-h-[85vh] flex items-center bg-[#FAFAF5]">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2D4A6F]/10 text-[#2D4A6F] text-sm mb-6"
            >
              <BookOpen className="w-4 h-4" />
              For CS/Engineering Researchers
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-4xl lg:text-5xl font-medium text-[#1A1A2E] mb-4 leading-tight"
            >
              Write IEEE papers without the chaos.
              <span className="text-[#2D4A6F]"> Every claim backed.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-[#6B7B6B] mb-8 leading-relaxed"
            >
              ARROS reads papers, extracts findings, formats IEEE citations, and generates your paper outline — automatically. Graduate students save 2+ hours per session.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 mb-8"
            >
              <a
                href="/signup"
                className="inline-flex items-center justify-center gap-2 bg-[#2D4A6F] text-white px-8 py-3 text-sm hover:bg-[#1A1A2E] transition-colors rounded"
              >
                Start Free
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center text-[#6B7B6B] px-8 py-3 text-sm hover:text-[#1A1A2E] transition-colors"
              >
                See How It Works
              </a>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap items-center gap-6 text-sm text-[#6B7B6B]"
            >
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />
                Free for students
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#F57C00]" />
                2+ hours saved/session
              </span>
              <span className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#2D4A6F]" />
                IEEE citations
              </span>
            </motion.div>
          </div>

          {/* Right: IEEE Paper Preview Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="hidden lg:block"
          >
            <IEEEPreview />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
