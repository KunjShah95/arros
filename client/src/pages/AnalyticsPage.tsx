import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Search,
  CheckCircle2,
  AlertCircle,
  Activity,
  Brain,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Database,
} from 'lucide-react';
import { Card, Button, Badge } from '../components/ui';

const stats = [
  {
    label: 'Total Research',
    value: '247',
    change: '+12%',
    trend: 'up',
    icon: Search,
    color: 'flame',
  },
  {
    label: 'Hours Saved',
    value: '48.5',
    change: '+23%',
    trend: 'up',
    icon: Clock,
    color: 'electric',
  },
  {
    label: 'Sources Verified',
    value: '1,842',
    change: '+8%',
    trend: 'up',
    icon: Database,
    color: 'mint',
  },
  {
    label: 'Accuracy Rate',
    value: '94.2%',
    change: '+2.1%',
    trend: 'up',
    icon: Target,
    color: 'flame',
  },
];

const weeklyData = [
  { day: 'Mon', research: 12, sources: 48, time: 2.4 },
  { day: 'Tue', research: 18, sources: 72, time: 3.2 },
  { day: 'Wed', research: 15, sources: 60, time: 2.8 },
  { day: 'Thu', research: 22, sources: 88, time: 4.1 },
  { day: 'Fri', research: 28, sources: 112, time: 5.2 },
  { day: 'Sat', research: 8, sources: 32, time: 1.5 },
  { day: 'Sun', research: 6, sources: 24, time: 1.1 },
];

const topTopics = [
  { topic: 'Machine Learning', count: 42, growth: '+15%' },
  { topic: 'React vs Vue', count: 28, growth: '+8%' },
  { topic: 'API Design', count: 24, growth: '+12%' },
  { topic: 'Database Optimization', count: 19, growth: '+5%' },
  { topic: 'System Architecture', count: 17, growth: '+22%' },
];

const agentPerformance = [
  { agent: 'Research', success: 98, avgTime: '1.2s', calls: 1247 },
  { agent: 'Critic', success: 94, avgTime: '0.8s', calls: 892 },
  { agent: 'Synthesizer', success: 96, avgTime: '2.1s', calls: 856 },
  { agent: 'Memory', success: 99, avgTime: '0.3s', calls: 1247 },
];

const recentActivity = [
  { type: 'research', title: 'Compare React vs Vue', time: '2 min ago', status: 'completed' },
  { type: 'source', title: 'Added 15 new sources', time: '5 min ago', status: 'completed' },
  { type: 'graph', title: 'Knowledge graph updated', time: '12 min ago', status: 'completed' },
  { type: 'research', title: 'GPT-4 Architecture analysis', time: '1 hour ago', status: 'completed' },
  { type: 'error', title: 'API rate limit reached', time: '2 hours ago', status: 'warning' },
];

const timeRanges = [
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: '90d', label: '90 days' },
  { id: 'all', label: 'All time' },
];

export function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d');

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: '#FAFAFA' }}>
      <div className="rounded-xl p-5 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4" style={{ backgroundColor: '#F5F5F5' }}>
        <div>
          <Badge variant="neutral" className="mb-2">Analytics</Badge>
          <h2 className="text-2xl font-semibold" style={{ color: '#1A1A1A' }}>Performance Studio</h2>
          <p className="text-sm" style={{ color: '#666' }}>Track velocity, accuracy, and agent efficiency.</p>
        </div>

        <div className="flex items-center gap-2">
          {timeRanges.map((range) => (
            <Button
              key={range.id}
              variant={timeRange === range.id ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange(range.id)}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-4 cut-card cut-border">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 cut-card bg-${stat.color}/10 flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}`} />
                </div>
                <div className={`flex items-center gap-1 text-xs ${
                  stat.trend === 'up' ? 'text-mint' : 'text-error'
                }`}>
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {stat.change}
                </div>
              </div>
              <p className="text-2xl font-display text-chalk mb-1">{stat.value}</p>
              <p className="text-sm text-ash">{stat.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2 p-6 cut-card cut-border">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-flame" />
              <h3 className="font-semibold text-chalk">Research Activity</h3>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-flame" />
                <span className="text-ash">Research</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-electric" />
                <span className="text-ash">Sources</span>
              </div>
            </div>
          </div>

          <div className="h-48 flex items-end gap-2">
            {weeklyData.map((day, index) => (
              <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(day.research / 30) * 100}%` }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="w-full bg-gradient-to-t from-flame to-flame-glow cut-card relative group"
                  style={{ minHeight: '20px' }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-graphite rounded text-xs text-chalk opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {day.research} research
                  </div>
                </motion.div>
                <span className="text-xs text-ash">{day.day}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 cut-card cut-border">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-electric" />
            <h3 className="font-semibold text-chalk">Top Topics</h3>
          </div>

          <div className="space-y-3">
            {topTopics.map((topic, index) => (
              <div key={topic.topic} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-chalk">{topic.topic}</span>
                    <span className="text-xs text-mint">{topic.growth}</span>
                  </div>
                  <div className="h-1.5 bg-slate rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(topic.count / 50) * 100}%` }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-electric to-electric-dim rounded-full"
                    />
                  </div>
                </div>
                <span className="text-sm text-ash w-8 text-right">{topic.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-6 cut-card cut-border">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-mint" />
            <h3 className="font-semibold text-chalk">Agent Performance</h3>
          </div>

          <div className="space-y-3">
            {agentPerformance.map((agent) => (
              <div key={agent.agent} className="flex items-center gap-4 p-3 cut-card bg-slate/60">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-chalk">{agent.agent}</span>
                    <span className="text-xs text-mint">{agent.success}%</span>
                  </div>
                  <div className="h-1.5 bg-graphite rounded-full overflow-hidden">
                    <div
                      className="h-full bg-mint rounded-full"
                      style={{ width: `${agent.success}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-ash">{agent.avgTime}</p>
                  <p className="text-xs text-ash">{agent.calls.toLocaleString()} calls</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 cut-card cut-border">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-flame" />
            <h3 className="font-semibold text-chalk">Recent Activity</h3>
          </div>

          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 cut-card bg-slate/60"
              >
                <div className={`w-8 h-8 cut-card flex items-center justify-center ${
                  activity.status === 'completed'
                    ? 'bg-mint/10'
                    : activity.status === 'warning'
                    ? 'bg-warning/10'
                    : 'bg-electric/10'
                }`}>
                  {activity.status === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4 text-mint" />
                  ) : activity.status === 'warning' ? (
                    <AlertCircle className="w-4 h-4 text-warning" />
                  ) : (
                    <Search className="w-4 h-4 text-electric" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-chalk">{activity.title}</p>
                  <p className="text-xs text-ash">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
