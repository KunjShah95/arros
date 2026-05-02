import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PROMPTS = [
  '> arros --initialize --user=guest',
  '> Establishing neural link...',
  '> Council assembled. Awaiting your first inquiry.',
  '> _'
];

const AUTOCOMPLETE = [
  'Analyze the intersection of Advaita Vedanta and quantum mechanics',
  'Summarize latest papers on neuromorphic computing',
  'Compare Buddhist dependent origination with systems theory',
];

export function TerminalFooter() {
  const [lines, setLines] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [currentLine, setCurrentLine] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      if (currentLine < PROMPTS.length) {
        setLines(prev => [...prev, PROMPTS[currentLine]]);
        setCurrentLine(prev => prev + 1);
      }
    }, 800);
    return () => clearInterval(timer);
  }, [currentLine]);

  return (
    <div className="bg-[#121214] border border-white/10 p-6 rounded-lg font-mono text-sm">
      <div className="space-y-1 mb-4">
        {lines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={line.startsWith('>') ? 'text-white/60' : 'text-[#00e5c9]'}
          >
            {line}
          </motion.div>
        ))}
      </div>
      
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowAutocomplete(e.target.value.length > 0);
          }}
          placeholder="Enter your research query..."
          className="w-full bg-transparent border-none outline-none text-white placeholder-white/40"
        />
        
        <AnimatePresence>
          {showAutocomplete && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full left-0 right-0 bg-[#1a1a1a] border border-white/10 rounded mt-2 overflow-hidden"
            >
              {AUTOCOMPLETE.map((item, i) => (
                <div
                  key={i}
                  className="px-4 py-2 hover:bg-white/5 cursor-pointer text-white/60"
                >
                  {item}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}