import { useState, useRef } from 'react';
import React from 'react';
import { motion } from 'framer-motion';
import { Mic, Upload, Copy, Download, Square, Sparkles, Volume2, Play, Pause, Languages, FileAudio } from 'lucide-react';
import { Button, Card, Badge, Spinner } from '../components/ui';

const languages = [
  { code: 'en-IN', name: 'English', native: 'English' },
  { code: 'hi-IN', name: 'Hindi', native: 'हिंदी' },
  { code: 'ta-IN', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te-IN', name: 'Telugu', native: 'తెలుగు' },
  { code: 'kn-IN', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml-IN', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'bn-IN', name: 'Bengali', native: 'বাংলা' },
  { code: 'gu-IN', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'mr-IN', name: 'Marathi', native: 'मराठी' },
  { code: 'pa-IN', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
];

const voices = {
  'en-IN': [
    { id: 'en-IN-male', name: 'Arvind', gender: 'Male' },
    { id: 'en-IN-female', name: 'Anushka', gender: 'Female' },
  ],
  'hi-IN': [
    { id: 'hi-IN-male', name: 'Hitesh', gender: 'Male' },
    { id: 'hi-IN-female', name: 'Aditi', gender: 'Female' },
  ],
  'ta-IN': [
    { id: 'ta-IN-female', name: 'Uma', gender: 'Female' },
    { id: 'ta-IN-male', name: 'Kumar', gender: 'Male' },
  ],
};

interface VoiceStudioProps {
  initialTab?: 'stt' | 'tts';
}

export function VoiceStudio({ initialTab = 'stt' }: VoiceStudioProps) {
  const [activeTab, setActiveTab] = useState<'stt' | 'tts'>(initialTab);
  
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
              <div className="w-10 h-10 cut-card bg-peacock/20 flex items-center justify-center">
                <Languages className="w-5 h-5 text-peacock" />
              </div>
              <Badge variant="peacock">भाषण Studio — Voice AI</Badge>
            </div>
            <h1 className="text-2xl font-display text-chalk">Voice Studio</h1>
            <p className="text-sm text-silver mt-1">
              Speech-to-Text and Text-to-Speech powered by Sarvam AI — India's voice AI.
            </p>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('stt')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'stt'
                ? 'bg-peacock text-void'
                : 'bg-slate text-silver hover:text-chalk hover:bg-smoke'
            }`}
          >
            <Mic className="w-4 h-4" />
            Speech to Text
          </button>
          <button
            onClick={() => setActiveTab('tts')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'tts'
                ? 'bg-peacock text-void'
                : 'bg-slate text-silver hover:text-chalk hover:bg-smoke'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            Text to Speech
          </button>
        </div>

        {/* Content */}
        {activeTab === 'stt' ? <STTPanel /> : <TTSPanel />}
      </div>
    </div>
  );
}

function STTPanel() {
  const [audio, setAudio] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState('en-IN');
  const [copied, setCopied] = useState(false);
  const [confidence, setConfidence] = useState(0);
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
      setTranscribedText('');
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
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      setError('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const performSTT = async () => {
    if (!audio) return;
    setIsLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const mockText = language === 'hi-IN' 
        ? 'फेडरेटेड लर्निंग एक मशीन लर्निंग तकनीक है जो विकेंद्रीकृत डेटा का उपयोग करके मॉडल को प्रशिक्षित करती है।'
        : 'Federated Learning is a machine learning technique that trains models across decentralized data sources while keeping data local.';
      setTranscribedText(mockText);
      setConfidence(0.94);
    } catch (err) {
      setError('Failed to convert speech to text.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(transcribedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid lg:grid-cols-2 gap-6"
    >
      <Card variant="elevated" className="cut-card cut-border">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-chalk flex items-center gap-2">
            <Mic className="w-5 h-5 text-peacock" />
            Audio Input
          </h3>

          <div>
            <label className="block text-sm font-medium text-silver mb-2">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate border border-smoke rounded-xl text-chalk"
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name} ({lang.native})</option>
              ))}
            </select>
          </div>

          {!audioPreview && (
            <div className="p-4 cut-card bg-slate border border-smoke">
              <p className="text-sm text-silver mb-3">Record your voice</p>
              {!isRecording ? (
                <Button onClick={startRecording} className="w-full" variant="peacock">
                  <Mic className="w-4 h-4" />
                  Start Recording
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-saffron">
                    <span className="w-2 h-2 rounded-full bg-saffron animate-pulse" />
                    Recording...
                  </div>
                  <Button onClick={stopRecording} variant="saffron" className="w-full">
                    <Square className="w-4 h-4" />
                    Stop
                  </Button>
                </div>
              )}
            </div>
          )}

          {!audioPreview && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-smoke" />
              <span className="text-xs text-ash">OR</span>
              <div className="flex-1 h-px bg-smoke" />
            </div>
          )}

          {!audioPreview ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  setAudio(file);
                  setAudioPreview(URL.createObjectURL(file));
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-smoke cut-card p-8 text-center cursor-pointer hover:border-peacock hover:bg-peacock/5 transition-all"
            >
              <Upload className="w-10 h-10 text-ash mx-auto mb-3" />
              <p className="text-silver mb-1">Drag and drop audio</p>
              <p className="text-xs text-ash">or click to browse</p>
              <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleAudioSelect} className="hidden" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 cut-card bg-slate border border-smoke">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-chalk truncate">{audio?.name}</p>
                  <Badge variant="peacock">{audio ? `${(audio.size / 1024).toFixed(0)} KB` : ''}</Badge>
                </div>
                <audio src={audioPreview} controls className="w-full rounded-lg" />
              </div>
              <Button variant="secondary" onClick={() => { setAudio(null); setAudioPreview(null); }} className="w-full">
                Remove & Record New
              </Button>
            </div>
          )}

          {error && (
            <div className="p-3 cut-card bg-saffron/10 border border-saffron/20">
              <p className="text-sm text-saffron">{error}</p>
            </div>
          )}

          <Button
            onClick={performSTT}
            disabled={!audioPreview || isLoading}
            loading={isLoading}
            className="w-full"
            variant="peacock"
          >
            {isLoading ? 'Transcribing...' : 'Convert to Text'}
          </Button>
        </div>
      </Card>

      <Card variant="glass" className="cut-card cut-border">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-chalk">Transcribed Text</h3>
            {transcribedText && (
              <Badge variant="peacock">{Math.round(confidence * 100)}% confidence</Badge>
            )}
          </div>

          {transcribedText ? (
            <>
              <div className="bg-slate rounded-xl p-4 max-h-80 overflow-y-auto">
                <p className="text-silver text-sm leading-relaxed whitespace-pre-wrap">{transcribedText}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={copyToClipboard} className="flex-1 gap-2">
                  <Copy className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Copy Text'}
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => {
                    const element = document.createElement('a');
                    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(transcribedText));
                    element.setAttribute('download', 'transcription.txt');
                    element.click();
                  }}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <Spinner size="lg" variant="peacock" />
              <p className="text-silver">Transcribing speech...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
              <FileAudio className="w-12 h-12 text-ash" />
              <p className="text-sm text-ash">Upload audio or record speech to begin transcription.</p>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

function TTSPanel() {
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('en-IN');
  const [voice, setVoice] = useState('en-IN-female');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const currentVoices = voices[language as keyof typeof voices] || voices['en-IN'];

  const handleGenerate = async () => {
    if (!text.trim()) return;
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setAudioUrl('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid lg:grid-cols-2 gap-6"
    >
      <Card variant="elevated" className="cut-card cut-border">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-chalk flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-peacock" />
            Text Input
          </h3>

          <div>
            <label className="block text-sm font-medium text-silver mb-2">Language</label>
            <select
              value={language}
              onChange={(e) => { setLanguage(e.target.value); setVoice(''); }}
              className="w-full px-4 py-2.5 bg-slate border border-smoke rounded-xl text-chalk"
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name} ({lang.native})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-silver mb-2">Voice</label>
            <select
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate border border-smoke rounded-xl text-chalk"
            >
              {currentVoices.map(v => (
                <option key={v.id} value={v.id}>{v.name} ({v.gender})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-silver mb-2">Text to Convert</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text to convert to speech..."
              className="w-full px-4 py-3 bg-slate border border-smoke rounded-xl text-chalk placeholder:text-ash focus:border-peacock focus:ring-2 focus:ring-peacock-10 transition-all resize-none"
              rows={8}
            />
            <p className="text-xs text-ash mt-1">{text.length} characters</p>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!text.trim() || isLoading}
            loading={isLoading}
            className="w-full"
            variant="peacock"
          >
            {isLoading ? 'Generating...' : 'Generate Speech'}
          </Button>
        </div>
      </Card>

      <Card variant="glass" className="cut-card cut-border">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-chalk flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-saffron" />
            Audio Output
          </h3>

          {audioUrl ? (
            <>
              <div className="bg-slate rounded-xl p-4">
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                  className="w-full"
                  controls
                />
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={togglePlay} className="flex-1 gap-2">
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => {
                    const element = document.createElement('a');
                    element.setAttribute('href', audioUrl);
                    element.setAttribute('download', 'arros-speech.wav');
                    element.click();
                  }}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-3 cut-card bg-slate/70 border border-smoke/50">
                <p className="text-xs text-ash mb-2">Preview</p>
                <p className="text-sm text-silver line-clamp-3">{text}</p>
              </div>
            </>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <Spinner size="lg" variant="saffron" />
              <p className="text-silver">Generating speech...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
              <Sparkles className="w-12 h-12 text-gold" />
              <p className="text-sm text-ash">Enter text to generate audio output.</p>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
