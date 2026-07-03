import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { FileDown, FileUp, Files, Home, Image as ImageIcon, MessageSquare, Plus, Scissors, Settings, Sidebar, Type, KeySquare, FileText, LogIn, LogOut, FileCode2, RotateCw, ScanText, Menu, Sparkles, FileCode, Table, Presentation } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { useAuth } from '../../context/AuthContext';
import { SettingsDrawer } from '../ui/SettingsDrawer';

export function AppLayout() {
  const { user, signIn } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/' },
    { icon: Files, label: 'Merge PDF', path: '/merge' },
    { icon: Scissors, label: 'Split PDF', path: '/split' },
    { icon: FileUp, label: 'Extract Pages', path: '/extract' },
    { icon: RotateCw, label: 'Rotate PDF', path: '/rotate' },
    { icon: Sparkles, label: 'Summarize PDF', path: '/summarize' },
    { icon: ScanText, label: 'OCR Text Extract', path: '/ocr' },
    { icon: FileText, label: 'PDF to Text', path: '/pdf-to-text' },
    { icon: FileDown, label: 'Compress PDF', path: '/compress' },
    { icon: MessageSquare, label: 'AI Chat', path: '/ai-chat' },
    { icon: ImageIcon, label: 'Image to PDF', path: '/image-to-pdf' },
    { icon: FileText, label: 'PDF to Image', path: '/pdf-to-image' },
    { icon: Type, label: 'Add Watermark', path: '/watermark' },
    { icon: KeySquare, label: 'Password Protect', path: '/protect' },
    { icon: FileCode2, label: 'Word to PDF', path: '/word-to-pdf' },
    { icon: FileCode, label: 'HTML to PDF', path: '/html-to-pdf' },
    { icon: Table, label: 'Excel to PDF', path: '/excel-to-pdf' },
    { icon: Presentation, label: 'PPT to PDF', path: '/ppt-to-pdf' },
  ];

  return (
    <div className="flex h-screen w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans text-sm relative overflow-hidden">
      {/* Sidebar - Desktop */}
      <div className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col hidden md:flex shrink-0">
        <div className="h-14 flex items-center px-4 border-b border-zinc-200 dark:border-zinc-800 font-semibold tracking-tight text-base">
          <div className="flex items-center gap-2">
            <div className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 p-1.5 rounded-lg shadow-sm">
              <FileUp className="w-4 h-4" />
            </div>
            <span>FullyPDF</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
          <div className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 mb-2 px-2 tracking-wider">TOOLS</div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                  isActive
                    ? "bg-zinc-100 dark:bg-zinc-800 font-medium text-zinc-900 dark:text-zinc-50 shadow-sm"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-50"
                )
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Sidebar - Mobile drawer backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Mobile drawer content */}
      <div className={cn(
        "fixed inset-y-0 left-0 w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col z-50 md:hidden transform transition-transform duration-300 ease-in-out shadow-2xl",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-14 flex items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800 font-semibold tracking-tight text-base shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 p-1.5 rounded-lg shadow-sm">
              <FileUp className="w-4 h-4" />
            </div>
            <span>FullyPDF</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(false)} className="h-8 w-8 p-0 rounded-lg">
            ✕
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
          <div className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 mb-2 px-2 tracking-wider">TOOLS</div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                  isActive
                    ? "bg-zinc-100 dark:bg-zinc-800 font-medium text-zinc-900 dark:text-zinc-50 shadow-sm"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-50"
                )
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md flex items-center px-4 shrink-0 justify-between">
          <div className="flex items-center gap-3 md:hidden">
            <Button variant="ghost" size="sm" className="w-9 h-9 p-0 rounded-lg" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2 font-semibold">
              <div className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 p-1 rounded-md">
                <FileUp className="w-3.5 h-3.5" />
              </div>
              <span>FullyPDF</span>
            </div>
          </div>
          <div className="hidden md:block" /> {/* Spacer */}
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsSettingsOpen(true)} 
              className="w-9 h-9 p-0 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <Settings className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </Button>
            {user ? (
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="w-8 h-8 ml-2 rounded-full border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:opacity-80 transition-opacity"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-medium">
                    {(user.displayName || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </button>
            ) : (
              <Button onClick={signIn} size="sm" className="ml-2 rounded-full px-4 text-xs font-medium">
                Sign In
              </Button>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10">
          <div className="max-w-5xl mx-auto w-full h-full">
            <Outlet />
          </div>
        </main>
      </div>

      <SettingsDrawer isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
