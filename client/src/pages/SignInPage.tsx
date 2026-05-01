import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, ArrowRight, Mail, Lock } from 'lucide-react';
import { Button, Input, Card } from '../components/ui';

export function SignInPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate('/app');
    }, 800);
  };

  const handleGoogleOAuth = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[420px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card className="p-8 border border-[var(--color-border)] shadow-sm">
            <div className="text-center mb-8">
              <Link to="/" className="inline-flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-[var(--color-accent)] flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
              </Link>
              <h1 className="text-2xl font-display font-semibold text-[var(--color-text-primary)] mb-1">
                Welcome back
              </h1>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Sign in to continue to your Second Brain
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                type="email"
                label="Email"
                placeholder="you@example.com"
                icon={<Mail className="w-4 h-4" />}
                required
              />

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-[0.05em]">
                    Password
                  </label>
                  <Link 
                    to="/forgot-password" 
                    className="text-xs font-medium text-[var(--color-accent)] hover:opacity-80 transition-opacity"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  icon={<Lock className="w-4 h-4" />}
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="remember"
                  className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                />
                <label htmlFor="remember" className="text-sm text-[var(--color-text-secondary)]">
                  Keep me signed in
                </label>
              </div>

              <Button type="submit" variant="primary" className="w-full" loading={isLoading}>
                Sign in
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-full h-px bg-[var(--color-border)]" />
                <span className="relative bg-white px-3 text-xs text-[var(--color-text-secondary)]">
                  or continue with
                </span>
              </div>

              <div className="mt-4">
                <Button 
                  variant="social" 
                  onClick={handleGoogleOAuth} 
                  className="w-full"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 mr-3">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.96 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.96 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-[var(--color-text-secondary)]">
                Don't have an account?{' '}
                <Link 
                  to="/signup" 
                  className="font-medium text-[var(--color-accent)] hover:opacity-80 transition-opacity"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </Card>

          <p className="mt-6 text-center text-xs text-[var(--color-text-muted)]">
            Authorized for personal use only
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default SignInPage;