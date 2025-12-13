import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen flex items-center justify-center bg-slate-50"
    >
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        className="text-center"
      >
        <motion.div 
          className="w-12 h-12 border-4 border-slate-300 border-t-black rounded-full mx-auto mb-4"
          animate={{ rotate: 360 }}
          transition={{ 
            duration: 0.8, 
            repeat: Infinity, 
            ease: "linear",
            repeatDelay: 0
          }}
          style={{ transformOrigin: 'center' }}
        />
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-sm text-slate-600"
        >
          Loading...
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

export default LoadingSpinner;

