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
} from 'lucide-react';
import { Card, Button, Input, Badge } from '../components/ui';

interface ApiKeyConfig {
  name: string;
  key: string;
  description: string;
  required: boolean;
}

const apiKeys: ApiKeyConfig[] = [
  {
    name: 'OpenAI API Key',
    key: 'OPENAI_API_KEY',
    description: 'For GPT-4 and GPT-4o models',
    required: true,
  },
  {
    name: 'Anthropic API Key',
    key: 'ANTHROPIC_API_KEY',
    description: 'For Claude models',
    required: false,
  },
  {
    name: 'Serper API Key',
    key: 'SERPER_API_KEY',
    description: 'Google search results',
    required: true,
  },
  {
    name: 'Tavily API Key',
    key: 'TAVILY_API_KEY',
    description: 'AI-optimized search',
    required: false,
  },
  {
    name: 'Firecrawl API Key',
    key: 'FIRECRAWL_API_KEY',
    description: 'Web scraping and crawling',
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
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const configuredKeys = apiKeys.filter((k) => savedKeys[k.key]).length;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <div className="cut-card cut-border bg-graphite/60 p-5 mb-8">
          <Badge variant="flame" className="mb-2">Settings</Badge>
          <h2 className="text-2xl font-display text-chalk">System Configuration</h2>
          <p className="text-sm text-ash">Tune your research engine and platform preferences.</p>
        </div>

        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-flame" />
            <h3 className="text-lg font-semibold text-chalk">API Keys</h3>
            <Badge variant={configuredKeys === apiKeys.length ? 'success' : 'warning'}>
              {configuredKeys}/{apiKeys.length} configured
            </Badge>
          </div>

          <Card className="p-6 cut-card cut-border">
            <p className="text-sm text-ash mb-6">
              Keys are stored locally in your browser and only sent to the backend when required.
            </p>

            <div className="space-y-4">
              {apiKeys.map((apiKey) => (
                <ApiKeyInput
                  key={apiKey.key}
                  config={apiKey}
                  isVisible={showKeys[apiKey.key] || false}
                  value={savedKeys[apiKey.key] || ''}
                  onToggle={() => toggleShowKey(apiKey.key)}
                  onChange={(value) => setSavedKeys((prev) => ({ ...prev, [apiKey.key]: value }))}
                />
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-smoke flex items-center justify-between">
              <div className="flex items-center gap-2">
                {saved && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-1 text-mint"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm">Saved successfully</span>
                  </motion.div>
                )}
              </div>
              <Button onClick={handleSave} loading={saving}>
                <Save className="w-4 h-4 mr-2" />
                Save configuration
              </Button>
            </div>
          </Card>
        </section>

        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Code className="w-5 h-5 text-electric" />
            <h3 className="text-lg font-semibold text-chalk">Model Settings</h3>
          </div>

          <Card className="p-6 cut-card cut-border">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-silver mb-2">Default Research Model</label>
                <select className="w-full px-4 py-2.5 bg-graphite border border-smoke rounded-lg text-chalk">
                  <option value="gpt-4o">GPT-4o (Best Quality)</option>
                  <option value="gpt-4o-mini">GPT-4o Mini (Fast)</option>
                  <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                  <option value="claude-3-haiku">Claude 3 Haiku (Fast)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-silver mb-2">Max Sources per Research</label>
                <Input type="number" defaultValue={10} min={1} max={50} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-chalk">Auto-retry on Low Confidence</p>
                  <p className="text-xs text-ash">Automatically retry research if confidence is below threshold</p>
                </div>
                <Toggle defaultChecked />
              </div>
            </div>
          </Card>
        </section>

        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-mint" />
            <h3 className="text-lg font-semibold text-chalk">Preferences</h3>
          </div>

          <Card className="p-6 cut-card cut-border">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-chalk">Dark Mode</p>
                  <p className="text-xs text-ash">Use the Nexus dark palette</p>
                </div>
                <Toggle defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-chalk">Animations</p>
                  <p className="text-xs text-ash">Enable UI motion and transitions</p>
                </div>
                <Toggle defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-chalk">Sound Effects</p>
                  <p className="text-xs text-ash">Play sounds on completion</p>
                </div>
                <Toggle />
              </div>
            </div>
          </Card>
        </section>

        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-flame" />
            <h3 className="text-lg font-semibold text-chalk">Notifications</h3>
          </div>

          <Card className="p-6 cut-card cut-border">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-chalk">Research Complete</p>
                  <p className="text-xs text-ash">Notify when research finishes</p>
                </div>
                <Toggle defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-chalk">Agent Updates</p>
                  <p className="text-xs text-ash">Real-time agent progress notifications</p>
                </div>
                <Toggle defaultChecked />
              </div>
            </div>
          </Card>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-electric" />
            <h3 className="text-lg font-semibold text-chalk">Data Management</h3>
          </div>

          <Card className="p-6 cut-card cut-border">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-chalk">Clear All Memories</p>
                  <p className="text-xs text-ash">Remove all stored memories and knowledge</p>
                </div>
                <Button variant="danger" size="sm">
                  Clear
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-chalk">Reset Knowledge Graph</p>
                  <p className="text-xs text-ash">Remove all knowledge graph data</p>
                </div>
                <Button variant="danger" size="sm">
                  Reset
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-chalk">Export Data</p>
                  <p className="text-xs text-ash">Download all your research data</p>
                </div>
                <Button variant="secondary" size="sm">
                  Export
                </Button>
              </div>
            </div>
          </Card>
        </section>
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
}: {
  config: ApiKeyConfig;
  isVisible: boolean;
  value: string;
  onToggle: () => void;
  onChange: (value: string) => void;
}) {
  const isConfigured = value.length > 0;

  return (
    <div className="cut-card cut-border bg-slate/60 p-4">
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium text-chalk">
          {config.name}
          {config.required && <span className="text-error ml-1">*</span>}
        </label>
        <Badge variant={isConfigured ? 'success' : 'warning'}>
          {isConfigured ? 'Configured' : 'Required'}
        </Badge>
      </div>
      <p className="text-xs text-ash mb-2">{config.description}</p>
      <div className="relative">
        <Input
          type={isVisible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter your ${config.name.toLowerCase()}`}
          className="pr-10"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ash hover:text-chalk"
        >
          {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function Toggle({ defaultChecked = false }: { defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <button
      type="button"
      onClick={() => setChecked(!checked)}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        checked ? 'bg-flame' : 'bg-smoke'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-chalk transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
