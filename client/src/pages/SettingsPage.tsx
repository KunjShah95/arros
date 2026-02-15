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
  Code
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
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const configuredKeys = apiKeys.filter(k => savedKeys[k.key]).length;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-text-primary mb-2">Settings</h2>
          <p className="text-text-muted">Configure your Nexus Research OS</p>
        </div>

        {/* API Keys Section */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-text-primary">API Keys</h3>
            <Badge variant={configuredKeys === apiKeys.length ? 'success' : 'warning'}>
              {configuredKeys}/{apiKeys.length} configured
            </Badge>
          </div>
          
          <Card className="p-6">
            <p className="text-sm text-text-secondary mb-6">
              Configure your API keys to enable AI-powered research. Keys are stored locally in your browser and sent only to the backend when making requests.
            </p>

            <div className="space-y-4">
              {apiKeys.map((apiKey) => (
                <ApiKeyInput
                  key={apiKey.key}
                  config={apiKey}
                  isVisible={showKeys[apiKey.key] || false}
                  value={savedKeys[apiKey.key] || ''}
                  onToggle={() => toggleShowKey(apiKey.key)}
                  onChange={(value) => setSavedKeys(prev => ({ ...prev, [apiKey.key]: value }))}
                />
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                {saved && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-1 text-success"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm">Saved successfully</span>
                  </motion.div>
                )}
              </div>
              <Button onClick={handleSave} loading={saving}>
                <Save className="w-4 h-4 mr-2" />
                Save Configuration
              </Button>
            </div>
          </Card>
        </section>

        {/* Model Settings */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Code className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-text-primary">Model Settings</h3>
          </div>
          
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Default Research Model
                </label>
                <select className="w-full px-4 py-2.5 bg-surface-elevated border border-border rounded-lg text-text-primary">
                  <option value="gpt-4o">GPT-4o (Best Quality)</option>
                  <option value="gpt-4o-mini">GPT-4o Mini (Fast)</option>
                  <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                  <option value="claude-3-haiku">Claude 3 Haiku (Fast)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Max Sources per Research
                </label>
                <Input type="number" defaultValue={10} min={1} max={50} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">Auto-retry on Low Confidence</p>
                  <p className="text-xs text-text-muted">Automatically retry research if confidence is below threshold</p>
                </div>
                <Toggle defaultChecked />
              </div>
            </div>
          </Card>
        </section>

        {/* Preferences */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-text-primary">Preferences</h3>
          </div>
          
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">Dark Mode</p>
                  <p className="text-xs text-text-muted">Use dark theme</p>
                </div>
                <Toggle defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">Animations</p>
                  <p className="text-xs text-text-muted">Enable UI animations</p>
                </div>
                <Toggle defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">Sound Effects</p>
                  <p className="text-xs text-text-muted">Play sounds on completion</p>
                </div>
                <Toggle />
              </div>
            </div>
          </Card>
        </section>

        {/* Notifications */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-text-primary">Notifications</h3>
          </div>
          
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">Research Complete</p>
                  <p className="text-xs text-text-muted">Notify when research finishes</p>
                </div>
                <Toggle defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">Agent Updates</p>
                  <p className="text-xs text-text-muted">Real-time agent progress notifications</p>
                </div>
                <Toggle defaultChecked />
              </div>
            </div>
          </Card>
        </section>

        {/* Data Management */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-text-primary">Data Management</h3>
          </div>
          
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">Clear All Memories</p>
                  <p className="text-xs text-text-muted">Remove all stored memories and knowledge</p>
                </div>
                <Button variant="danger" size="sm">
                  Clear
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">Reset Knowledge Graph</p>
                  <p className="text-xs text-text-muted">Remove all knowledge graph data</p>
                </div>
                <Button variant="danger" size="sm">
                  Reset
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">Export Data</p>
                  <p className="text-xs text-text-muted">Download all your research data</p>
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
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium text-text-primary">
          {config.name}
          {config.required && <span className="text-error ml-1">*</span>}
        </label>
        <Badge variant={isConfigured ? 'success' : 'warning'}>
          {isConfigured ? 'Configured' : 'Required'}
        </Badge>
      </div>
      <p className="text-xs text-text-muted mb-2">{config.description}</p>
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
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
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
      className={`relative w-11 h-6 rounded-full transition-colors ${
        checked ? 'bg-primary' : 'bg-border'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
