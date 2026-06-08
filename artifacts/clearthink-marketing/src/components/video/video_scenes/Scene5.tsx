import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { sceneTransitions } from '@/lib/video';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center bg-bg-light overflow-hidden"
      {...sceneTransitions.zoomThrough}
    >
      <div className="relative z-10 text-center flex flex-col items-center">
        <motion.div
          className="w-16 h-16 rounded-xl border-4 border-primary mb-8"
          initial={{ scale: 0, rotate: 45 }}
          animate={phase >= 1 ? { scale: 1, rotate: 0 } : { scale: 0, rotate: 45 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />
        <motion.h1
          className="text-[8vw] font-serif font-bold text-primary leading-none tracking-tight"
          initial={{ opacity: 0, y: 40 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          Critical Thinking 101.
        </motion.h1>
        
        <motion.p
          className="mt-6 text-[2vw] font-body text-secondary"
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={phase >= 2 ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(10px)' }}
          transition={{ duration: 0.8 }}
        >
          Trust the course. Trust the student.
        </motion.p>
      </div>
    </motion.div>
  );
}