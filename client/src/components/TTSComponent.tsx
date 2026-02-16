import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Volume2, Play, Pause, Download, Sparkles } from 'lucide-react';
import { Button, Card, Badge, Spinner } from './ui';
import { sarvamApi } from '../services/api';
import type { SarvamTTSResult } from '../types';

interface TTSComponentProps {
  onClose?: () => void;
}

export function TTSComponent({ onClose: _onClose }: TTSComponentProps) {
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('en-IN');
  const [voice, setVoice] = useState('anushka');
  const [ttsResult, setTTSResult] = useState<SarvamTTSResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const handleConvertToSpeech = async () => {
    if (!text.trim()) {
      setError('Please enter text to convert');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await sarvamApi.textToSpeech({
        text,
        language,
        voice,
      });
      setTTSResult(result);
    } catch (err) {
      setError('Failed to convert text to speech. Please try again.');
      console.error('TTS error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleDownload = () => {
    if (ttsResult?.audioUrl) {
      const element = document.createElement('a');
      element.setAttribute('href', ttsResult.audioUrl);
      element.setAttribute('download', `audio-${Date.now()}.${ttsResult.format || 'mp3'}`);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="cut-card cut-border bg-graphite/60 p-5">
        <Badge variant="electric" className="mb-2">Audio Synthesis</Badge>
        <h2 className="text-2xl font-display text-chalk mb-2">Text-to-Speech Studio</h2>
        <p className="text-silver">Convert text to natural-sounding speech using Sarvam AI.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="elevated" className="cut-card cut-border">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-chalk">Text Input</h3>

            <div>
              <label className="block text-sm font-medium text-silver mb-2">Text to Convert</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter the text you want to convert to speech..."
                className="w-full px-4 py-3 bg-graphite border border-smoke rounded-lg text-chalk placeholder:text-ash focus:outline-none focus:border-flame focus:ring-2 focus:ring-flame-10 transition-all resize-none"
                rows={6}
              />
              <p className="text-xs text-ash mt-1">{text.length} characters</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-silver mb-2">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 bg-graphite border border-smoke rounded-lg text-chalk"
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

              <div>
                <label className="block text-sm font-medium text-silver mb-2">Voice</label>
                <select
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                  className="w-full px-3 py-2 bg-graphite border border-smoke rounded-lg text-chalk"
                >
                  <option value="anushka">Anushka (Female)</option>
                  <option value="arvind">Arvind (Male)</option>
                  <option value="divya">Divya (Female)</option>
                  <option value="hari">Hari (Male)</option>
                  <option value="kajal">Kajal (Female)</option>
                  <option value="ravi">Ravi (Male)</option>
                  <option value="sanjay">Sanjay (Male)</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="p-3 cut-card bg-error/10 border border-error/20">
                <p className="text-sm text-error">{error}</p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleConvertToSpeech}
                disabled={!text.trim() || isLoading}
                loading={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Converting...' : 'Convert to Speech'}
              </Button>
            </div>
          </div>
        </Card>

        {ttsResult && (
          <Card variant="glass" className="cut-card cut-border">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-chalk flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-flame" />
                Audio Output
              </h3>

              <div className="bg-slate rounded-lg p-4">
                <audio
                  ref={audioRef}
                  src={ttsResult.audioUrl}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                  className="w-full"
                  controls
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 cut-card bg-graphite">
                  <p className="text-xs text-ash mb-1">Duration</p>
                  <p className="text-sm text-chalk">{ttsResult.duration.toFixed(2)}s</p>
                </div>
                <div className="p-3 cut-card bg-graphite">
                  <p className="text-xs text-ash mb-1">Format</p>
                  <p className="text-sm text-chalk">{ttsResult.format.toUpperCase()}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={togglePlayPause}
                  className="flex-1"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDownload}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>

              <div className="p-3 cut-card bg-graphite/70 border border-smoke/50">
                <p className="text-xs text-ash mb-2">Original Text</p>
                <p className="text-sm text-silver text-ellipsis overflow-hidden line-clamp-3">
                  {text}
                </p>
              </div>
            </div>
          </Card>
        )}

        {isLoading && (
          <Card variant="glass" className="cut-card cut-border">
            <div className="flex flex-col items-center justify-center h-full gap-4 py-12">
              <Spinner size="lg" />
              <p className="text-silver">Converting text to speech...</p>
            </div>
          </Card>
        )}

        {!ttsResult && !isLoading && text.length === 0 && (
          <Card variant="glass" className="cut-card cut-border">
            <div className="flex flex-col items-center justify-center h-full gap-3 py-12 text-center">
              <Sparkles className="w-8 h-8 text-electric" />
              <p className="text-sm text-ash">Add text to generate an audio output.</p>
            </div>
          </Card>
        )}
      </div>
    </motion.div>
  );
}
