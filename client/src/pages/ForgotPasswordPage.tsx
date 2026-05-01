import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Mail, Check } from 'lucide-react';
import { Button, Input, Card } from '../components/ui';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSent(true);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[420px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-8 border border-[var(--color-border)] shadow-sm">
            {isSent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <div className="w-12 h-12 rounded-full bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-6 h-6 text-[var(--color-success)]" />
                </div>
                <h2 className="text-xl font-display font-semibold text-[var(--color-text-primary)] mb-2">
                  Check your email
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6">
                  We've sent password reset instructions to your email address.
                </p>
                <Button 
                  variant="primary" 
                  className="w-full" 
                  onClick={() => navigate('/signin')}
                >
                  Back to sign in
                </Button>
              </motion.div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div className="w-12 h-12 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] mx-auto flex items-center justify-center mb-4">
                    <Mail className="w-5 h-5 text-[var(--color-text-secondary)]" />
                  </div>
                  <h1 className="text-xl font-display font-semibold text-[var(--color-text-primary)] mb-1">
                    Forgot password?
                  </h1>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Enter your email and we'll send you reset instructions
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

                  <Button type="submit" variant="primary" className="w-full" loading={isLoading}>
                    Send reset instructions
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              </>
            )}

            <div className="mt-8 text-center">
              <Link 
                to="/signin" 
                className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                Back to sign in
              </Link>
            </div>
          </Card>

          <p className="mt-6 text-center text-xs text-[var(--color-text-muted)]">
            Secure password recovery
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;