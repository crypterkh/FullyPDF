
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TooltipProps {
  children: React.ReactElement;
  content: string;
}

export const TooltipProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export const Tooltip = ({ children, content }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative flex items-center" onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)}>
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 5 }}
            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-zinc-900 text-white text-[10px] rounded shadow-xl z-[100] whitespace-nowrap pointer-events-none"
          >
            {content}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-900 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const TooltipTrigger = ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => {
  return <>{children}</>;
};

export const TooltipContent = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};
