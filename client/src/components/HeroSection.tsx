import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

function AnimatedCounter({ end, duration = 2 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const increment = end / (duration * 60);
    const timer = setInterval(() => {
      setCount(prev => {
        const next = prev + increment;
        if (next >= end) {
          clearInterval(timer);
          return end;
        }
        return Math.floor(next);
      });
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [inView, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
}

export function HeroSection() {
  return (
    <section className="pt-40 pb-24 lg:py-32 px-6 lg:px-12 min-h-[90vh] flex items-center bg-[#FAFAF5]">
      <div className="max-w-7xl mx-auto w-full">
        <div className="max-w-3xl mx-auto text-center">
          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6"
          >
            <span className="text-xs uppercase tracking-[0.15em] text-[#6B7B6B] font-body">
              Permanent Research Memory for Curious Minds
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-5xl lg:text-6xl font-medium text-[#1A1A1A] mb-8 leading-tight"
          >
            Building Your Digital{' '}
            <span className="text-[#C45A3B]">Atman.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-[#6B7B6B] max-w-xl mx-auto mb-10 leading-relaxed"
          >
            ARROS is an autonomous research OS. It remembers, reasons, and synthesizes 
            across your lifetime of learning — so you don't have to.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-16"
          >
            <a
              href="/app"
              className="inline-block bg-[#C45A3B] text-white px-8 py-3 text-sm hover:bg-[#B36B4D] transition-colors"
            >
              Get Started
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-3 gap-8 border-t border-[#E5E5E0] pt-8"
          >
            <div>
              <span className="block text-2xl font-display font-medium text-[#C45A3B]">
                <AnimatedCounter end={100000000} />+
              </span>
              <span className="text-xs text-[#6B7B6B] uppercase tracking-wider">Sutras</span>
            </div>
            <div>
              <span className="block text-2xl font-display font-medium text-[#1A1A1A]">5 Agents</span>
              <span className="text-xs text-[#6B7B6B] uppercase tracking-wider">in Council</span>
            </div>
            <div>
              <span className="block text-2xl font-display font-medium text-[#1A1A1A]">∞</span>
              <span className="text-xs text-[#6B7B6B] uppercase tracking-wider">Knowledge</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}