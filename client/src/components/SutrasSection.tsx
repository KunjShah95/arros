import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

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

export function SutrasSection() {
  return (
    <section className="py-24 lg:py-32 px-6 lg:px-12 bg-[#FAFAF5]">
      <div className="max-w-7xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-5xl lg:text-7xl font-medium text-[#1A1A1A] mb-4"
        >
          Built on 100 Million Sources
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-5xl lg:text-8xl font-display text-[#C45A3B] mb-8"
        >
          And growing: <Counter end={100000000} />+
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-[#6B7B6B] text-lg max-w-xl"
        >
          We ingest from academic papers, books, podcasts, and your personal notes. 
          Every source normalized, every citation tracked. The Council evaluates 
          each one for quality before adding to your knowledge base.
        </motion.p>
      </div>
    </section>
  );
}