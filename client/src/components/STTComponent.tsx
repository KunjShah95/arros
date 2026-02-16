import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, Upload, Copy, Download, Square, Sparkles } from 'lucide-react';
import { Button, Card, Badge, Spinner } from './ui';
import { sarvamApi } from '../services/api';
import type { SarvamSTTResult } from '../types';

interface STTComponentProps {
  onClose?: () => void;
}

export function STTComponent({ onClose: _onClose }: STTComponentProps) {
  const [audio, setAudio] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [sttResult, setSTTResult] = useState<SarvamSTTResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState('en-IN');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const handleAudioSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudio(file);
      setAudioPreview(URL.createObjectURL(file));
      setError(null);
      setSTTResult(null);
    }
  };

  const handleDragDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setAudio(file);
      setAudioPreview(URL.createObjectURL(file));
      setError(null);
      setSTTResult(null);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const audioFile = new File([audioBlob], 'recording.webm', { type: mimeType });
        setAudio(audioFile);
        setAudioPreview(URL.createObjectURL(audioFile));
        setError(null);
        setSTTResult(null);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      setError('Failed to access microphone. Please check permissions.');
      console.error('Recording error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const performSTT = async () => {
    if (!audio) {
      setError('Please select or record an audio file');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await sarvamApi.speechToTextWithFile(audio, language);
      setSTTResult(result);
    } catch (err) {
      setError('Failed to convert speech to text. Please try again.');
      console.error('STT error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (sttResult?.text) {
      navigator.clipboard.writeText(sttResult.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setAudio(null);
    setAudioPreview(null);
    setSTTResult(null);
    setError(null);
    setIsRecording(false);
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
      <div className="cut-card cut-border bg-graphite/60 p-5">
        <Badge variant="electric" className="mb-2">Audio Intake</Badge>
        <h2 className="text-2xl font-display text-chalk mb-2">Speech-to-Text Studio</h2>
        <p className="text-silver">Convert speech or audio to text using Sarvam AI.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="elevated" className="cut-card cut-border">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-chalk">Audio Input</h3>

            <div>
              <label className="block text-sm font-medium text-silver mb-2">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-2 bg-graphite border border-smoke rounded-lg text-chalk"
              >
                <option value="en-IN">English</option>
                <option value="hi-IN">Hindi</option>
                <option value="ta-IN">Tamil</option>
                <option value="te-IN">Telugu</option>
                <option value="kn-IN">Kannada</option>
                <option value="ml-IN">Malayalam</option>
                <option value="bn-IN">Bengali</option>
                <option value="gu-IN">Gujarati</option>
                <option value="mr-IN">Marathi</option>
              </select>
            </div>

            {!audioPreview && (
              <div className="p-4 cut-card bg-slate border border-smoke">
                <p className="text-sm text-silver mb-3">Record audio directly</p>
                {!isRecording ? (
                  <Button
                    onClick={startRecording}
                    disabled={isLoading}
                    className="w-full mb-2"
                  >
                    <Mic className="w-4 h-4" />
                    Start Recording
                  </Button>
                ) : (
                  <Button
                    variant="danger"
                    onClick={stopRecording}
                    className="w-full mb-2"
                  >
                    <Square className="w-4 h-4" />
                    Stop Recording
                  </Button>
                )}
              </div>
            )}

            {!audioPreview && (
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-smoke" />
                <span className="text-xs text-ash px-2">OR</span>
                <div className="flex-1 h-px bg-smoke" />
              </div>
            )}

            {!audioPreview ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDragDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-smoke cut-card p-8 text-center cursor-pointer hover:border-flame hover:bg-flame/5 transition-all"
              >
                <Upload className="w-10 h-10 text-ash mx-auto mb-3" />
                <p className="text-silver mb-1">Drag and drop your audio here</p>
                <p className="text-xs text-ash">or click to browse</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-4 cut-card bg-slate border border-smoke">
                  <p className="text-sm text-ash mb-2">Audio File</p>
                  <p className="text-sm text-chalk truncate">{audio?.name || 'Recording'}</p>
                  <p className="text-xs text-ash mt-1">
                    {audio ? `${(audio.size / 1024).toFixed(2)} KB` : 'Ready to process'}
                  </p>
                </div>
                {audioPreview && (
                  <audio
                    src={audioPreview}
                    controls
                    className="w-full rounded-lg"
                  />
                )}
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1"
                  >
                    Change Audio
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioSelect}
                    className="hidden"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 cut-card bg-error/10 border border-error/20">
                <p className="text-sm text-error">{error}</p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                onClick={performSTT}
                disabled={!audioPreview || isLoading}
                loading={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Processing...' : 'Convert to Text'}
              </Button>
              {audioPreview && (
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

        {sttResult && (
          <Card variant="glass" className="cut-card cut-border">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-chalk flex items-center gap-2">
                  <Mic className="w-5 h-5 text-flame" />
                  Transcribed Text
                </h3>
                <Badge variant="success">
                  {Math.round(sttResult.confidence * 100)}% confidence
                </Badge>
              </div>

              <div className="bg-slate rounded-lg p-4 max-h-96 overflow-y-auto">
                <p className="text-silver text-sm leading-relaxed">
                  {sttResult.text}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {sttResult.language && (
                  <div className="p-3 cut-card bg-graphite">
                    <p className="text-xs text-ash mb-1">Language</p>
                    <p className="text-sm text-chalk">{sttResult.language}</p>
                  </div>
                )}
                <div className="p-3 cut-card bg-graphite">
                  <p className="text-xs text-ash mb-1">Duration</p>
                  <p className="text-sm text-chalk">{sttResult.duration.toFixed(2)}s</p>
                </div>
                <div className="p-3 cut-card bg-graphite col-span-2">
                  <p className="text-xs text-ash mb-1">Confidence</p>
                  <p className="text-sm text-chalk">{Math.round(sttResult.confidence * 100)}%</p>
                </div>
              </div>

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
                      'data:text/plain;charset=utf-8,' + encodeURIComponent(sttResult.text)
                    );
                    element.setAttribute('download', 'transcription.txt');
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

        {isLoading && (
          <Card variant="glass" className="cut-card cut-border">
            <div className="flex flex-col items-center justify-center h-full gap-4 py-12">
              <Spinner size="lg" />
              <p className="text-silver">Converting speech to text...</p>
            </div>
          </Card>
        )}

        {!sttResult && !isLoading && !audioPreview && (
          <Card variant="glass" className="cut-card cut-border">
            <div className="flex flex-col items-center justify-center h-full gap-3 py-12 text-center">
              <Sparkles className="w-8 h-8 text-electric" />
              <p className="text-sm text-ash">Record or upload audio to begin transcription.</p>
            </div>
          </Card>
        )}
      </div>
    </motion.div>
  );
}
