import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, ArrowRight, Mail, ShieldCheck, RefreshCw } from 'lucide-react';
import { Button, Card, Badge, SanskritButton, Mandala, cn } from '../components/ui';

function GridBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      <div className="absolute inset-0 grid-pattern opacity-30 shadow-[inset_0_0_150px_rgba(9,10,15,1)]" />
      <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-saffron/5 to-transparent" />
      <div className="absolute bottom-0 right-0 w-1/2 h-full bg-gradient-to-l from-peacock/5 to-transparent" />

      {/* Decorative lines */}
      <div className="absolute left-[20%] top-0 bottom-0 w-px bg-smoke/10 hidden lg:block" />
      <div className="absolute right-[20%] top-0 bottom-0 w-px bg-smoke/10 hidden lg:block" />
    </div>
  );
}

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
      // In a real app we'd wait for user to click link, but here we just show success
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-void relative overflow-hidden font-body selection:bg-gold selection:text-void aurora-surface">
      <div className="noise-overlay" />
      <GridBackground />

      {/* Floating Mandala */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-[0.03] pointer-events-none">
        <Mandala size="lg" className="animate-[spin_60s_linear_infinite]" />
      </div>

      <div className="min-h-screen flex items-center justify-center px-3 md:px-6 py-10 md:py-16 relative z-10">
        <div className="w-full max-w-[440px] perspective-1000">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="p-6 md:p-8 pb-8 md:pb-10 glass-premium border-smoke/30 cut-card relative overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 -ml-16 -mt-16 opacity-10 pointer-events-none">
                <Mandala size="md" />
              </div>

              <div className="relative mb-8 text-center">
                <div className="w-16 h-16 cut-card bg-void border border-smoke/30 mx-auto flex items-center justify-center mb-6">
                  <RefreshCw className={cn("w-7 h-7 text-gold", isLoading && "animate-spin")} />
                </div>
                <h1 className="text-2xl font-display font-bold text-white tracking-tight mb-2">Recover Access</h1>
                <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">Lipi Restoration Protocol</p>
              </div>

              {isSent ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6"
                >
                  <div className="w-12 h-12 rounded-full bg-peacock/10 border border-peacock/30 flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="w-6 h-6 text-peacock" />
                  </div>
                  <h3 className="text-white font-bold mb-2">Restoration Link Sent</h3>
                  <p className="text-sm text-silver leading-relaxed mb-8 px-4">
                    If an account exists for that identity, a secure restoration sutra has been sent to your inbox.
                  </p>
                  <SanskritButton variant="secondary" className="w-full" onClick={() => navigate('/signin')}>
                    Return to Sanctuary
                  </SanskritButton>
                </motion.div>
              ) : (
                <>
                  <p className="text-xs text-silver leading-relaxed mb-8 text-center px-4">
                    Enter the email associated with your research vault below. We will send you a secure link to reset your Secret Sutra.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-ash tracking-[0.2em] ml-1">Lipi Identity (Email)</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                          <Mail className="w-4 h-4 text-ash group-focus-within:text-gold transition-colors" />
                        </div>
                        <input
                          type="email"
                          required
                          placeholder="scholar@nexus.edu"
                          className="w-full min-h-[44px] bg-void/50 border border-smoke/30 rounded-xl px-12 py-3.5 text-chalk placeholder:text-ash/40 focus:outline-none focus:border-gold/50 transition-all font-body text-sm"
                        />
                      </div>
                    </div>

                    <SanskritButton type="submit" variant="primary" className="w-full h-14" disabled={isLoading}>
                      {isLoading ? 'Processing...' : 'Send Restoration Link'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </SanskritButton>
                  </form>
                </>
              )}

              <div className="mt-10 text-center">
                <Link to="/signin" className="text-[10px] uppercase font-bold text-ash hover:text-white transition-colors tracking-[0.2em] flex items-center justify-center gap-2">
                  <ArrowRight className="w-3 h-3 rotate-180" />
                  Back to Sanctuary
                </Link>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8 text-center"
          >
            <p className="text-[10px] uppercase tracking-[0.4em] text-ash/40 font-bold">Secure Verification Active</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
