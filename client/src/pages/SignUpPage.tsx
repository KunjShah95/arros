import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Mail, Lock, User } from 'lucide-react';
import { Button, Card, Badge } from '../components/ui';

export function SignUpPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate('/app');
    }, 700);
  };

  return (
    <div className="min-h-screen bg-void relative overflow-hidden">
      <div className="noise-overlay" />
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="absolute -top-28 right-16 w-[460px] h-[460px] bg-electric/12 rounded-full blur-[180px]" />

      <div className="min-h-screen flex items-center justify-center px-6 py-16">
        <Card variant="elevated" className="w-full max-w-lg cut-card cut-border relative overflow-hidden">
          <div className="absolute -bottom-24 left-0 w-[260px] h-[260px] bg-flame/10 rounded-full blur-[120px]" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 cut-card bg-flame flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-void" />
              </div>
              <div>
                <Badge variant="electric" className="mb-2">Create account</Badge>
                <h1 className="text-2xl font-display text-chalk">Open your research vault</h1>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="cut-card cut-border bg-slate/70 p-4">
                <label className="text-xs text-ash uppercase tracking-[0.2em]">Full name</label>
                <div className="mt-2 flex items-center gap-3">
                  <User className="w-4 h-4 text-ash" />
                  <input
                    type="text"
                    required
                    placeholder="Alex Morgan"
                    className="flex-1 bg-transparent border-none text-chalk placeholder:text-ash focus:outline-none"
                  />
                </div>
              </div>
              <div className="cut-card cut-border bg-slate/70 p-4">
                <label className="text-xs text-ash uppercase tracking-[0.2em]">Work email</label>
                <div className="mt-2 flex items-center gap-3">
                  <Mail className="w-4 h-4 text-ash" />
                  <input
                    type="email"
                    required
                    placeholder="you@company.com"
                    className="flex-1 bg-transparent border-none text-chalk placeholder:text-ash focus:outline-none"
                  />
                </div>
              </div>
              <div className="cut-card cut-border bg-slate/70 p-4">
                <label className="text-xs text-ash uppercase tracking-[0.2em]">Password</label>
                <div className="mt-2 flex items-center gap-3">
                  <Lock className="w-4 h-4 text-ash" />
                  <input
                    type="password"
                    required
                    placeholder="Create a secure password"
                    className="flex-1 bg-transparent border-none text-chalk placeholder:text-ash focus:outline-none"
                  />
                </div>
              </div>
              <Button type="submit" variant="electric" size="lg" className="w-full gap-2" loading={isLoading}>
                Create account
                <ArrowRight className="w-5 h-5" />
              </Button>
            </form>

            <div className="mt-6 text-sm text-ash">
              Already have access?{' '}
              <Link to="/signin" className="text-chalk hover:text-electric transition-colors">
                Sign in
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
