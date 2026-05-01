import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  seenTips: string[];
  markTipSeen: (tipId: string) => boolean;
}

export const useToastStore = create<ToastStore>()(
  persist(
    (set, get) => ({
      toasts: [],
      seenTips: [],
      
      addToast: (toast) => {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const newToast = { ...toast, id };
        set((state) => ({ toasts: [...state.toasts, newToast] }));
        
        const duration = toast.duration || 5000;
        if (duration > 0) {
          setTimeout(() => {
            get().removeToast(id);
          }, duration);
        }
      },
      
      removeToast: (id) => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      },
      
      markTipSeen: (tipId) => {
        const seen = get().seenTips;
        if (seen.includes(tipId)) return true;
        set((state) => ({ seenTips: [...state.seenTips, tipId] }));
        return false;
      },
    }),
    {
      name: 'arros-toast-storage',
    }
  )
);

export const toast = {
  info: (message: string, duration?: number) => 
    useToastStore.getState().addToast({ message, type: 'info', duration }),
  success: (message: string, duration?: number) => 
    useToastStore.getState().addToast({ message, type: 'success', duration }),
  warning: (message: string, duration?: number) => 
    useToastStore.getState().addToast({ message, type: 'warning', duration }),
  error: (message: string, duration?: number) => 
    useToastStore.getState().addToast({ message, type: 'error', duration }),
};

import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  const icons = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    error: AlertCircle,
  };

  const colors = {
    info: 'border-peacock bg-peacock/10',
    success: 'border-mint bg-mint/10',
    warning: 'border-gold bg-gold/10',
    error: 'border-error bg-error/10',
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = icons[t.type];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className={`cut-card border ${colors[t.type]} p-4 pr-10 max-w-sm relative`}
            >
              <Icon className={`w-5 h-5 absolute top-4 right-4 text-${t.type === 'info' ? 'peacock' : t.type}`} />
              <p className="text-sm text-chalk">{t.message}</p>
              <button 
                onClick={() => removeToast(t.id)}
                className="absolute top-2 right-2 text-ash hover:text-chalk"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// Onboarding tips configuration
export const onboardingTips = [
  { id: 'first-research', message: 'Start your first research! Type a topic and press Enter.', path: '/' },
  { id: 'upload-pdf', message: 'Try uploading a PDF to generate flashcards automatically.', path: '/media-research' },
  { id: 'flashcard-review', message: 'Review your flashcards daily to strengthen memory!', path: '/flashcards' },
  { id: 'study-streak', message: 'Keep your streak alive! Study every day to earn XP.', path: '/analytics' },
];

export function showOnboardingTip() {
  const { markTipSeen } = useToastStore.getState();
  for (const tip of onboardingTips) {
    if (!markTipSeen(tip.id)) {
      toast.info(tip.message);
      break;
    }
  }
}