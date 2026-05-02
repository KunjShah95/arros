import { motion } from 'framer-motion';

const SOURCES = [
  'Rigveda', 'ArXiv', 'PubMed', 'JSTOR', 'GitHub', 'Nature', 
  'IEEE', 'Personal Notes', 'X/Twitter Threads', 'Podcast Transcripts',
  'Court Records', 'Sanskrit Commentaries', 'Patent Databases', 'Historical Archives'
];

export function SourceTicker() {
  return (
    <div className="overflow-hidden py-4">
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
          <span key={i} className="mx-6 text-sm font-mono text-white/40">
            {source}
          </span>
        ))}
      </motion.div>
    </div>
  );
}