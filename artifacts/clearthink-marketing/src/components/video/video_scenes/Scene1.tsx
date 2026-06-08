import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { sceneTransitions } from '@/lib/video';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1600),
      setTimeout(() => setPhase(4), 3000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center overflow-hidden bg-primary"
      {...sceneTransitions.clipCircle}
    >
      <div className="absolute inset-0 opacity-40">
        <img
          src={`${import.meta.env.BASE_URL}images/bg-library.png`}
          alt="Library"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-primary/60 mix-blend-multiply" />
      </div>

      <div className="relative z-10 text-center flex flex-col items-center px-12">
        <motion.div
          className="w-[2px] h-24 bg-accent mb-8"
          initial={{ scaleY: 0, originY: 1 }}
          animate={phase >= 1 ? { scaleY: 1 } : { scaleY: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
        
        <h1 className="text-[7vw] font-serif font-bold text-text-inverse leading-none tracking-tight">
          {'Critical Thinking 101'.split('').map((char, i) => (
            <motion.span
              key={i}
              className="inline-block"
              initial={{ opacity: 0, y: 40, rotateX: -40 }}
              animate={phase >= 2 ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 40, rotateX: -40 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25, delay: phase >= 2 ? i * 0.05 : 0 }}
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
        </h1>

        <motion.div
          className="mt-6 text-[2vw] font-body text-text-inverse/80 font-medium tracking-wide uppercase"
          initial={{ opacity: 0, filter: 'blur(10px)', y: 20 }}
          animate={phase >= 3 ? { opacity: 1, filter: 'blur(0px)', y: 0 } : { opacity: 0, filter: 'blur(10px)', y: 20 }}
          transition={{ duration: 0.8, ease: 'circOut' }}
        >
          The Critical Thinking Studio
        </motion.div>
      </div>
    </motion.div>
  );
}