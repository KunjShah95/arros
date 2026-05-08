import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Search, Filter, Download, Settings, ArrowLeft } from 'lucide-react';
import { Card, Button, Badge, Input } from '../components/ui';

const gradeColors: Record<string, string> = {
  supported: 'text-[#2E7D32] bg-[#2E7D32]/10',
  inconsistent: 'text-[#C62828] bg-[#C62828]/10',
  suggestive: 'text-[#F57C00] bg-[#F57C00]/10',
  speculative: 'text-[#6B7B6B] bg-[#6B7B6B]/10',
  unknown: 'text-[#6B7B6B] bg-[#6B7B6B]/10',
};

const mockPapers = [
  { id: '1', title: 'Attention Is All You Need', authors: 'Vaswani et al.', year: 2017, method: 'Transformer', domain: 'NLP', grade: 'supported' },
  { id: '2', title: 'BERT: Pre-training of Deep Bidirectional Transformers', authors: 'Devlin et al.', year: 2019, method: 'Transformer', domain: 'NLP', grade: 'supported' },
  { id: '3', title: 'GPT-3: Language Models are Few-Shot Learners', authors: 'Brown et al.', year: 2020, method: 'LLM', domain: 'NLP', grade: 'supported' },
  { id: '4', title: 'An Image is Worth 16x16 Words: Transformers for Image Recognition', authors: 'Dosovitskiy et al.', year: 2021, method: 'Vision Transformer', domain: 'Computer Vision', grade: 'supported' },
  { id: '5', title: 'Chain-of-Thought Prompting Elicits Reasoning in Language Models', authors: 'Wei et al.', year: 2022, method: 'Reasoning', domain: 'NLP', grade: 'suggestive' },
  { id: '6', title: 'Constitutional AI: Harmlessness from AI Feedback', authors: 'Anthropic', year: 2022, method: 'RLHF', domain: 'AI Safety', grade: 'suggestive' },
];

export function CorpusLibraryPage() {
  const [corpusName, setCorpusName] = useState('NLP Papers');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filteredPapers = mockPapers.filter(paper => {
    const matchesSearch = paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         paper.authors.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || paper.grade === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: mockPapers.length,
    supported: mockPapers.filter(p => p.grade === 'supported').length,
    inconsistent: mockPapers.filter(p => p.grade === 'inconsistent').length,
  };

  return (
    <div className="h-full overflow-y-auto p-6 bg-[#FAFAF5]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-[#1A1A2E]">{corpusName}</h1>
              <p className="text-sm text-[#6B7B6B]">{mockPapers.length} papers • Last updated 2h ago</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" /> Export BibTeX
            </Button>
            <Button variant="default" size="sm">
              <Plus className="w-4 h-4 mr-2" /> Add Papers
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4 bg-white border border-[#E5E5E0] text-center">
            <p className="text-2xl font-bold text-[#1A1A2E]">{stats.total}</p>
            <p className="text-xs text-[#6B7B6B] uppercase">Total Papers</p>
          </Card>
          <Card className="p-4 bg-white border border-[#E5E5E0] text-center">
            <p className="text-2xl font-bold text-[#2E7D32]">{stats.supported}</p>
            <p className="text-xs text-[#6B7B6B] uppercase">Supported</p>
          </Card>
          <Card className="p-4 bg-white border border-[#E5E5E0] text-center">
            <p className="text-2xl font-bold text-[#C62828]">{stats.inconsistent}</p>
            <p className="text-xs text-[#6B7B6B] uppercase">Inconsistent</p>
          </Card>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7B6B]" />
            <Input
              type="text"
              placeholder="Search papers by title or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'supported', 'suggestive', 'inconsistent'].map((filter) => (
              <Button
                key={filter}
                variant={selectedFilter === filter ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFilter(filter)}
                className="capitalize"
              >
                {filter === 'all' ? 'All' : filter}
              </Button>
            ))}
          </div>
        </div>

        {/* Papers Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPapers.map((paper, i) => (
            <motion.div
              key={paper.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="p-5 bg-white border border-[#E5E5E0] hover:border-[#2D4A6F]/30 transition-all cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <BookOpen className="w-5 h-5 text-[#2D4A6F]" />
                  <Badge className={`text-[9px] ${gradeColors[paper.grade]}`}>
                    {paper.grade}
                  </Badge>
                </div>
                <h3 className="text-sm font-medium text-[#1A1A2E] mb-1 line-clamp-2">{paper.title}</h3>
                <p className="text-xs text-[#6B7B6B] mb-2">{paper.authors} ({paper.year})</p>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[9px]">{paper.method}</Badge>
                  <Badge variant="outline" className="text-[9px]">{paper.domain}</Badge>
                </div>
                <div className="mt-3 pt-3 border-t border-[#E5E5E0] flex justify-between">
                  <Button variant="ghost" size="sm" className="text-[10px] h-7">
                    Cite
                  </Button>
                  <Button variant="ghost" size="sm" className="text-[10px] h-7">
                    <Settings className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredPapers.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-[#6B7B6B]/30 mx-auto mb-4" />
            <p className="text-[#6B7B6B]">No papers match your search</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CorpusLibraryPage;
