
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface UpdateNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UpdateNoticeModal: React.FC<UpdateNoticeModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[10000] p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-[340px] bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
          >
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 mb-6 flex items-center justify-center">
                <img 
                  src="https://img.icons8.com/color/96/google-logo.png" 
                  alt="Google" 
                  className="w-full h-full object-contain"
                />
              </div>
              
              <h3 className="text-xl font-black text-slate-800 dark:text-white mb-4 font-['Baloo_Da_2']">
                Important Update
              </h3>
              
              <p className="text-[13px] text-slate-600 dark:text-slate-400 font-bold leading-relaxed mb-8 px-2">
                App version is outdated. Please update the app to the latest version and release it to production as per Google Play Policy requirements
              </p>
              
              <button
                onClick={onClose}
                className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all shadow-lg shadow-teal-100 dark:shadow-teal-900/20"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UpdateNoticeModal;
