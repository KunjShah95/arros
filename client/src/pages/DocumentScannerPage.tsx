import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Scan,
  Download,
  Copy,
  Image,
  FileType,
  CheckCircle,
  AlertCircle,
  Eye,
  Trash2,
  Sparkles,
  ArrowRight,
  Maximize2,
  Lock
} from 'lucide-react';
import { Button, Card, Badge, cn } from '../components/ui';

interface ExtractedText {
  text: string;
  confidence: number;
  language: string;
}

interface DocumentData {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
  extractedText?: ExtractedText;
  status: 'processing' | 'completed' | 'error';
  error?: string;
}

export function DocumentScanner() {
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocumentData | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
  };

  const processFiles = async (files: File[]) => {
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      return validTypes.includes(file.type);
    });

    const newDocs: DocumentData[] = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploadedAt: new Date(),
      status: 'processing' as const,
    }));

    setDocuments(prev => [...prev, ...newDocs]);

    for (const doc of newDocs) {
      await processDocument(doc.id);
    }
  };

  const processDocument = async (docId: string) => {
    await new Promise(resolve => setTimeout(resolve, 2500));

    const mockExtractedText: ExtractedText = {
      text: `ABSTRACT: Vedic Robotics & Sacred Geometry

The integration of ancient Indian mathematical theorems, specifically those found in the Shulba Sutras, into modern computational geometry offers a novel approach to robotic path planning.

1. Bija-Mantras as state-space representations
2. Mandala-based swarm coordination
3. Dharmic constraint systems for AI alignment

Preliminary results show a 15% increase in efficiency when using non-Euclidean spatial representations derived from traditional architectural mandalas.`,
      confidence: 0.98,
      language: 'en',
    };

    setDocuments(prev => prev.map(doc =>
      doc.id === docId
        ? { ...doc, extractedText: mockExtractedText, status: 'completed' }
        : doc
    ));

    // Auto-select first completed doc if none selected
    setDocuments(currentDocs => {
      const doc = currentDocs.find(d => d.id === docId);
      if (doc) setSelectedDoc(doc);
      return currentDocs;
    });
  };

  const deleteDocument = (docId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== docId));
    if (selectedDoc?.id === docId) {
      setSelectedDoc(null);
    }
  };

  const copyExtractedText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadExtractedText = (text: string, fileName: string) => {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', `${fileName}_extracted.txt`);
    element.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar scroll-smooth p-6 pb-20" style={{ backgroundColor: '#FAFAFA' }}>
      <div className="max-w-6xl mx-auto py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="p-8" variant="elevated">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1A1A1A', color: '#FAFAFA' }}>
                    <Scan className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-semibold" style={{ color: '#1A1A1A' }}>Document Scanner</h1>
                    <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: '#666' }}>High-Fidelity Vision</p>
                  </div>
                </div>
                <p className="text-sm" style={{ color: '#666', maxWidth: '400px' }}>
                  Transform documents into digital text. ARROS uses AI to decode and extract wisdom.
                </p>
              </div>

              <div className="flex gap-4">
                <div className="text-center px-6 py-4 rounded-lg" style={{ backgroundColor: '#F5F5F5', border: '1px solid #E0E0E0' }}>
                  <p className="text-[9px] uppercase font-bold tracking-widest mb-1" style={{ color: '#666' }}>Accuracy</p>
                  <p className="text-2xl font-semibold" style={{ color: '#1A1A1A' }}>99.2%</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_400px] gap-8">
          {/* Left Column: Upload & List */}
          <div className="space-y-8">
            {/* Dropzone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative group cursor-pointer transition-all duration-500",
                "border-2 border-dashed rounded-2xl p-12 text-center",
                isDragging
                  ? "border-gray-400 bg-gray-50"
                  : "border-gray-300 bg-white hover:border-gray-400"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="flex flex-col items-center gap-6">
                <Scan className="w-8 h-8 group-hover:scale-110 transition-transform" style={{ color: '#666' }} />
                <div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: '#1A1A1A' }}>Upload Documents</h3>
                  <p className="text-xs uppercase tracking-widest" style={{ color: '#666' }}>Supports PDF, PNG, JPG</p>
                </div>
              </div>
            </div>

            {/* List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] uppercase font-bold tracking-[0.3em]" style={{ color: '#666' }}>Documents</h3>
                <Badge variant="neutral">{documents.length} Items</Badge>
              </div>

              <AnimatePresence mode="popLayout">
                {documents.map((doc, idx) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <div
                      className={cn(
                        "group p-4 rounded-lg border transition-all cursor-pointer flex items-center gap-4",
                        selectedDoc?.id === doc.id
                          ? "border-gray-400 bg-gray-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                      onClick={() => setSelectedDoc(doc)}
                    >
                      <div className="w-12 h-12 rounded-lg border flex items-center justify-center shrink-0" style={{ backgroundColor: '#F5F5F5', borderColor: '#E0E0E0' }}>
                        {doc.fileType.includes('pdf') ? (
                          <FileType className="w-5 h-5" style={{ color: '#666' }} />
                        ) : (
                          <Image className="w-5 h-5" style={{ color: '#666' }} />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate group-hover:text-gray-700 transition-colors" style={{ color: '#1A1A1A' }}>
                          {doc.fileName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] uppercase tracking-widest" style={{ color: '#666' }}>{formatFileSize(doc.fileSize)}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-300" />
                          <span className="text-[10px] uppercase tracking-widest" style={{ color: '#666' }}>{doc.uploadedAt.toLocaleTimeString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {doc.status === 'processing' ? (
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: '#F5F5F5', border: '1px solid #E0E0E0' }}>
                            <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
                            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#666' }}>Processing...</span>
                          </div>
                        ) : doc.status === 'completed' ? (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8F5E9', border: '1px solid #C8E6C9' }}>
                            <CheckCircle className="w-4 h-4" style={{ color: '#4CAF50' }} />
                          </div>
                        ) : (
                          <AlertCircle className="w-6 h-6" style={{ color: '#F57C00' }} />
                        )}

                        <button
                          onClick={(e) => { e.stopPropagation(); deleteDocument(doc.id); }}
                          className="w-10 h-10 flex items-center justify-center transition-colors"
                          style={{ color: '#666' }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {documents.length === 0 && (
                <div className="py-20 flex flex-col items-center text-center opacity-30">
                  <FileText className="w-12 h-12 mb-4" style={{ color: '#666' }} />
                  <p className="text-xs uppercase font-bold tracking-[0.2em]" style={{ color: '#666' }}>No Documents</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Visualization & Extraction */}
          <div className="relative">
            <AnimatePresence mode="wait">
              {selectedDoc?.extractedText ? (
                <motion.div
                  key={selectedDoc.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="sticky top-6 flex flex-col gap-6"
                >
                  <Card className="p-6 relative overflow-hidden" variant="elevated">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold" style={{ color: '#1A1A1A' }}>Extracted Text</h3>
                        <Badge variant="success">{Math.round(selectedDoc.extractedText.confidence * 100)}%</Badge>
                      </div>

                      <div className="rounded-xl p-5 min-h-[300px] max-h-[500px] overflow-y-auto" style={{ backgroundColor: '#F5F5F5', border: '1px solid #E0E0E0' }}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#1A1A1A' }}>
                          {selectedDoc.extractedText.text}
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <Button variant="outline" className="flex-1 text-[9px]" onClick={() => copyExtractedText(selectedDoc.extractedText!.text)}>
                          <Copy className="w-3.5 h-3.5 mr-2" />
                          Copy
                        </Button>
                        <Button variant="outline" className="flex-1 text-[9px]" onClick={() => downloadExtractedText(selectedDoc.extractedText!.text, selectedDoc.fileName)}>
                          <Download className="w-3.5 h-3.5 mr-2" />
                          Download
                        </Button>
                      </div>

                      <div className="pt-6 border-t" style={{ borderColor: '#E0E0E0' }}>
                        <Button className="w-full h-12 text-[10px] gap-3" variant="primary">
                          <Sparkles className="w-4 h-4" />
                          Research from Document
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>

                  {/* Security Badge */}
                  <div className="flex items-center justify-center gap-3 py-4 opacity-40">
                    <Lock className="w-3 h-3" />
                    <span className="text-[9px] uppercase font-bold tracking-[0.2em]">Private Local Extraction Active</span>
                  </div>
                </motion.div>
              ) : selectedDoc?.status === 'processing' ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-40 flex flex-col items-center justify-center text-center gap-6"
                >
                  <div className="relative">
                    <Mandala className="w-20 h-20 animate-spin opacity-20" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-4 h-4 bg-saffron rounded-full animate-ping" />
                    </div>
                  </div>
                  <p className="text-[10px] uppercase font-bold text-ash tracking-[0.3em]">Decoding Sacred Geometry...</p>
                </motion.div>
              ) : (
                <div className="py-40 flex flex-col items-center justify-center text-center opacity-20 border-2 border-dashed border-gray-200 rounded-2xl">
                  <Eye className="w-12 h-12 mb-4" style={{ color: '#666' }} />
                  <p className="text-[10px] uppercase font-bold tracking-[0.2em]" style={{ color: '#666' }}>Select a Document</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
