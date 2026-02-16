import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Mail, Lock } from 'lucide-react';
import { Button, Card, Badge } from '../components/ui';

export function SignInPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate('/app');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-void relative overflow-hidden">
      <div className="noise-overlay" />
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="absolute -top-24 right-10 w-[420px] h-[420px] bg-flame/12 rounded-full blur-[160px]" />

      <div className="min-h-screen flex items-center justify-center px-6 py-16">
        <Card variant="elevated" className="w-full max-w-lg cut-card cut-border relative overflow-hidden">
          <div className="absolute -top-24 right-0 w-[260px] h-[260px] bg-electric/10 rounded-full blur-[120px]" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 cut-card bg-flame flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-void" />
              </div>
              <div>
                <Badge variant="flame" className="mb-2">Sign in</Badge>
                <h1 className="text-2xl font-display text-chalk">Return to your proof stack</h1>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="cut-card cut-border bg-slate/70 p-4">
                <label className="text-xs text-ash uppercase tracking-[0.2em]">Email</label>
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
                    placeholder="••••••••"
                    className="flex-1 bg-transparent border-none text-chalk placeholder:text-ash focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-ash">
                <span>Secure sign-in</span>
                <Link to="/forgot-password" className="text-electric hover:text-chalk transition-colors">
                  Forgot password?
                </Link>
              </div>
              <Button type="submit" variant="electric" size="lg" className="w-full gap-2" loading={isLoading}>
                Access workspace
                <ArrowRight className="w-5 h-5" />
              </Button>
            </form>

            <div className="mt-6 text-sm text-ash">
              New to Nexus?{' '}
              <Link to="/signup" className="text-chalk hover:text-electric transition-colors">
                Create an account
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
