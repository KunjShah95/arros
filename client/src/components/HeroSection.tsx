import { motion } from 'framer-motion';

export function HeroSection() {
  return (
    <section className="pt-40 pb-24 lg:py-32 px-6 lg:px-12 min-h-[90vh] flex items-center bg-[#FAFAF5]">
      <div className="max-w-7xl mx-auto w-full">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-5xl lg:text-6xl font-medium text-[#1A1A1A] mb-6 leading-tight"
          >
            Your second brain,{' '}
            <span className="text-[#C45A3B]">remembering what you forget.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-[#6B7B6B] max-w-xl mx-auto mb-10 leading-relaxed"
          >
            ARROS reads what you read, connects what you save, and keeps your thinking 
            coherent over years — not a dump for links you'll never open again.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <a
              href="/signup"
              className="inline-block bg-[#C45A3B] text-white px-8 py-3 text-sm hover:bg-[#B36B4D] transition-colors"
            >
              Start Free
            </a>
            <a
              href="#how-it-works"
              className="inline-block text-[#6B7B6B] px-8 py-3 text-sm hover:text-[#1A1A1A] transition-colors"
            >
              See How It Works
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-sm text-[#6B7B6B]"
          >
            <p>Trusted by researchers at universities and labs worldwide</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}