import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, ArrowRight, Mail, Lock, ShieldCheck, Github } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-void relative overflow-hidden font-body selection:bg-saffron selection:text-void aurora-surface">
      <div className="noise-overlay" />
      <GridBackground />

      {/* Floating Mandala */}
      <div className="absolute -top-32 -left-32 w-96 h-96 opacity-10 pointer-events-none">
        <Mandala size="lg" className="animate-[spin_40s_linear_infinite]" />
      </div>

      <div className="min-h-screen flex items-center justify-center px-3 md:px-6 py-10 md:py-16 relative z-10">
        <div className="w-full max-w-[440px] perspective-1000">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <Card className="p-6 md:p-8 pb-8 md:pb-10 glass-premium border-smoke/30 cut-card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 opacity-10 pointer-events-none">
                <Mandala size="md" />
              </div>

              <div className="relative mb-10 text-center">
                <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
                  <div className="w-12 h-12 cut-card bg-gradient-to-br from-saffron to-gold flex items-center justify-center shadow-xl shadow-saffron/20 group-hover:scale-110 transition-transform duration-500">
                    <Brain className="w-6 h-6 text-void" />
                  </div>
                </Link>
                <h1 className="text-2xl font-display font-bold text-white tracking-tight mb-2">Access Your Atman</h1>
                <p className="text-[10px] uppercase tracking-[0.3em] text-saffron font-bold">Protocol Initialization</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-ash tracking-[0.2em] ml-1">Lipi Identity (Email)</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <Mail className="w-4 h-4 text-ash group-focus-within:text-saffron transition-colors" />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="scholar@nexus.edu"
                      className="w-full min-h-[44px] bg-void/50 border border-smoke/30 rounded-xl px-12 py-3.5 text-chalk placeholder:text-ash/40 focus:outline-none focus:border-saffron/50 transition-all font-body text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[10px] uppercase font-bold text-ash tracking-[0.2em]">Secret Sutra (Password)</label>
                    <Link to="/forgot-password" title="Recover Access" className="text-[10px] uppercase font-bold text-saffron hover:text-gold transition-colors">
                      Recover
                    </Link>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-ash group-focus-within:text-saffron transition-colors" />
                    </div>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      className="w-full min-h-[44px] bg-void/50 border border-smoke/30 rounded-xl px-12 py-3.5 text-chalk placeholder:text-ash/40 focus:outline-none focus:border-saffron/50 transition-all font-body text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 py-1">
                    <div className="w-6 h-6 min-w-[44px] min-h-[44px] rounded-sm border border-smoke/50 flex items-center justify-center cursor-pointer hover:border-saffron/50 transition-colors">
                    <ShieldCheck className="w-3 h-3 text-peacock opacity-0 hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-xs text-ash">Maintain persistent connection</span>
                </div>

                <SanskritButton type="submit" variant="primary" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Decrypting...' : 'Initialize Session'}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </SanskritButton>
              </form>

              <div className="mt-10">
                <div className="relative flex items-center justify-center mb-8">
                  <div className="absolute w-full h-px bg-smoke/20" />
                  <span className="relative bg-[#0F1117] px-4 text-[10px] uppercase tracking-[0.2em] text-ash font-bold">Third-Party Gateway</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button className="flex items-center justify-center gap-3 px-4 min-h-[44px] py-3 bg-void border border-smoke/20 rounded-xl text-ash hover:text-chalk hover:border-smoke/40 transition-all group">
                    <Github className="w-4 h-4" />
                    <span className="text-[10px] uppercase font-bold tracking-widest">Connect</span>
                  </button>
                  <button className="flex items-center justify-center gap-3 px-4 min-h-[44px] py-3 bg-void border border-smoke/20 rounded-xl text-ash hover:text-chalk hover:border-smoke/40 transition-all group">
                    <div className="w-4 h-4 rounded-full border-2 border-peacock/30 group-hover:border-peacock/60 transition-colors" />
                    <span className="text-[10px] uppercase font-bold tracking-widest">Scholar ID</span>
                  </button>
                </div>
              </div>

              <div className="mt-10 text-center">
                <p className="text-sm text-ash font-medium">
                  Seeking initiation?{' '}
                  <Link to="/signup" className="text-white hover:text-saffron transition-colors font-bold underline underline-offset-4 decoration-saffron/30">
                    Create Scholar Account
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
            <p className="text-[10px] uppercase tracking-[0.4em] text-ash/40 font-bold">Authorized for Academic Use Only</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default SignInPage;
