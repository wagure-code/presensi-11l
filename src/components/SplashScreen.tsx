import React from 'react';
import { motion } from 'motion/react';
import logo from '../assets/logo.png';

export const SplashScreen: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-white"
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="flex flex-col items-center gap-4"
      >
        <motion.img
          src={logo}
          alt="Logo"
          className="w-24 h-24 sm:w-28 sm:h-28"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-xs sm:text-sm font-semibold text-slate-400 tracking-[0.2em] uppercase"
        >
          Portal Akademik
        </motion.div>
      </motion.div>
    </motion.div>
  );
};