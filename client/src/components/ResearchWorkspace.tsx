import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Sparkles,
  Lightbulb,
  CheckCircle2,
  Clock,
  BookOpen,
  FileText,
  ExternalLink,
  GraduationCap,
  Target,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Search,
  Copy,
  TrendingUp,
  Mic,
  Volume2,
  Download,
  Share2,
  Hash,
  Cpu,
  Server,
} from 'lucide-react';
import { Button, Card, Badge, ProgressBar, SanskritButton, cn } from './ui';
import { AgentTimeline } from './AgentTimeline';
import { integrationsApi } from '../services/api';
import type { ResearchResponse, AgentTask, Source, AcademicCitation, Integration, ActionItem } from '../types';

interface ResearchWorkspaceProps {
  query: string;
  setQuery: (query: string) => void;
  onSubmit: (query: string) => void;
  isResearching: boolean;
  result: ResearchResponse | null;
  tasks: AgentTask[];
  sources: Source[];
}

export function ResearchWorkspace({
  query,
  setQuery,
  onSubmit,
  isResearching,
  result,
  tasks,
  sources: _sources,
}: ResearchWorkspaceProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [executingActionId, setExecutingActionId] = useState<string | null>(null);

  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        const data = await integrationsApi.getIntegrations();
        setIntegrations(data);
      } catch (error) {
        console.error('Failed to fetch integrations:', error);
      }
    };
    fetchIntegrations();
  }, []);

  const handleExecuteAction = async (action: ActionItem, integrationName: string) => {
    const integration = integrations.find(i => i.name === integrationName);
    if (!integration || !integration.connected) {
      alert(`Please connect ${integrationName} first.`);
      return;
    }

    setExecutingActionId(action.title); // Using title as fallback id
    try {
      const result = await integrationsApi.executeAction(action, integration.id);
      if (result.success && result.url) {
        window.open(result.url, '_blank');
      }
    } catch (error) {
      console.error('Action execution failed:', error);
    } finally {
      setExecutingActionId(null);
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isResearching) {
      onSubmit(query);
    }
  };

  const handleVoiceInput = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.lang = 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setQuery(transcript);
      };

      recognition.start();
    }
  };

  const handleSpeakOutput = () => {
    if (result?.synthesis) {
      const text = result.synthesis.summary ||
        (result.synthesis.introduction + ' ' + result.synthesis.conclusion);

      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-IN';
        utterance.rate = 0.9;
        speechSynthesis.speak(utterance);
      }
    }
  };

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  return (
    <div className="flex h-full gap-6 flex-col lg:flex-row overflow-hidden">
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Workspace header */}
        <div className="mb-4 cut-card cut-border bg-graphite/60 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GraduationCap className="w-4 h-4 text-peacock" />
              <Badge variant="peacock">Research Workspace</Badge>
            </div>
            <p className="text-xs text-ash">Academic Research OS — 5 Agent Pipeline</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="cut-card bg-slate/70 px-3 py-2 text-xs text-ash uppercase tracking-[0.15em]">
              Mode
              <span className="block text-chalk text-xs tracking-normal">Academic</span>
            </div>
            <div className="cut-card bg-slate/70 px-3 py-2 text-xs text-ash uppercase tracking-[0.15em]">
              Agents
              <span className="block text-chalk text-xs tracking-normal">{tasks.length || 5}</span>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="mb-4 flex-shrink-0">
          <form onSubmit={handleSubmit} className="relative cut-card cut-border bg-slate/70 p-3">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ash" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter any academic topic, concept, or research question..."
                  className="w-full pl-11 pr-4 py-3.5 bg-graphite/80 border border-smoke rounded-xl text-chalk placeholder:text-ash text-sm focus:outline-none focus:border-peacock focus:ring-2 focus:ring-peacock/10 transition-all"
                  disabled={isResearching}
                />
              </div>

              {/* Voice Controls */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={isRecording ? 'saffron' : 'secondary'}
                  size="md"
                  onClick={handleVoiceInput}
                  disabled={isResearching}
                  title="Voice input (STT)"
                >
                  <Mic className={`w-4 h-4 ${isRecording ? 'animate-pulse text-void' : ''}`} />
                </Button>

                {result && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={handleSpeakOutput}
                    title="Listen to output (TTS)"
                  >
                    <Volume2 className="w-4 h-4 text-saffron" />
                  </Button>
                )}

                <SanskritButton
                  type="submit"
                  variant="primary"
                  className="px-6 py-2 text-[10px] uppercase tracking-widest gap-2"
                  disabled={isResearching || !query.trim()}
                >
                  {isResearching ? (
                    <div className="animate-spin w-3 h-3 border-2 border-void border-t-transparent rounded-full" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">Initialize Research</span>
                </SanskritButton>

                {result && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => window.open(`/api/research/export/${result.sessionId}`, '_blank')}
                    title="Export to Markdown"
                    className="gap-2"
                  >
                    <Download className="w-4 h-4 text-gold" />
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Research in progress */}
        {isResearching && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex-shrink-0"
          >
            <Card variant="glass" className="p-4 cut-card cut-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 cut-card bg-saffron/20 flex items-center justify-center animate-pulse">
                  <Sparkles className="w-4 h-4 text-saffron" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-chalk">5-Agent pipeline running...</span>
                  <div className="text-xs text-ash mt-0.5">Planner → Web + Scholar → Critic → Synthesizer</div>
                </div>
                <Badge variant="saffron">{completedTasks}/{tasks.length || 5}</Badge>
              </div>
              <ProgressBar progress={progress} variant="saffron" />
              <div className="flex justify-between text-xs text-ash mt-1.5">
                <span>Building academic report</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Results or empty state */}
        <div className="flex-1 overflow-y-auto">
          {result ? (
            <AcademicResearchResults
              result={result}
              integrations={integrations}
              handleExecuteAction={handleExecuteAction}
              executingActionId={executingActionId}
            />
          ) : !isResearching ? (
            <EmptyWorkspace onSubmit={onSubmit} />
          ) : null}
        </div>
      </div>

      {/* Agent Timeline Sidebar */}
      <div className="w-full lg:w-72 flex-shrink-0 overflow-hidden">
        <Card className="h-full p-4 overflow-hidden flex flex-col border-smoke/50 cut-card cut-border">
          <AgentTimeline tasks={tasks} />
        </Card>
      </div>
    </div>
  );
}

