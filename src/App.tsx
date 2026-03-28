import { useEffect } from 'react';
import { motion } from 'motion/react';

export default function App() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = 'https://makka.lol/four';
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-100 font-sans overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center gap-8"
      >
        <div className="relative">
          {/* Animated rings */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full border border-zinc-500 w-32 h-32 -m-8"
          />
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute inset-0 rounded-full border border-zinc-700 w-32 h-32 -m-8"
          />
          
          <div className="w-16 h-16 rounded-full border-2 border-zinc-800 border-t-zinc-100 animate-spin" />
        </div>

        <div className="text-center space-y-2">
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-2xl font-light tracking-widest uppercase"
          >
            Taking you to <span className="font-medium text-zinc-400">/four</span>
          </motion.h1>
          
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="h-px bg-gradient-to-r from-transparent via-zinc-500 to-transparent"
          />
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 1 }}
            className="text-xs font-mono uppercase tracking-tighter"
          >
            Redirecting in a moment...
          </motion.p>
        </div>
      </motion.div>

      {/* Background subtle glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-zinc-900/20 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-zinc-900/20 rounded-full blur-[120px]" />
      </div>
    </div>
  );
}
