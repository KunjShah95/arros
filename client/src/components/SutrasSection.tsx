import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

const SOURCES = [
  'Rigveda', 'ArXiv', 'PubMed', 'JSTOR', 'GitHub', 'Nature', 
  'IEEE', 'Personal Notes', 'Twitter Threads', 'Podcast Transcripts'
];

function Counter({ end, duration = 2 }: { end: number; duration?: number }) {
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

function SourceTicker() {
  return (
    <div className="overflow-hidden py-4 border-y border-[#E5E5E0]">
      <motion.div
        className="flex whitespace-nowrap"
        animate={{ x: [0, -50 * SOURCES.length] }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear'
        }}
      >
        {[...SOURCES, ...SOURCES].map((source, i) => (
          <span key={i} className="mx-6 text-xs font-mono text-[#6B7B6B]">
            {source}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

export function SutrasSection() {
  return (
    <section id="sutras" className="py-24 lg:py-32 px-6 lg:px-12 bg-[#FAFAF5]">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <span className="text-xs font-mono text-[#C45A3B]">04 — Corpus</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-5xl lg:text-7xl font-medium text-[#1A1A1A] mb-8"
        >
          100 Million Sutras.
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-5xl lg:text-8xl font-display text-[#C45A3B] mb-8"
        >
          0 → <Counter end={100000000} />+
        </motion.div>

        <SourceTicker />
      </div>
    </section>
  );
}