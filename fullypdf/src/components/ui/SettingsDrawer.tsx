import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Moon, Sun, Monitor, X, Clock, User, LogOut, ChevronRight, File as FileIcon, Download, ArrowLeft, Camera, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/button';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getLocalFile } from '../../lib/history';

interface HistoryItem {
  id: string;
  filename: string;
  operation: string;
  timestamp: number;
  localId?: string;
}

const compressAvatar = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 96;
        const MAX_HEIGHT = 96;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        } else {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = () => {
        reject(new Error("Failed to load image for resizing"));
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

export function SettingsDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, signIn, signOut, updateProfileData } = useAuth();
  const { theme, setTheme } = useTheme();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Profile Edit states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const hasChanges = displayName !== (user?.displayName || '') || email !== (user?.email || '') || photoURL !== (user?.photoURL || null);

  useEffect(() => {
    if (user && isOpen) {
      setLoadingHistory(true);
      const fetchHistory = async () => {
        try {
          const q = query(collection(db, 'users', user.uid, 'history'), orderBy('timestamp', 'desc'), limit(10));
          const snapshot = await getDocs(q);
          const items: HistoryItem[] = [];
          snapshot.forEach(doc => {
            items.push({ id: doc.id, ...doc.data() } as HistoryItem);
          });
          setHistory(items);
        } catch (e) {
          console.error("Error fetching history:", e);
        } finally {
          setLoadingHistory(false);
        }
      };
      fetchHistory();
    } else {
      setHistory([]);
    }
  }, [user, isOpen]);

  const handleDownload = async (item: HistoryItem) => {
    if (!item.localId) return;
    setDownloadingId(item.id);
    try {
      const blob = await getLocalFile(item.localId);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = item.filename;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        alert("This file is no longer available locally.");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to download file.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatusMessage({ type: 'error', text: 'Please select an image file.' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({ type: 'error', text: 'Image size must be less than 5MB.' });
      return;
    }

    try {
      const base64Str = await compressAvatar(file);
      setPhotoURL(base64Str);
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Failed to process image.' });
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!displayName.trim()) {
      setStatusMessage({ type: 'error', text: 'Display name cannot be empty.' });
      return;
    }
    
    if (!email.trim() || !email.includes('@')) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      await updateProfileData(displayName, photoURL, email);
      setStatusMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => {
        setIsEditingProfile(false);
        setStatusMessage(null);
      }, 1500);
    } catch (error: any) {
      if (error.message === "verification-email-sent") {
        setStatusMessage({ 
          type: 'success', 
          text: 'Profile updated! A verification link has been sent to your new email. Please verify it to complete the change.' 
        });
        setTimeout(() => {
          setIsEditingProfile(false);
          setStatusMessage(null);
        }, 5000);
        return;
      }

      console.error("Failed to update profile:", error);
      let errorMsg = "An error occurred while saving your changes.";
      if (error.code === 'auth/email-already-in-use') {
        errorMsg = "This email is already in use by another account.";
      } else if (error.code === 'auth/invalid-email') {
        errorMsg = "The email address is invalid.";
      } else if (error.code === 'auth/requires-recent-login') {
        errorMsg = "Re-authentication required. Please try again.";
      } else if (error.message) {
        errorMsg = error.message;
      }
      setStatusMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '100%', opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.5 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                {isEditingProfile ? (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-8 h-8 p-0 rounded-full" 
                    onClick={() => { setIsEditingProfile(false); setStatusMessage(null); }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                ) : (
                  <Settings className="w-5 h-5 text-zinc-500" />
                )}
                <h2 className="text-lg font-semibold">
                  {isEditingProfile ? 'Edit Profile' : 'Settings'}
                </h2>
              </div>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-full" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-8">
              {!isEditingProfile ? (
                <>
                  {/* Profile Section */}
                  <section className="space-y-3">
                    <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Profile</h3>
                    {user ? (
                      <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt="Profile" className="w-12 h-12 rounded-full border border-zinc-200 dark:border-zinc-800 object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-lg font-semibold">
                              {(user.displayName || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">{user.displayName || 'User'}</p>
                            <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          className="w-full text-xs h-8" 
                          size="sm"
                          onClick={() => {
                            setDisplayName(user.displayName || '');
                            setEmail(user.email || '');
                            setPhotoURL(user.photoURL || null);
                            setStatusMessage(null);
                            setIsEditingProfile(true);
                          }}
                        >
                          <User className="w-3.5 h-3.5 mr-2" />
                          Edit Profile
                        </Button>
                      </div>
                    ) : (
                      <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col items-center text-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                          <User className="w-5 h-5 text-zinc-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Not signed in</p>
                          <p className="text-xs text-zinc-500 mt-1">Sign in to save your work history and settings across devices.</p>
                        </div>
                        <Button onClick={signIn} size="sm" className="w-full mt-1 h-8">Sign In</Button>
                      </div>
                    )}
                  </section>

                  {/* Appearance Section */}
                  <section className="space-y-3">
                    <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Appearance</h3>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setTheme('light')}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-colors ${theme === 'light' ? 'border-zinc-900 dark:border-zinc-50 bg-zinc-100 dark:bg-zinc-800' : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900'}`}
                      >
                        <Sun className="w-5 h-5" />
                        <span className="text-xs font-medium">Light</span>
                      </button>
                      <button
                        onClick={() => setTheme('dark')}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-colors ${theme === 'dark' ? 'border-zinc-900 dark:border-zinc-50 bg-zinc-100 dark:bg-zinc-800' : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900'}`}
                      >
                        <Moon className="w-5 h-5" />
                        <span className="text-xs font-medium">Dark</span>
                      </button>
                      <button
                        onClick={() => setTheme('system')}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-colors ${theme === 'system' ? 'border-zinc-900 dark:border-zinc-50 bg-zinc-100 dark:bg-zinc-800' : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900'}`}
                      >
                        <Monitor className="w-5 h-5" />
                        <span className="text-xs font-medium">System</span>
                      </button>
                    </div>
                  </section>

                  {/* Work History Section */}
                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Work History</h3>
                      <Button variant="ghost" size="sm" className="h-6 text-xs px-2 text-zinc-500">View All</Button>
                    </div>
                    {user ? (
                      <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800">
                        {loadingHistory ? (
                          <div className="p-4 text-center text-xs text-zinc-500">Loading history...</div>
                        ) : history.length > 0 ? (
                          history.map((item) => (
                            <div key={item.id} className="p-3 flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors text-sm">
                              <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                                <FileIcon className="w-4 h-4 text-zinc-400 shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium truncate text-xs">{item.filename}</p>
                                  <p className="text-[10px] text-zinc-500">{item.operation} • {new Date(item.timestamp).toLocaleDateString()}</p>
                                </div>
                              </div>
                              {item.localId ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 shrink-0 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
                                  onClick={() => handleDownload(item)}
                                  disabled={downloadingId === item.id}
                                >
                                  <Download className={`w-3.5 h-3.5 ${downloadingId === item.id ? 'animate-pulse' : ''}`} />
                                </Button>
                              ) : (
                                <div className="w-7 h-7 flex items-center justify-center shrink-0">
                                  <ChevronRight className="w-4 h-4 text-zinc-400" />
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center">
                            <p className="text-xs text-zinc-500">No recent files.</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-center">
                        <p className="text-xs text-zinc-500">Sign in to view your recent files.</p>
                      </div>
                    )}
                  </section>
                </>
              ) : (
                <form onSubmit={handleSaveProfile} className="flex flex-col gap-6 h-full">
                  {/* Avatar upload */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative group w-24 h-24">
                      {photoURL ? (
                        <img 
                          src={photoURL} 
                          alt="Profile Preview" 
                          className="w-24 h-24 rounded-full border border-zinc-200 dark:border-zinc-800 object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-3xl font-semibold text-zinc-500">
                          {(displayName || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <label 
                        htmlFor="avatar-upload" 
                        className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                      >
                        <Camera className="w-5 h-5" />
                      </label>
                      <input 
                        id="avatar-upload" 
                        type="file" 
                        accept="image/*" 
                        onChange={handleAvatarChange} 
                        className="hidden" 
                      />
                    </div>
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500">Click image to upload new avatar</span>
                  </div>

                  {/* Status Message */}
                  {statusMessage && (
                    <div className={`p-3 rounded-lg text-xs font-medium ${
                      statusMessage.type === 'success' 
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20' 
                        : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                    }`}>
                      {statusMessage.text}
                    </div>
                  )}

                  {/* Fields */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Display Name</label>
                      <input 
                        type="text" 
                        value={displayName} 
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 focus:outline-hidden focus:ring-2 focus:ring-zinc-950 dark:focus:ring-zinc-300 transition-all"
                        placeholder="Enter display name"
                        required
                        disabled={isSaving}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Email Address</label>
                        {user?.providerData?.some(p => p.providerId === 'google.com') && (
                          <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded font-medium">
                            Google Managed
                          </span>
                        )}
                      </div>
                      <input 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 focus:outline-hidden focus:ring-2 focus:ring-zinc-950 dark:focus:ring-zinc-300 transition-all ${user?.providerData?.some(p => p.providerId === 'google.com') ? 'opacity-60 cursor-not-allowed bg-zinc-50 dark:bg-zinc-900/40' : ''}`}
                        placeholder="Enter email address"
                        required
                        disabled={isSaving || user?.providerData?.some(p => p.providerId === 'google.com')}
                      />
                    </div>
                  </div>

                  {/* Footer Buttons */}
                  <div className="flex flex-col gap-2 mt-auto pt-6">
                    <Button 
                      type="submit" 
                      disabled={isSaving || !hasChanges} 
                      className="w-full"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving changes...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => { setIsEditingProfile(false); setStatusMessage(null); }}
                      disabled={isSaving}
                      className="w-full"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {/* Footer */}
            {!isEditingProfile && user && (
              <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
                <Button variant="outline" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => { signOut(); onClose(); }}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
