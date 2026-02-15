import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Download, Copy, Eye } from 'lucide-react';
import { Button, Card, Badge, Spinner } from './ui';
import { sarvamApi } from '../services/api';
import type { SarvamOCRResult } from '../types';

interface OCRComponentProps {
  onClose?: () => void;
}

export function OCRComponent({ onClose }: OCRComponentProps) {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ocrResult, setOCRResult] = useState<SarvamOCRResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState('en');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
      setOCRResult(null);
    }
  };

  const handleDragDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
      setOCRResult(null);
    }
  };

  const performOCR = async () => {
    if (!image) {
      setError('Please select an image');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await sarvamApi.performOCRWithFile(image, language);
      setOCRResult(result);
    } catch (err) {
      setError('Failed to perform OCR. Please try again.');
      console.error('OCR error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (ocrResult?.text) {
      navigator.clipboard.writeText(ocrResult.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setImage(null);
    setImagePreview(null);
    setOCRResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h2 className="text-2xl font-display font-bold text-chalk mb-2">Optical Character Recognition</h2>
        <p className="text-silver">Extract text from images using Sarvam AI OCR</p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card variant="elevated">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-chalk">Upload Image</h3>

            {/* Language Select */}
            <div>
              <label className="block text-sm font-medium text-silver mb-2">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-2 bg-slate border border-smoke rounded-lg text-chalk focus:outline-none focus:border-flame focus:ring-2 focus:ring-flame-10 transition-all"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="ta">Tamil</option>
                <option value="te">Telugu</option>
                <option value="kn">Kannada</option>
                <option value="ml">Malayalam</option>
              </select>
            </div>

            {/* Drag and Drop Area */}
            {!imagePreview ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDragDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-smoke rounded-xl p-8 text-center cursor-pointer hover:border-flame hover:bg-flame-10/5 transition-all"
              >
                <Upload className="w-10 h-10 text-ash mx-auto mb-3" />
                <p className="text-silver mb-1">Drag and drop your image here</p>
                <p className="text-xs text-ash">or click to browse</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative bg-slate rounded-xl overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-auto max-h-64 object-contain"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1"
                  >
                    Change Image
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-error/10 border border-error/20">
                <p className="text-sm text-error">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={performOCR}
                disabled={!imagePreview || isLoading}
                loading={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Processing...' : 'Extract Text'}
              </Button>
              {imagePreview && (
                <Button
                  variant="secondary"
                  onClick={handleReset}
                  disabled={isLoading}
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Results Section */}
        {ocrResult && (
          <Card variant="glass">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-chalk flex items-center gap-2">
                  <FileText className="w-5 h-5 text-flame" />
                  Extracted Text
                </h3>
                <Badge variant="success">
                  {Math.round(ocrResult.confidence * 100)}% confidence
                </Badge>
              </div>

              {/* Text Output */}
              <div className="bg-slate rounded-lg p-4 max-h-96 overflow-y-auto">
                <p className="text-silver text-sm whitespace-pre-wrap leading-relaxed font-mono">
                  {ocrResult.text}
                </p>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-2">
                {ocrResult.language && (
                  <div className="p-3 bg-graphite rounded-lg">
                    <p className="text-xs text-ash mb-1">Language</p>
                    <p className="text-sm text-chalk">{ocrResult.language}</p>
                  </div>
                )}
                <div className="p-3 bg-graphite rounded-lg">
                  <p className="text-xs text-ash mb-1">Confidence</p>
                  <p className="text-sm text-chalk">{Math.round(ocrResult.confidence * 100)}%</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={copyToClipboard}
                  className="flex-1"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const element = document.createElement('a');
                    element.setAttribute(
                      'href',
                      'data:text/plain;charset=utf-8,' + encodeURIComponent(ocrResult.text)
                    );
                    element.setAttribute('download', 'extracted-text.txt');
                    element.style.display = 'none';
                    document.body.appendChild(element);
                    element.click();
                    document.body.removeChild(element);
                  }}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <Card variant="glass">
            <div className="flex flex-col items-center justify-center h-full gap-4 py-12">
              <Spinner size="lg" />
              <p className="text-silver">Processing image...</p>
            </div>
          </Card>
        )}
      </div>
    </motion.div>
  );
}
