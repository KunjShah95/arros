import { motion } from 'framer-motion';

export function IEEEPreview() {
  return (
    <div className="bg-white border border-[#E5E5E0] rounded-lg shadow-xl p-6 font-mono text-xs">
      {/* Paper header */}
      <div className="text-center mb-4 pb-4 border-b border-[#E5E5E0]">
        <h2 className="text-sm font-bold text-[#1A1A2E] mb-2">
          Neural Networks in Healthcare Diagnosis: A Systematic Review
        </h2>
        <p className="text-[10px] text-[#6B7B6B]">
          Author Name, Member, IEEE, and Co-Author, Member, IEEE
        </p>
      </div>

      {/* Abstract */}
      <div className="mb-4">
        <p className="font-bold text-[10px] text-[#1A1A2E]">Abstract</p>
        <p className="text-[10px] text-[#6B7B6B] leading-relaxed mt-1">
          This paper presents a systematic review of neural network applications in healthcare diagnosis. We analyze 127 papers from Semantic Scholar and arXiv, focusing on diagnostic accuracy, model architectures, and clinical validation. Our findings indicate that convolutional neural networks achieve 94.2% average accuracy across 15 diagnostic tasks.
        </p>
      </div>

      {/* Sections checklist */}
      <div className="space-y-1.5 text-[10px]">
        {['Introduction', 'Related Work', 'Methodology', 'Results', 'Discussion', 'Conclusion', 'References'].map((section, i) => (
          <motion.div
            key={section}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.05 }}
            className="flex items-center gap-2 text-[#6B7B6B]"
          >
            <span className="w-4 h-4 rounded border border-[#2E7D32] bg-[#2E7D32]/10 flex items-center justify-center">
              <svg className="w-3 h-3 text-[#2E7D32]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <span className="text-[#1A1A2E]">{section}</span>
          </motion.div>
        ))}
      </div>

      {/* Citation sample */}
      <div className="mt-4 pt-4 border-t border-[#E5E5E0]">
        <p className="text-[10px] text-[#6B7B6B]">
          [1] A. Esteva et al., "Dermatologist-level classification of skin cancer," <span className="italic">Nature</span>, vol. 542, no. 2, pp. 115–118, 2017.
        </p>
      </div>

      {/* Badge */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-[9px] text-[#6B7B6B]">47 citations generated</span>
        <span className="px-2 py-0.5 bg-[#2E7D32]/10 text-[#2E7D32] rounded text-[9px]">IEEE ✓</span>
      </div>
    </div>
  );
}
