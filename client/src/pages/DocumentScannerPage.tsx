import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
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
  Trash2
} from 'lucide-react';
import { Button, Card, Badge, Spinner } from '../components/ui';

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
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockExtractedText: ExtractedText = {
      text: `Sample extracted text from document:

ABSTRACT

Federated Learning in Healthcare: A Comprehensive Survey

Federated learning (FL) has emerged as a promising approach to address data privacy concerns in healthcare machine learning applications. This survey examines the current state of federated learning in healthcare, focusing on:

1. Privacy-preserving machine learning techniques
2. Distributed model training across hospitals
3. Patient data protection mechanisms

Key findings show that federated learning can reduce data leakage by 85% while maintaining model accuracy within 2% of centralized training approaches.

INTRODUCTION

Healthcare organizations generate vast amounts of sensitive patient data daily. Traditional machine learning approaches require centralizing this data, raising significant privacy concerns. Federated learning offers a solution by training models locally at each healthcare institution.

REFERENCES
[1] McMahan et al. (2017) - Communication-Efficient Learning
[2] Li et al. (2020) - Federated Optimization in Healthcare
[3] Sheller et al. (2020) - Federated Learning in Medical Imaging`,
      confidence: 0.92,
      language: 'en',
    };

    setDocuments(prev => prev.map(doc => 
      doc.id === docId 
        ? { ...doc, extractedText: mockExtractedText, status: 'completed' }
        : doc
    ));
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
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="cut-card cut-border bg-graphite/60 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 cut-card bg-gold/20 flex items-center justify-center">
                <Eye className="w-5 h-5 text-gold" />
              </div>
              <Badge variant="gold">दर्शनं — Vision AI</Badge>
            </div>
            <h1 className="text-2xl font-display text-chalk">Document Scanner</h1>
            <p className="text-sm text-silver mt-1">
              Upload PDFs, images — ARROS extracts text and creates citations automatically.
            </p>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Upload Area */}
          <div className="lg:col-span-2 space-y-4">
            <Card variant="elevated" className="cut-card cut-border">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                  ${isDragging 
                    ? 'border-peacock bg-peacock/5' 
                    : 'border-smoke hover:border-gold hover:bg-gold/5'
                  }
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 cut-card bg-gold/10 flex items-center justify-center">
                    <Scan className="w-8 h-8 text-gold" />
                  </div>
                  <div>
                    <p className="text-chalk font-medium mb-1">
                      Drop documents here or click to upload
                    </p>
                    <p className="text-sm text-ash">
                      Supports PDF, PNG, JPG, WebP — up to 10MB each
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Document List */}
            {documents.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-silver uppercase tracking-wider">
                  Uploaded Documents ({documents.length})
                </h3>
                {documents.map((doc) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card 
                      className={`
                        cut-card cut-border cursor-pointer transition-all
                        ${selectedDoc?.id === doc.id 
                          ? 'border-peacock bg-peacock/5' 
                          : 'hover:border-gold/50'
                        }
                      `}
                      onClick={() => setSelectedDoc(doc)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 cut-card bg-slate flex items-center justify-center">
                          {doc.fileType.includes('pdf') ? (
                            <FileType className="w-5 h-5 text-saffron" />
                          ) : (
                            <Image className="w-5 h-5 text-gold" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-chalk font-medium truncate">{doc.fileName}</p>
                          <p className="text-xs text-ash">
                            {formatFileSize(doc.fileSize)} • {doc.uploadedAt.toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {doc.status === 'processing' && (
                            <Spinner size="sm" variant="saffron" />
                          )}
                          {doc.status === 'completed' && (
                            <CheckCircle className="w-5 h-5 text-peacock" />
                          )}
                          {doc.status === 'error' && (
                            <AlertCircle className="w-5 h-5 text-saffron" />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteDocument(doc.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-ash hover:text-saffron" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {documents.length === 0 && (
              <Card variant="glass" className="cut-card cut-border">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-20 h-20 cut-card bg-slate flex items-center justify-center mb-4">
                    <FileText className="w-10 h-10 text-ash" />
                  </div>
                  <h3 className="text-lg font-semibold text-chalk mb-2">No documents yet</h3>
                  <p className="text-sm text-silver max-w-sm">
                    Upload PDFs, images, or photos of academic papers. 
                    ARROS will extract text and help you create citations.
                  </p>
                </div>
              </Card>
            )}
          </div>

          {/* Extracted Text Panel */}
          <div>
            {selectedDoc?.extractedText ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card variant="elevated" className="cut-card cut-border sticky top-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-chalk">Extracted Text</h3>
                      <Badge variant="peacock">
                        {Math.round(selectedDoc.extractedText.confidence * 100)}% confidence
                      </Badge>
                    </div>

                    <div className="bg-slate rounded-xl p-4 max-h-96 overflow-y-auto">
                      <p className="text-sm text-silver whitespace-pre-wrap leading-relaxed">
                        {selectedDoc.extractedText.text}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => copyExtractedText(selectedDoc.extractedText!.text)}
                        className="flex-1 gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => downloadExtractedText(
                          selectedDoc.extractedText!.text, 
                          selectedDoc.fileName
                        )}
                        className="flex-1 gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
                    </div>

                    <div className="pt-4 border-t border-smoke">
                      <Button
                        variant="peacock"
                        className="w-full gap-2"
                        onClick={() => {
                          console.log('Create research from document');
                        }}
                      >
                        Create Research from this Document
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ) : selectedDoc?.status === 'processing' ? (
              <Card variant="glass" className="cut-card cut-border">
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Spinner size="lg" variant="saffron" />
                  <p className="text-silver">Extracting text...</p>
                </div>
              </Card>
            ) : (
              <Card variant="glass" className="cut-card cut-border">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Eye className="w-12 h-12 text-ash mb-4" />
                  <p className="text-sm text-ash">
                    Select a document to view extracted text
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
