import { useState, useRef } from 'react';
import React from 'react';
import { motion } from 'framer-motion';
import { Mic, Upload, Copy, Download, Square, Sparkles, Volume2, Play, Pause, Languages, FileAudio } from 'lucide-react';
import { Button, Card, Badge, Spinner, cn } from '../components/ui';

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
    <div className="h-full overflow-y-auto no-scrollbar scroll-smooth p-6" style={{ backgroundColor: '#FAFAFA' }}>
      <div className="max-w-6xl mx-auto py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="p-6" variant="elevated">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1A1A1A', color: '#FAFAFA' }}>
                <Languages className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold" style={{ color: '#1A1A1A' }}>Voice Studio</h1>
                <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: '#666' }}>Speech Protocol</p>
              </div>
            </div>
            <p className="text-sm" style={{ color: '#666', maxWidth: '500px' }}>
              Experience high-fidelity speech synthesis and recognition. Powered by Sarvam AI.
            </p>
          </Card>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-3 mb-8">
          {[
            { id: 'stt', label: 'Speech to Text', icon: Mic },
            { id: 'tts', label: 'Text to Speech', icon: Volume2 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-3 px-6 py-3.5 rounded-lg font-medium text-sm transition-all",
                activeTab === tab.id
                  ? 'bg-gray-800 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10">
          {activeTab === 'stt' ? <STTPanel /> : <TTSPanel />}
        </div>
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
      className="grid lg:grid-cols-[0.9fr_1.1fr] gap-8"
    >
      <Card className="p-6" variant="elevated">
        <div className="space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: '#666' }}>
            <Mic className="w-4 h-4" style={{ color: '#1A1A1A' }} />
            Input Source
          </h3>

          <div>
            <label className="text-[10px] uppercase font-bold tracking-[0.2em] block mb-2" style={{ color: '#666' }}>Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border text-sm"
              style={{ backgroundColor: '#FAFAFA', borderColor: '#E0E0E0', color: '#1A1A1A' }}
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name} ({lang.native})</option>
              ))}
            </select>
          </div>

          {!audioPreview && (
            <div className="p-5 rounded-lg" style={{ backgroundColor: '#F5F5F5', border: '1px solid #E0E0E0' }}>
              <p className="text-xs uppercase tracking-widest font-bold mb-4" style={{ color: '#666' }}>Recording</p>
              {!isRecording ? (
                <Button onClick={startRecording} className="w-full text-xs" variant="primary">
                  <Mic className="w-4 h-4 mr-2" />
                  Start Recording
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3 py-2" style={{ color: '#666' }}>
                    <span className="w-2 h-2 rounded-full bg-gray-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-widest">Recording...</span>
                  </div>
                  <Button onClick={stopRecording} variant="outline" className="w-full text-xs">
                    <Square className="w-4 h-4 mr-2" />
                    Stop
                  </Button>
                </div>
              )}
            </div>
          )}

          {!audioPreview && (
            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[10px] font-bold" style={{ color: '#666' }}>OR</span>
              <div className="flex-1 h-px bg-gray-200" />
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
              className="border-2 border-dashed rounded-lg p-10 text-center cursor-pointer hover:border-gray-400 transition-all"
              style={{ borderColor: '#E0E0E0' }}
            >
              <Upload className="w-8 h-8 mx-auto mb-4" style={{ color: '#666' }} />
              <p className="text-sm font-bold mb-1" style={{ color: '#1A1A1A' }}>Upload Audio</p>
              <p className="text-[10px] uppercase tracking-widest" style={{ color: '#666' }}>Drop Audio File</p>
              <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleAudioSelect} className="hidden" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#F5F5F5', border: '1px solid #E0E0E0' }}>
                <div className="flex items-center justify-between mb-3 pb-3 border-b" style={{ borderColor: '#E0E0E0' }}>
                  <p className="text-xs font-bold truncate max-w-[150px]" style={{ color: '#1A1A1A' }}>{audio?.name}</p>
                  <Badge variant="neutral" className="text-[9px]">{audio ? `${(audio.size / 1024).toFixed(0)} KB` : ''}</Badge>
                </div>
                <audio src={audioPreview} controls className="w-full rounded-lg h-10" />
              </div>
              <Button variant="secondary" onClick={() => { setAudio(null); setAudioPreview(null); }} className="w-full text-xs">
                Clear
              </Button>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg" style={{ backgroundColor: '#FEE', border: '1px solid #FCC' }}>
              <p className="text-xs font-bold text-center" style={{ color: '#C00' }}>{error}</p>
            </div>
          )}

          <Button
            onClick={performSTT}
            disabled={!audioPreview || isLoading}
            className="w-full"
            variant="primary"
          >
            {isLoading ? 'Processing...' : 'Transcribe'}
          </Button>
        </div>
      </Card>

      <Card className="p-6 flex flex-col" variant="elevated">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: '#666' }}>Output</h3>
          {transcribedText && (
            <Badge variant="success">{Math.round(confidence * 100)}%</Badge>
          )}
        </div>

        <div className="flex-1 min-h-[300px] flex flex-col">
          {transcribedText ? (
            <div className="flex flex-col h-full">
              <div className="flex-1 rounded-xl p-6 border overflow-y-auto no-scrollbar" style={{ backgroundColor: '#F5F5F5', borderColor: '#E0E0E0' }}>
                <p className="text-base leading-relaxed whitespace-pre-wrap" style={{ color: '#1A1A1A' }}>{transcribedText}</p>
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="secondary" onClick={copyToClipboard} className="flex-1 text-xs gap-3">
                  <Copy className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
                <Button
                  variant="outline"
                  className="px-4"
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
            </div>
          ) : isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              <p className="text-xs uppercase font-bold tracking-[0.3em]" style={{ color: '#666' }}>Processing...</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center opacity-40">
              <FileAudio className="w-12 h-12" style={{ color: '#666' }} />
              <p className="text-xs uppercase tracking-widest font-bold" style={{ color: '#666' }}>No Audio</p>
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
      className="grid lg:grid-cols-[1fr_0.8fr] gap-8"
    >
      <Card className="cut-card cut-border bg-slate/40 p-6">
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-ash uppercase tracking-widest flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-peacock" />
            Lipi Matrix
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-ash tracking-[0.2em] block mb-2">Target Sound</label>
              <select
                value={language}
                onChange={(e) => { setLanguage(e.target.value); setVoice(''); }}
                className="w-full px-4 py-3 bg-void border border-smoke/30 rounded-xl text-chalk text-sm"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-ash tracking-[0.2em] block mb-2">Vachak Personality</label>
              <select
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                className="w-full px-4 py-3 bg-void border border-smoke/30 rounded-xl text-chalk text-sm"
              >
                {currentVoices.map(v => (
                  <option key={v.id} value={v.id}>{v.name} ({v.gender})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-ash tracking-[0.2em] block mb-2">Wisdom Text</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text to manifest into sound waves..."
              className="w-full px-5 py-4 bg-void border border-smoke/30 rounded-xl text-chalk placeholder:text-ash/40 text-sm focus:border-peacock focus:ring-1 focus:ring-peacock/20 transition-all resize-none font-display min-h-[200px]"
            />
            <div className="flex justify-between mt-2">
              <span className="text-[9px] text-ash font-mono uppercase">{text.length} Aksharas</span>
            </div>
          </div>

          <SanskritButton
            onClick={handleGenerate}
            disabled={!text.trim() || isLoading}
            className="w-full"
            variant="primary"
          >
            {isLoading ? 'Manifesting Sound...' : 'Realize Vachak'}
          </SanskritButton>
        </div>
      </Card>

      <Card className="cut-card cut-border bg-slate/40 p-6 flex flex-col">
        <h3 className="text-sm font-bold text-ash uppercase tracking-widest mb-6 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gold" />
          Sound Manifestation
        </h3>

        <div className="flex-1 flex flex-col items-center justify-center">
          {audioUrl ? (
            <div className="w-full space-y-8">
              <div className="bg-void/60 border border-smoke/20 rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-saffron/5 via-transparent to-gold/5" />
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                />

                <div className="flex flex-col items-center gap-6 relative z-10">
                  <div className="w-20 h-20 rounded-full bg-saffron/10 flex items-center justify-center border border-saffron/20 group-hover:scale-105 transition-transform">
                    {isPlaying ? <Volume2 className="w-8 h-8 text-saffron animate-pulse" /> : <Play className="w-8 h-8 text-saffron ml-1" />}
                  </div>

                  <div className="w-full h-1 bg-smoke/20 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-saffron"
                      animate={{ width: isPlaying ? '100%' : '0%' }}
                      transition={{ duration: 10, ease: "linear" }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <SanskritButton variant="primary" onClick={togglePlay} className="flex-1 text-xs">
                  {isPlaying ? 'Seal Sound' : 'Release Mantra'}
                </SanskritButton>
                <SanskritButton
                  variant="outline"
                  className="px-6"
                  onClick={() => {
                    const element = document.createElement('a');
                    element.setAttribute('href', audioUrl);
                    element.setAttribute('download', 'arros-vachak.wav');
                    element.click();
                  }}
                >
                  <Download className="w-4 h-4" />
                </SanskritButton>
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center gap-6">
              <div className="relative">
                <Mandala className="w-24 h-24 animate-[spin_80s_linear_infinite] opacity-10 text-gold" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 bg-saffron rounded-full animate-ping" />
                </div>
              </div>
              <p className="text-[10px] uppercase font-bold text-ash tracking-[0.3em]">Manifesting Voice from Void</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 text-center opacity-40">
              <Sparkles className="w-12 h-12 text-gold" />
              <p className="text-[10px] uppercase tracking-widest font-bold text-ash">Ready for Manifestation</p>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

const Loader2 = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 2v4" />
    <path d="M12 18v4" />
    <path d="M4.93 4.93l2.83 2.83" />
    <path d="M16.24 16.24l2.83 2.83" />
    <path d="M2 12h4" />
    <path d="M18 12h4" />
    <path d="M4.93 19.07l2.83-2.83" />
    <path d="M16.24 7.76l2.83-2.83" />
  </svg>
);