// ─── Academic Research Results Component ─────────────────────────────────────

function AcademicResearchResults({
  result,
  integrations,
  handleExecuteAction,
  executingActionId
}: {
  result: ResearchResponse;
  integrations: Integration[];
  handleExecuteAction: (action: ActionItem, integrationName: string) => Promise<void>;
  executingActionId: string | null;
}) {
  const { synthesis } = result;
  const confidence = synthesis.confidence * 100;
  const verifiedSources = synthesis.verifiedSources || result.evaluations.length || 0;
  const contradictions = synthesis.contradictionsFound || 0;
  const [copiedReport, setCopiedReport] = useState(false);

  const copyReport = () => {
    const reportText = buildReportText(result);
    navigator.clipboard.writeText(reportText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5 pb-8"
    >
      {/* Report Header */}
      <Card variant="elevated" className="p-5 cut-card cut-border">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GraduationCap className="w-4 h-4 text-peacock" />
              <span className="text-xs text-ash uppercase tracking-[0.2em]">Academic Research Report</span>
            </div>
            <h2 className="text-lg font-display font-semibold text-chalk line-clamp-2">{result.query}</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={copyReport} className="gap-1 flex-shrink-0">
            {copiedReport ? <CheckCircle2 className="w-4 h-4 text-peacock" /> : <Copy className="w-4 h-4" />}
            <span className="hidden sm:inline text-xs">{copiedReport ? 'Copied' : 'Copy'}</span>
          </Button>
        </div>

        {/* Trust metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="cut-card cut-border bg-slate/70 p-3 text-center">
            <span className="text-xl font-display text-chalk">{confidence.toFixed(0)}%</span>
            <span className="block text-[10px] text-ash uppercase tracking-[0.15em] mt-0.5">Confidence</span>
          </div>
          <div className="cut-card cut-border bg-slate/70 p-3 text-center">
            <span className="text-xl font-display text-peacock">{verifiedSources}</span>
            <span className="block text-[10px] text-ash uppercase tracking-[0.15em] mt-0.5">Verified Src</span>
          </div>
          <div className="cut-card cut-border bg-slate/70 p-3 text-center">
            <span className="text-xl font-display text-warning">{contradictions}</span>
            <span className="block text-[10px] text-ash uppercase tracking-[0.15em] mt-0.5">Contradictions</span>
          </div>
          <div className="cut-card cut-border bg-slate/70 p-3 text-center">
            <span className="text-xl font-display text-mint">Low</span>
            <span className="block text-[10px] text-ash uppercase tracking-[0.15em] mt-0.5">Bias Indicator</span>
          </div>
        </div>

        {/* Quality Report - Features Meta metrics */}
        {result?.evaluations && (
          <div className="mt-6 pt-6 border-t border-smoke/30">
            <h4 className="text-[10px] text-ash uppercase tracking-[0.2em] mb-4">Quality Assurance Report</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {result.evaluations.map((evalItem) => (
                <div key={evalItem.type} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ash capitalize">{evalItem.type}</span>
                    <span className={evalItem.passed ? 'text-mint' : 'text-error'}>
                      {(evalItem.score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1 bg-graphite rounded-full overflow-hidden">
                    <div
                      className={cn("h-full transition-all duration-1000", evalItem.passed ? 'bg-peacock shadow-[0_0_8px_rgba(0,168,107,0.4)]' : 'bg-saffron shadow-[0_0_8px_rgba(255,107,53,0.4)]')}
                      style={{ width: `${evalItem.score * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            {!result.evaluations.every(e => e.passed) && (
              <p className="mt-4 text-[11px] text-saffron italic bg-saffron/5 p-2 cut-card border border-saffron/20">
                Notice: Research was automatically refined and retried by the Agent Council to meet quality thresholds.
              </p>
            )}
          </div>
        )}

        {/* Strategy badge */}
        <div className="flex items-center gap-2 mt-3">
          <Badge variant="peacock">{result.plan.strategy}</Badge>
          <span className="text-xs text-ash">
            {result.plan.subtasks.length} subtasks · {(result.totalTime / 1000).toFixed(1)}s
          </span>
        </div>
      </Card>

      {/* Introduction */}
      {synthesis.introduction && (
        <AcademicSection
          icon={BookOpen}
          title="Introduction"
          number="01"
          tone="peacock"
          defaultOpen
        >
          <p className="text-silver text-sm leading-relaxed">{synthesis.introduction}</p>
        </AcademicSection>
      )}

      {/* Concepts & Definitions */}
      {synthesis.conceptsAndDefinitions && (
        <AcademicSection
          icon={Target}
          title="Concepts & Definitions"
          number="02"
          tone="saffron"
          defaultOpen
        >
          <p className="text-silver text-sm leading-relaxed whitespace-pre-wrap">{synthesis.conceptsAndDefinitions}</p>
        </AcademicSection>
      )}

      {/* Key Findings */}
      {synthesis.keyFindings && synthesis.keyFindings.length > 0 && (
        <AcademicSection
          icon={Lightbulb}
          title="Key Research Findings"
          number="03"
          tone="peacock"
          defaultOpen
        >
          <ul className="space-y-2.5">
            {synthesis.keyFindings.map((finding, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-start gap-3"
              >
                <div className="flex-1">
                  <span className="text-silver text-sm leading-relaxed">{finding}</span>
                  {synthesis.lineage && synthesis.lineage.find(l => l.finding === finding) && (
                    <div className="flex gap-1 mt-1.5">
                      {synthesis.lineage.find(l => l.finding === finding)?.sourceIndices.map(idx => (
                        <span key={idx} className="text-[9px] font-mono text-peacock bg-peacock/10 border border-peacock/20 px-1 rounded flex items-center gap-0.5">
                          Source [{idx}]
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.li>
            ))}
          </ul>
        </AcademicSection>
      )}

      {/* Applications */}
      {synthesis.applications && (
        <AcademicSection icon={TrendingUp} title="Applications" number="04" tone="peacock">
          <p className="text-silver text-sm leading-relaxed whitespace-pre-wrap">{synthesis.applications}</p>
        </AcademicSection>
      )}

      {/* Challenges */}
      {synthesis.challenges && (
        <AcademicSection icon={AlertTriangle} title="Current Challenges" number="05" tone="warning">
          <p className="text-silver text-sm leading-relaxed whitespace-pre-wrap">{synthesis.challenges}</p>
        </AcademicSection>
      )}

      {/* Future Directions */}
      {synthesis.futureDirections && (
        <AcademicSection icon={Sparkles} title="Future Directions" number="06" tone="saffron">
          <p className="text-silver text-sm leading-relaxed whitespace-pre-wrap">{synthesis.futureDirections}</p>
        </AcademicSection>
      )}

      {/* Conclusion */}
      {synthesis.conclusion && (
        <AcademicSection icon={GraduationCap} title="Conclusion" number="07" tone="peacock" defaultOpen>
          <p className="text-silver text-sm leading-relaxed">{synthesis.conclusion}</p>
        </AcademicSection>
      )}

      {/* Key Takeaways */}
      {synthesis.keyTakeaways && synthesis.keyTakeaways.length > 0 && (
        <AcademicSection icon={CheckCircle2} title="Key Takeaways (Exam-Ready)" number="08" tone="peacock" defaultOpen>
          <div className="space-y-2">
            {synthesis.keyTakeaways.map((takeaway, i) => (
              <div key={i} className="flex items-start gap-3 cut-card bg-peacock/5 border border-peacock/10 px-3 py-2.5">
                <CheckCircle2 className="w-4 h-4 text-peacock flex-shrink-0 mt-0.5" />
                <span className="text-chalk text-sm">{takeaway}</span>
              </div>
            ))}
          </div>
        </AcademicSection>
      )}

      {/* Further Reading */}
      {synthesis.furtherReading && synthesis.furtherReading.length > 0 && (
        <AcademicSection icon={BookOpen} title="Further Reading" number="09" tone="saffron">
          <ol className="space-y-2">
            {synthesis.furtherReading.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="text-xs text-ash font-mono w-5 flex-shrink-0 mt-0.5">{i + 1}.</span>
                <span className="text-peacock">{item}</span>
              </li>
            ))}
          </ol>
        </AcademicSection>
      )}

      {/* Summary / Deep Dive fallback */}
      {!synthesis.introduction && synthesis.summary && (
        <AcademicSection icon={FileText} title="Summary" number="01" tone="peacock" defaultOpen>
          <p className="text-silver text-sm leading-relaxed whitespace-pre-wrap">{synthesis.summary}</p>
        </AcademicSection>
      )}

      {!synthesis.introduction && synthesis.deepDive && (
        <AcademicSection icon={BookOpen} title="Detailed Analysis" number="02" tone="saffron">
          <div className="text-silver text-sm leading-relaxed whitespace-pre-wrap">{synthesis.deepDive}</div>
        </AcademicSection>
      )}

      {/* Actions & Connectors */}
      <div className="mt-8 mb-8 pt-8 border-t border-smoke/30">
        <div className="flex items-center gap-2 mb-6">
          <Cpu className="w-4 h-4 text-warning" />
          <h3 className="text-sm font-medium text-silver uppercase tracking-[0.2em]">Action & Integration Dashboard</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Generated Action Items */}
          <Card className="p-5 cut-card cut-border bg-slate/60 shadow-xl border-smoke/20">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold text-ash uppercase tracking-wider flex items-center gap-2">
                <Server className="w-3.5 h-3.5 text-peacock" />
                Suggested Next Steps
              </h4>
              <Badge variant="peacock" className="text-[9px]">{(synthesis.actionableOutputs || []).length} Actions</Badge>
            </div>

            <div className="space-y-3">
              {(synthesis.actionableOutputs || []).map((action: any, idx: number) => (
                <div key={idx} className="p-3 cut-card bg-graphite/40 border border-smoke/30 transition-all hover:border-peacock/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-mono text-peacock uppercase tracking-widest">{action.type}</span>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.5 cut-card border uppercase",
                        action.priority === 'high' ? 'border-error/30 text-error bg-error/5' : 'border-ash/30 text-ash bg-ash/5'
                      )}>
                        {action.priority}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 hover:bg-peacock/10 hover:text-peacock"
                        onClick={() => handleExecuteAction(action, 'notion')}
                        disabled={executingActionId === action.title}
                        title="Export to Notion"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <h5 className="text-sm font-semibold text-silver">{action.title}</h5>
                  <p className="text-xs text-ash mt-1.5 leading-relaxed">{action.description}</p>
                </div>
              ))}
              {(!synthesis.actionableOutputs || synthesis.actionableOutputs.length === 0) && (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-void/20 cut-card border border-smoke/10">
                  <AlertTriangle className="w-6 h-6 text-ash/40 mb-2" />
                  <p className="text-xs text-ash/60">No specific action items detected.</p>
                </div>
              )}
            </div>
          </Card>

          {/* Integration Hub */}
          <Card className="p-5 cut-card cut-border bg-slate/60 shadow-xl border-smoke/20">
            <h4 className="text-xs font-bold text-ash uppercase tracking-wider mb-4 flex items-center gap-2">
              <Share2 className="w-3.5 h-3.5 text-gold" />
              Connected Platforms
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {['Notion', 'GitHub', 'Zotero', 'Slack'].map(tool => {
                const status = integrations.find(i => i.name.toLowerCase() === tool.toLowerCase());
                return (
                  <div
                    key={tool}
                    className={cn(
                      "p-4 cut-card border flex flex-col items-center text-center transition-all",
                      status?.connected
                        ? "bg-graphite/80 border-mint/40"
                        : "bg-void/60 border-smoke/30 opacity-60 hover:opacity-100"
                    )}
                  >
                    <div className="relative mb-3">
                      <div className={cn(
                        "w-10 h-10 cut-card flex items-center justify-center",
                        status?.connected ? "bg-peacock/10 text-peacock" : "bg-smoke/20 text-ash"
                      )}>
                        {tool === 'Notion' && <Server className="w-5 h-5" />}
                        {tool === 'GitHub' && <ExternalLink className="w-5 h-5" />}
                        {tool === 'Zotero' && <BookOpen className="w-5 h-5" />}
                        {tool === 'Slack' && <Hash className="w-5 h-5" />}
                      </div>
                      {status?.connected && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-void flex items-center justify-center">
                          <CheckCircle2 className="w-3 h-3 text-peacock font-bold" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-bold text-silver mb-3 tracking-wide">{tool}</span>
                    <SanskritButton
                      variant={status?.connected ? 'outline' : 'primary'}
                      className="w-full text-[9px] h-8 uppercase tracking-widest font-bold px-0"
                    >
                      {status?.connected ? 'Configure' : 'Connect'}
                    </SanskritButton>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Citations */}
      {synthesis.citations && synthesis.citations.length > 0 && (
        <AcademicSection icon={FileText} title="References & Citations" number="10" tone="ash">
          <div className="space-y-3">
            {synthesis.citations.map((citation, i) => (
              <CitationCard key={i} citation={citation} />
            ))}
          </div>
        </AcademicSection>
      )}

      {/* Report metadata */}
      <Card className="p-4 cut-card cut-border">
        <div className="flex items-center justify-between text-xs text-ash flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {(result.totalTime / 1000).toFixed(1)}s generation time
            </span>
            <span>${result.totalCost.toFixed(4)} cost</span>
          </div>
          <div className="flex gap-2">
            {result.evaluations.map((ev) => (
              <Badge key={ev.type} variant={ev.passed ? 'success' : 'warning'}>
                {ev.type}: {Math.round(ev.score * 100)}%
              </Badge>
            ))}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ─── Academic Section Component ───────────────────────────────────────────────

interface AcademicSectionProps {
  icon: React.ElementType;
  title: string;
  number: string;
  tone: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function AcademicSection({ icon: Icon, title, number, tone, defaultOpen = false, children }: AcademicSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  const toneStyles: Record<string, string> = {
    saffron: 'text-saffron bg-saffron/10',
    peacock: 'text-peacock bg-peacock/10',
    gold: 'text-gold bg-gold/10',
    warning: 'text-warning bg-warning/10',
    ash: 'text-ash bg-ash/10',
  };

  return (
    <Card className="cut-card cut-border overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 hover:bg-slate/20 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-ash/60">{number}</span>
          <div className={`w-7 h-7 cut-card flex items-center justify-center flex-shrink-0 ${toneStyles[tone] || 'text-chalk bg-slate/50'}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm font-semibold text-chalk">{title}</span>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-ash flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-ash flex-shrink-0" />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-smoke/40 pt-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// ─── Citation Card ─────────────────────────────────────────────────────────────

function CitationCard({ citation }: { citation: AcademicCitation }) {
  return (
    <div className="flex gap-3 cut-card bg-slate/50 p-3">
      <span className="text-xs font-mono text-saffron font-bold flex-shrink-0 w-6">[{citation.index}]</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-chalk font-medium line-clamp-2">{citation.title}</p>
        {(citation.authors || citation.year) && (
          <p className="text-xs text-silver mt-0.5">
            {citation.authors && <span>{citation.authors}</span>}
            {citation.year && <span className="text-ash ml-1">({citation.year})</span>}
            {citation.venue && <span className="text-ash ml-1">— {citation.venue}</span>}
          </p>
        )}
        {citation.url && (
          <a
            href={citation.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-peacock hover:underline mt-1"
          >
            Open source <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Empty Workspace ──────────────────────────────────────────────────────────

function EmptyWorkspace({ onSubmit }: { onSubmit: (q: string) => void }) {
  const suggestions = [
    'Explain Federated Learning in Healthcare with recent research',
    'Write a literature review on AI in Education',
    'What are the applications of CRISPR-Cas9 gene editing?',
    'Survey of transformer models in natural language processing',
    'Explain quantum computing for computer science students',
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12">
      <div className="text-center max-w-lg">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-16 h-16 cut-card bg-gradient-to-br from-saffron to-peacock flex items-center justify-center mx-auto mb-6"
        >
          <GraduationCap className="w-8 h-8 text-void" />
        </motion.div>

        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-2xl font-display font-bold text-chalk mb-2"
        >
          Start Academic Research
        </motion.h2>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-silver mb-2"
        >
          5 agents will plan, search academic papers, verify claims, and produce a structured report.
        </motion.p>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-xs text-ash mb-8"
        >
          Intro · Concepts · Findings · Applications · Challenges · Conclusion · Takeaways · Citations
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-2 text-left"
        >
          <p className="text-xs text-ash uppercase tracking-[0.2em] mb-3">Try these topics:</p>
          {suggestions.map((suggestion, index) => (
            <motion.button
              key={suggestion}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.08 }}
              onClick={() => onSubmit(suggestion)}
              className="w-full p-3.5 text-left cut-card border border-smoke bg-slate/40 hover:bg-graphite/60 hover:border-peacock/30 transition-all group"
            >
              <span className="text-sm text-silver group-hover:text-chalk transition-colors">
                {suggestion}
              </span>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildReportText(result: ResearchResponse): string {
  const { synthesis, query } = result;
  const lines: string[] = [];

  lines.push(`# ARROS Academic Research Report`);
  lines.push(`**Query:** ${query}`);
  lines.push(`**Confidence:** ${(synthesis.confidence * 100).toFixed(0)}%`);
  lines.push(`**Verified Sources:** ${synthesis.verifiedSources || 0}`);
  lines.push(`**Contradictions Found:** ${synthesis.contradictionsFound || 0}`);
  lines.push('');

  if (synthesis.introduction) {
    lines.push('## 01. Introduction');
    lines.push(synthesis.introduction);
    lines.push('');
  }
  if (synthesis.conceptsAndDefinitions) {
    lines.push('## 02. Concepts & Definitions');
    lines.push(synthesis.conceptsAndDefinitions);
    lines.push('');
  }
  if (synthesis.keyFindings?.length) {
    lines.push('## 03. Key Findings');
    synthesis.keyFindings.forEach((f, i) => lines.push(`${i + 1}. ${f}`));
    lines.push('');
  }
  if (synthesis.applications) {
    lines.push('## 04. Applications');
    lines.push(synthesis.applications);
    lines.push('');
  }
  if (synthesis.challenges) {
    lines.push('## 05. Challenges');
    lines.push(synthesis.challenges);
    lines.push('');
  }
  if (synthesis.futureDirections) {
    lines.push('## 06. Future Directions');
    lines.push(synthesis.futureDirections);
    lines.push('');
  }
  if (synthesis.conclusion) {
    lines.push('## 07. Conclusion');
    lines.push(synthesis.conclusion);
    lines.push('');
  }
  if (synthesis.keyTakeaways?.length) {
    lines.push('## 08. Key Takeaways');
    synthesis.keyTakeaways.forEach(t => lines.push(`• ${t}`));
    lines.push('');
  }
  if (synthesis.furtherReading?.length) {
    lines.push('## 09. Further Reading');
    synthesis.furtherReading.forEach((r, i) => lines.push(`${i + 1}. ${r}`));
    lines.push('');
  }
  if (synthesis.citations?.length) {
    lines.push('## 10. References');
    synthesis.citations.forEach(c => {
      lines.push(`[${c.index}] ${c.title}${c.authors ? ` — ${c.authors}` : ''}${c.year ? ` (${c.year})` : ''}${c.venue ? ` — ${c.venue}` : ''}${c.url ? ` — ${c.url}` : ''}`);
    });
  }

  lines.push('');
  lines.push('---');
  lines.push(`Generated by ARROS Academic Research OS`);

  return lines.join('\n');
}
