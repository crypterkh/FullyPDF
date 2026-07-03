import React from 'react';
import { motion } from 'motion/react';
import { Settings, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ComingSoon({ title, description }: { title: string, description: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-3xl mx-auto w-full h-full flex flex-col pt-4"
    >
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold tracking-tight mb-2">{title}</h1>
        <p className="text-zinc-500">{description}</p>
      </div>
      
      <div className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-12 text-center flex flex-col items-center justify-center">
        <Settings className="w-12 h-12 text-zinc-400 animate-spin-slow mb-4" />
        <h2 className="text-xl font-semibold mb-2">Feature In Development</h2>
        <p className="text-zinc-500 max-w-md">We are currently working on this feature to bring you the best experience possible. Check back soon!</p>
      </div>
    </motion.div>
  );
}
