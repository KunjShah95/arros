import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Volume2, Play, Pause, Download, Copy } from 'lucide-react';
import { Button, Card, Badge, Spinner } from './ui';
import { sarvamApi } from '../services/api';
import type { SarvamTTSResult } from '../types';

interface TTSComponentProps {
  onClose?: () => void;
}

export function TTSComponent({ onClose }: TTSComponentProps) {
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('en');
  const [voice, setVoice] = useState('female');
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [ttsResult, setTTSResult] = useState<SarvamTTSResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<string[]>(['male', 'female']);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const loadVoices = async () => {
      try {
        const voices = await sarvamApi.getAvailableVoices();
        setAvailableVoices(voices);
      } catch (err) {
        console.error('Failed to load voices:', err);
      }
    };
    loadVoices();
  }, []);

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
        speed,
        pitch,
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

  const copyTextToClipboard = () => {
    navigator.clipboard.writeText(text);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h2 className="text-2xl font-display font-bold text-chalk mb-2">Text-to-Speech</h2>
        <p className="text-silver">Convert text to natural-sounding speech using Sarvam AI</p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card variant="elevated">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-chalk">Text Input</h3>

            {/* Text Area */}
            <div>
              <label className="block text-sm font-medium text-silver mb-2">Text to Convert</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter the text you want to convert to speech..."
                className="w-full px-4 py-3 bg-slate border border-smoke rounded-lg text-chalk placeholder:text-ash focus:outline-none focus:border-flame focus:ring-2 focus:ring-flame-10 transition-all resize-none"
                rows={6}
              />
              <p className="text-xs text-ash mt-1">{text.length} characters</p>
            </div>

            {/* Settings Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-silver mb-2">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate border border-smoke rounded-lg text-chalk focus:outline-none focus:border-flame focus:ring-2 focus:ring-flame-10 transition-all"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="ta">Tamil</option>
                  <option value="te">Telugu</option>
                  <option value="kn">Kannada</option>
                  <option value="ml">Malayalam</option>
                </select>
              </div>

              {/* Voice */}
              <div>
                <label className="block text-sm font-medium text-silver mb-2">Voice</label>
                <select
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                  className="w-full px-3 py-2 bg-slate border border-smoke rounded-lg text-chalk focus:outline-none focus:border-flame focus:ring-2 focus:ring-flame-10 transition-all"
                >
                  {availableVoices.map((v) => (
                    <option key={v} value={v}>
                      {v.charAt(0).toUpperCase() + v.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Speed and Pitch Sliders */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-silver mb-2">
                  Speed: {speed.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-silver mb-2">
                  Pitch: {pitch.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={pitch}
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-error/10 border border-error/20">
                <p className="text-sm text-error">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
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

        {/* Output Section */}
        {ttsResult && (
          <Card variant="glass">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-chalk flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-flame" />
                Audio Output
              </h3>

              {/* Audio Player */}
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

              {/* Duration and Format */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-graphite rounded-lg">
                  <p className="text-xs text-ash mb-1">Duration</p>
                  <p className="text-sm text-chalk">{ttsResult.duration.toFixed(2)}s</p>
                </div>
                <div className="p-3 bg-graphite rounded-lg">
                  <p className="text-xs text-ash mb-1">Format</p>
                  <p className="text-sm text-chalk">{ttsResult.format.toUpperCase()}</p>
                </div>
              </div>

              {/* Quick Actions */}
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

              {/* Original Text Reference */}
              <div className="p-3 bg-graphite/50 rounded-lg border border-smoke/50">
                <p className="text-xs text-ash mb-2">Original Text</p>
                <p className="text-sm text-silver text-ellipsis overflow-hidden line-clamp-3">
                  {text}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <Card variant="glass">
            <div className="flex flex-col items-center justify-center h-full gap-4 py-12">
              <Spinner size="lg" />
              <p className="text-silver">Converting text to speech...</p>
            </div>
          </Card>
        )}
      </div>
    </motion.div>
  );
}
