import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  Save,
  Bell,
  Palette,
  Database,
  Code,
  Settings,
  Shield,
  Zap,
  Globe,
  Cpu,
  Brain,
  Unlock
} from 'lucide-react';
import { Card, Button, Input, Badge, HoverCard, SanskritButton, Mandala, cn } from '../components/ui';

interface ApiKeyConfig {
  name: string;
  key: string;
  description: string;
  required: boolean;
}

const apiKeys: ApiKeyConfig[] = [
  {
    name: 'Sarvam AI Protocol',
    key: 'SARVAM_API_KEY',
    description: 'Required for Vedic Voice & OCR intelligence',
    required: true,
  },
  {
    name: 'OpenAI Akasha',
    key: 'OPENAI_API_KEY',
    description: 'Powers the core reasoning engine (GPT-4o)',
    required: true,
  },
  {
    name: 'Serper Vision',
    key: 'SERPER_API_KEY',
    description: 'Enables real-time web awareness',
    required: true,
  },
  {
    name: 'Anthropic Synthesis',
    key: 'ANTHROPIC_API_KEY',
    description: 'Optional Claude 3.5 Sonnet integration',
    required: false,
  },
];

export function SettingsPage() {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [savedKeys, setSavedKeys] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleShowKey = (key: string) => {
    setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const configuredKeys = apiKeys.filter((k) => savedKeys[k.key] || k.key === 'SARVAM_API_KEY').length; // Mock SARVAM as configured

  return (
    <div className="h-full overflow-y-auto no-scrollbar scroll-smooth p-6 pb-20">
      <div className="max-w-4xl mx-auto py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="cut-card cut-border bg-graphite/40 p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 -mr-20 -mt-20 opacity-[0.03] pointer-events-none">
              <Mandala size="lg" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 cut-card bg-smoke/10 flex items-center justify-center border border-smoke/30 text-silver">
                    <Settings className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-display font-bold text-white tracking-tight">System Observatory</h1>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-ash font-bold">Vachak & Lipi Configuration</p>
                  </div>
                </div>
                <p className="text-sm text-silver max-w-xl leading-relaxed">
                  Calibrate the internal harmonics of ARROS. Securely manage your API gateways and system preferences.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[9px] uppercase font-bold text-ash tracking-widest mb-1">Gateway Status</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-peacock animate-pulse" />
                    <span className="text-sm font-bold text-peacock uppercase tracking-wider">Synchronized</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8">
          {/* API Gateways */}
          <div className="space-y-8">
            <section>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-ash uppercase tracking-[0.2em] flex items-center gap-2">
                  <Unlock className="w-4 h-4 text-saffron" />
                  API Gateways
                </h3>
                <Badge variant="saffron" className="text-[9px] uppercase">{configuredKeys}/{apiKeys.length} ACTIVE</Badge>
              </div>

              <Card className="cut-card cut-border bg-slate/40 p-6 space-y-4">
                {apiKeys.map((apiKey, index) => (
                  <ApiKeyInput
                    key={apiKey.key}
                    config={apiKey}
                    isVisible={showKeys[apiKey.key] || false}
                    value={savedKeys[apiKey.key] || (apiKey.key === 'SARVAM_API_KEY' ? '••••••••••••••••' : '')}
                    onToggle={() => toggleShowKey(apiKey.key)}
                    onChange={(value) => setSavedKeys((prev) => ({ ...prev, [apiKey.key]: value }))}
                    index={index}
                  />
                ))}

                <div className="pt-4 flex items-center justify-between border-t border-smoke/10">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-peacock" />
                    <span className="text-[10px] text-ash uppercase font-bold tracking-widest">End-to-End Encrypted</span>
                  </div>
                  <SanskritButton
                    onClick={handleSave}
                    variant="primary"
                    className="h-10 text-[10px] px-6"
                    disabled={saving}
                  >
                    {saving ? 'Syncing...' : 'Save Protocols'}
                  </SanskritButton>
                </div>
              </Card>
            </section>

            <section>
              <h3 className="text-sm font-bold text-ash uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-peacock" />
                Reasoning Parameters
              </h3>
              <Card className="cut-card cut-border bg-slate/40 p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-ash tracking-[0.2em] block mb-2">Default Atman (Model)</label>
                    <select className="w-full px-4 py-3 bg-void border border-smoke/30 rounded-xl text-chalk text-xs focus:border-peacock/50 outline-none transition-all">
                      <option>GPT-4o (Mahatma)</option>
                      <option>Claude 3.5 Sonnet (Scholar)</option>
                      <option>GPT-4o Mini (Seeker)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-ash tracking-[0.2em] block mb-2">Evidence Depth</label>
                    <select className="w-full px-4 py-3 bg-void border border-smoke/30 rounded-xl text-chalk text-xs focus:border-peacock/50 outline-none transition-all">
                      <option>Sutra (Concise - 5 sources)</option>
                      <option>Grantha (Standard - 15 sources)</option>
                      <option>Puran (Deep - 30 sources)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 cut-card bg-void border border-smoke/20 group hover:border-peacock/30 transition-all">
                  <div>
                    <p className="text-xs font-bold text-white group-hover:text-peacock transition-colors">Vedic Verification Protocol</p>
                    <p className="text-[9px] text-ash uppercase tracking-widest mt-1">Cross-reference all insights for absolute Satya</p>
                  </div>
                  <Toggle defaultChecked />
                </div>
              </Card>
            </section>
          </div>

          {/* Sidebar Settings */}
          <div className="space-y-8">
            <section>
              <h3 className="text-sm font-bold text-ash uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Palette className="w-4 h-4 text-gold" />
                Aesthetic Preferences
              </h3>
              <Card className="cut-card cut-border bg-slate/40 p-6 space-y-4">
                {[
                  { id: 'dark', label: 'Vedic Void (Dark Mode)', desc: 'Standard obsidian interface', active: true },
                  { id: 'anim', label: 'Lila (Animations)', desc: 'Enable fluid UI transitions', active: true },
                  { id: 'glass', label: 'Maya (Glassmorphism)', desc: 'Dynamic background blurring', active: true },
                  { id: 'sound', label: 'Dhvani (UI Sounds)', desc: 'Auditory feedback cues', active: false },
                ].map(pref => (
                  <div key={pref.id} className="flex items-center justify-between p-3 cut-card bg-void/40 border border-smoke/10">
                    <div>
                      <p className="text-xs font-bold text-silver">{pref.label}</p>
                      <p className="text-[9px] text-ash uppercase tracking-widest mt-0.5">{pref.desc}</p>
                    </div>
                    <Toggle defaultChecked={pref.active} />
                  </div>
                ))}
              </Card>
            </section>

            <section>
              <h3 className="text-sm font-bold text-ash uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Database className="w-4 h-4 text-silver" />
                Memory Governance
              </h3>
              <Card className="cut-card cut-border bg-slate/40 p-6 space-y-4">
                <div className="p-4 cut-card bg-void border border-smoke/20">
                  <p className="text-xs font-bold text-white mb-2">Memory Expunge</p>
                  <p className="text-[10px] text-ash uppercase tracking-widest mb-4">Wipe all synthesized knowledge and realization history</p>
                  <button className="w-full py-2.5 rounded-lg border border-saffron/30 text-saffron text-[10px] uppercase font-bold tracking-widest hover:bg-saffron/10 transition-all">
                    Clear All Memories
                  </button>
                </div>

                <div className="p-4 cut-card bg-void border border-smoke/20">
                  <p className="text-xs font-bold text-white mb-2">Knowledge Export</p>
                  <p className="text-[10px] text-ash uppercase tracking-widest mb-4">Download your entire research index as a JSON sutra</p>
                  <SanskritButton variant="ghost" className="w-full h-10 text-[10px]">
                    Export Research Archive
                  </SanskritButton>
                </div>
              </Card>
            </section>
          </div>
        </div>

        {/* Save Banner */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: saved ? 1 : 0, y: saved ? 0 : 50 }}
          className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="px-8 py-4 cut-card bg-peacock text-void font-bold text-sm shadow-2xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5" />
            Protocols Synchronized Successfully
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function ApiKeyInput({
  config,
  isVisible,
  value,
  onToggle,
  onChange,
  index
}: {
  config: ApiKeyConfig;
  isVisible: boolean;
  value: string;
  onToggle: () => void;
  onChange: (value: string) => void;
  index: number;
}) {
  const isConfigured = value.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="p-4 cut-card bg-void border border-smoke/20 group hover:border-smoke/40 transition-all"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <label className="text-xs font-bold text-white group-hover:text-silver transition-colors">
            {config.name}
            {config.required && <span className="text-saffron ml-1">*</span>}
          </label>
        </div>
        <Badge variant={isConfigured ? 'peacock' : 'saffron'} className="text-[9px]">
          {isConfigured ? 'ACTIVE' : 'REQUIRED'}
        </Badge>
      </div>
      <div className="relative">
        <input
          type={isVisible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter secret ${config.name.toLowerCase()}...`}
          className="w-full bg-slate/20 border border-smoke/30 rounded-lg px-4 py-2.5 text-chalk text-xs placeholder:text-ash/30 outline-none focus:border-smoke/60 transition-all font-mono"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ash hover:text-white transition-colors"
        >
          {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>
      <p className="text-[9px] text-ash uppercase tracking-widest mt-2 ml-1">{config.description}</p>
    </motion.div>
  );
}

function Toggle({ defaultChecked = false }: { defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <button
      type="button"
      onClick={() => setChecked(!checked)}
      className={cn(
        "relative w-10 h-5 rounded-full transition-colors duration-300",
        checked ? 'bg-peacock' : 'bg-smoke/30'
      )}
    >
      <motion.span
        className="absolute top-1 left-1 w-3 h-3 rounded-full bg-void shadow-sm"
        animate={{ x: checked ? 20 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

export default SettingsPage;
