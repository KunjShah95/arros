import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, ArrowRight, Mail, Lock, User, Sparkles, GraduationCap } from 'lucide-react';
import { Button, Card, Badge, SanskritButton, Mandala, cn } from '../components/ui';

function GridBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      <div className="absolute inset-0 grid-pattern opacity-30 shadow-[inset_0_0_150px_rgba(9,10,15,1)]" />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-saffron/5 to-transparent" />
      <div className="absolute bottom-0 left-0 w-1/2 h-full bg-gradient-to-r from-peacock/5 to-transparent" />

      {/* Decorative lines */}
      <div className="absolute left-[20%] top-0 bottom-0 w-px bg-smoke/10 hidden lg:block" />
      <div className="absolute right-[20%] top-0 bottom-0 w-px bg-smoke/10 hidden lg:block" />
    </div>
  );
}

export function SignUpPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate('/app');
    }, 900);
  };

  return (
    <div className="min-h-screen bg-void relative overflow-hidden font-body selection:bg-peacock selection:text-void aurora-surface">
      <div className="noise-overlay" />
      <GridBackground />

      {/* Floating Mandala */}
      <div className="absolute -bottom-32 -right-32 w-96 h-96 opacity-10 pointer-events-none">
        <Mandala size="lg" className="animate-[spin_40s_linear_infinite]" />
      </div>

      <div className="min-h-screen flex items-center justify-center px-3 md:px-6 py-10 md:py-16 relative z-10">
        <div className="w-full max-w-[480px] perspective-1000">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <Card className="p-6 md:p-8 pb-8 md:pb-10 glass-premium border-smoke/30 cut-card relative overflow-hidden">
              <div className="absolute bottom-0 left-0 w-32 h-32 -ml-16 -mb-16 opacity-10 pointer-events-none">
                <Mandala size="md" />
              </div>

              <div className="relative mb-10 text-center">
                <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
                  <div className="w-12 h-12 cut-card bg-gradient-to-br from-peacock to-indus flex items-center justify-center shadow-xl shadow-peacock/20 group-hover:scale-110 transition-transform duration-500">
                    <GraduationCap className="w-6 h-6 text-void" />
                  </div>
                </Link>
                <h1 className="text-2xl font-display font-bold text-white tracking-tight mb-2">Initialize Your Journey</h1>
                <p className="text-[10px] uppercase tracking-[0.3em] text-peacock font-bold">Scholar Registration Protocol</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 gap-5">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-ash tracking-[0.2em] ml-1">Universal Name</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <User className="w-4 h-4 text-ash group-focus-within:text-peacock transition-colors" />
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="Arya Sharma"
                        className="w-full min-h-[44px] bg-void/50 border border-smoke/30 rounded-xl px-12 py-3.5 text-chalk placeholder:text-ash/40 focus:outline-none focus:border-peacock/50 transition-all font-body text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-ash tracking-[0.2em] ml-1">Lipi Identity (Email)</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Mail className="w-4 h-4 text-ash group-focus-within:text-peacock transition-colors" />
                      </div>
                      <input
                        type="email"
                        required
                        placeholder="scholar@nexus.edu"
                        className="w-full min-h-[44px] bg-void/50 border border-smoke/30 rounded-xl px-12 py-3.5 text-chalk placeholder:text-ash/40 focus:outline-none focus:border-peacock/50 transition-all font-body text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-ash tracking-[0.2em] ml-1">Secret Sutra (Password)</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Lock className="w-4 h-4 text-ash group-focus-within:text-peacock transition-colors" />
                      </div>
                      <input
                        type="password"
                        required
                        placeholder="Create a secure sutra"
                        className="w-full min-h-[44px] bg-void/50 border border-smoke/30 rounded-xl px-12 py-3.5 text-chalk placeholder:text-ash/40 focus:outline-none focus:border-peacock/50 transition-all font-body text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 py-2 px-1">
                  <input type="checkbox" className="w-5 h-5 min-w-[20px] min-h-[20px] rounded border-smoke/30 bg-void/50 text-peacock focus:ring-peacock/20" required />
                  <p className="text-[10px] text-ash leading-relaxed">
                    I agree to the <span className="text-white hover:text-peacock cursor-pointer transition-colors underline underline-offset-2">Nexus Protocol</span> and the usage of Vedic reasoned intelligence.
                  </p>
                </div>

                <SanskritButton type="submit" variant="primary" className="w-full mt-2" disabled={isLoading}>
                  {isLoading ? 'Processing Initiation...' : 'Create Scholar Account'}
                  <Sparkles className="w-4 h-4 ml-2" />
                </SanskritButton>
              </form>

              <div className="mt-10 text-center">
                <p className="text-sm text-ash font-medium">
                  Already initiated?{' '}
                  <Link to="/signin" className="text-white hover:text-peacock transition-colors font-bold underline underline-offset-4 decoration-peacock/30">
                    Return to Sanctuary
                  </Link>
                </p>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8 text-center"
          >
            <p className="text-[10px] uppercase tracking-[0.4em] text-ash/40 font-bold">Secure Verification Protocol Active</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default SignUpPage;
