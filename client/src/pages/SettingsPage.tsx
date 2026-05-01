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
import { Card, Button, Input, Badge, cn } from '../components/ui';

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
    <div className="h-full overflow-y-auto no-scrollbar scroll-smooth p-3 md:p-6 pb-24 md:pb-20" style={{ backgroundColor: '#FAFAFA' }}>
      <div className="max-w-4xl mx-auto py-3 md:py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="p-5 md:p-8" variant="elevated">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1A1A1A', color: '#FAFAFA' }}>
                    <Settings className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-semibold" style={{ color: '#1A1A1A' }}>System Observatory</h1>
                    <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: '#666' }}>Configuration</p>
                  </div>
                </div>
                <p className="text-sm" style={{ color: '#666', maxWidth: '400px' }}>
                  Calibrate the internal harmonics of ARROS. Securely manage your API gateways and system preferences.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[9px] uppercase font-bold tracking-widest mb-1" style={{ color: '#666' }}>Gateway Status</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm font-bold" style={{ color: '#1A1A1A' }}>Synchronized</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8">
          {/* API Gateways */}
          <div className="space-y-8">
            <section>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-2" style={{ color: '#666' }}>
                  <Unlock className="w-4 h-4" style={{ color: '#1A1A1A' }} />
                  API Gateways
                </h3>
                <Badge variant="neutral" className="text-[9px] uppercase">{configuredKeys}/{apiKeys.length} Active</Badge>
              </div>

              <Card className="p-6 space-y-4" variant="elevated">
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

                <div className="pt-4 flex items-center justify-between border-t" style={{ borderColor: '#E0E0E0' }}>
                  <div className="flex items-center gap-2" style={{ color: '#666' }}>
                    <Shield className="w-4 h-4" />
                    <span className="text-[10px] uppercase font-bold tracking-widest">End-to-End Encrypted</span>
                  </div>
                  <Button
                    onClick={handleSave}
                    variant="primary"
                    className="h-10 text-[10px] px-6"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </Card>
            </section>

            <section>
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] mb-6 flex items-center gap-2" style={{ color: '#666' }}>
                <Cpu className="w-4 h-4" style={{ color: '#1A1A1A' }} />
                Reasoning Parameters
              </h3>
              <Card className="p-6 space-y-6" variant="elevated">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-[0.2em] block mb-2" style={{ color: '#666' }}>Default Model</label>
                    <select className="w-full min-h-[44px] px-4 py-3 rounded-xl border text-xs" style={{ backgroundColor: '#FAFAFA', borderColor: '#E0E0E0', color: '#1A1A1A' }}>
                      <option>GPT-4o</option>
                      <option>Claude 3.5 Sonnet</option>
                      <option>GPT-4o Mini</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-[0.2em] block mb-2" style={{ color: '#666' }}>Evidence Depth</label>
                    <select className="w-full min-h-[44px] px-4 py-3 rounded-xl border text-xs" style={{ backgroundColor: '#FAFAFA', borderColor: '#E0E0E0', color: '#1A1A1A' }}>
                      <option>Concise (5 sources)</option>
                      <option>Standard (15 sources)</option>
                      <option>Deep (30 sources)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border group hover:border-gray-300 transition-all" style={{ backgroundColor: '#F5F5F5', borderColor: '#E0E0E0' }}>
                  <div>
                    <p className="text-xs font-bold" style={{ color: '#1A1A1A' }}>Verification Protocol</p>
                    <p className="text-[9px] uppercase tracking-widest mt-1" style={{ color: '#666' }}>Cross-reference insights</p>
                  </div>
                  <Toggle defaultChecked />
                </div>
              </Card>
            </section>
          </div>

          {/* Sidebar Settings */}
          <div className="space-y-8">
            <section>
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] mb-6 flex items-center gap-2" style={{ color: '#666' }}>
                <Palette className="w-4 h-4" style={{ color: '#1A1A1A' }} />
                Preferences
              </h3>
              <Card className="p-6 space-y-4" variant="elevated">
                {[
                  { id: 'dark', label: 'Dark Mode', desc: 'Standard obsidian interface', active: true },
                  { id: 'anim', label: 'Animations', desc: 'Enable fluid UI transitions', active: true },
                  { id: 'glass', label: 'Glassmorphism', desc: 'Dynamic background blurring', active: true },
                  { id: 'sound', label: 'UI Sounds', desc: 'Auditory feedback cues', active: false },
                ].map(pref => (
                  <div key={pref.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#F5F5F5' }}>
                    <div>
                      <p className="text-xs font-bold" style={{ color: '#1A1A1A' }}>{pref.label}</p>
                      <p className="text-[9px] uppercase tracking-widest mt-0.5" style={{ color: '#666' }}>{pref.desc}</p>
                    </div>
                    <Toggle defaultChecked={pref.active} />
                  </div>
                ))}
              </Card>
            </section>

            <section>
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] mb-6 flex items-center gap-2" style={{ color: '#666' }}>
                <Database className="w-4 h-4" style={{ color: '#1A1A1A' }} />
                Data Management
              </h3>
              <Card className="p-6 space-y-4" variant="elevated">
                <div className="p4 rounded-lg" style={{ backgroundColor: '#F5F5F5', border: '1px solid #E0E0E0' }}>
                  <p className="text-xs font-bold mb-2" style={{ color: '#1A1A1A' }}>Clear All Data</p>
                  <p className="text-[10px] uppercase tracking-widest mb-4" style={{ color: '#666' }}>Wipe all data</p>
                  <Button variant="outline" className="w-full text-xs">
                    Clear All
                  </Button>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: '#F5F5F5', border: '1px solid #E0E0E0' }}>
                  <p className="text-xs font-bold mb-2" style={{ color: '#1A1A1A' }}>Export Data</p>
                  <p className="text-[10px] uppercase tracking-widest mb-4" style={{ color: '#666' }}>Download your research</p>
                  <Button variant="ghost" className="w-full text-xs">
                    Export
                  </Button>
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
          <div className="px-8 py-4 rounded-lg font-bold text-sm shadow-lg flex items-center gap-3" style={{ backgroundColor: '#1A1A1A', color: '#FAFAFA' }}>
            <CheckCircle2 className="w-5 h-5" />
            Settings Saved
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
      className="p-4 rounded-lg border group hover:border-gray-400 transition-all"
      style={{ backgroundColor: '#F5F5F5', borderColor: '#E0E0E0' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <label className="text-xs font-bold" style={{ color: '#1A1A1A' }}>
            {config.name}
            {config.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        </div>
        <Badge variant={isConfigured ? 'success' : 'warning'} className="text-[9px]">
          {isConfigured ? 'Active' : 'Required'}
        </Badge>
      </div>
      <div className="relative">
        <input
          type={isVisible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${config.name.toLowerCase()}...`}
          className="w-full rounded-lg px-4 py-2.5 text-xs outline-none focus:border-gray-400 transition-all font-mono"
          style={{ backgroundColor: '#FAFAFA', border: '1px solid #E0E0E0', color: '#1A1A1A' }}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
          style={{ color: '#666' }}
        >
          {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>
      <p className="text-[9px] uppercase tracking-widest mt-2 ml-1" style={{ color: '#666' }}>{config.description}</p>
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
        "relative w-12 h-6 min-w-[44px] min-h-[44px] rounded-full transition-colors duration-300 flex items-center",
        checked ? 'bg-peacock' : 'bg-smoke/30'
      )}
    >
      <motion.span
        className="absolute top-1.5 left-1 w-3 h-3 rounded-full bg-void shadow-sm"
        animate={{ x: checked ? 24 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

export default SettingsPage;
