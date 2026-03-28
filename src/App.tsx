import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Pencil, Trash2, X, Globe, LogOut } from 'lucide-react';

interface Link {
  id: string;
  name: string;
  url: string;
}

export default function App() {
  const [links, setLinks] = useState<Link[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [adminToken, setAdminToken] = useState<string>(localStorage.getItem('admin_token') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [formData, setFormData] = useState({ name: '', url: '' });

  // Fetch links from API
  const fetchLinks = useCallback(async () => {
    try {
      const res = await fetch('/api/links');
      const data = await res.json();
      setLinks(data);
    } catch (err) {
      console.error('Failed to fetch links:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Verify and persist admin status
  const checkAuthStatus = useCallback(async (tokenToVerify?: string) => {
    const token = tokenToVerify || adminToken;
    if (!token) return;

    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const { valid } = await res.json();
      if (valid) {
        setIsAuthenticated(true);
        localStorage.setItem('admin_token', token);
      } else {
        setIsAuthenticated(false);
        localStorage.removeItem('admin_token');
      }
    } catch (err) {
      console.error('Auth check failed:', err);
    }
  }, [adminToken]);

  useEffect(() => {
    fetchLinks();
    checkAuthStatus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'p' && !isModalOpen) {
        setIsPanelOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fetchLinks, checkAuthStatus, isModalOpen]);

  // When panel opens, if not authed, generate a new token in Supabase
  useEffect(() => {
    if (isPanelOpen && !isAuthenticated) {
      fetch('/api/admin/generate', { method: 'POST' });
    }
  }, [isPanelOpen, isAuthenticated]);

  // Save changes to API
  const saveLinks = async (updatedLinks: Link[]) => {
    const res = await fetch('/api/links', {
      method: 'POST',
      body: JSON.stringify(updatedLinks),
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Token': adminToken
      }
    });

    if (res.ok) {
      setLinks(updatedLinks);
      setIsModalOpen(false);
      setEditingLink(null);
      setFormData({ name: '', url: '' });
    } else if (res.status === 401) {
      setIsAuthenticated(false);
      alert('Session expired or unauthorized. Please verify your new token.');
    }
  };

  const handleAddOrEdit = () => {
    let updated: Link[];
    if (editingLink) {
      updated = links.map(l => l.id === editingLink.id ? { ...l, ...formData } : l);
    } else {
      updated = [...links, { id: crypto.randomUUID(), ...formData }];
    }
    saveLinks(updated);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this site?')) {
      const updated = links.filter(l => l.id !== id);
      saveLinks(updated);
    }
  };

  // Masked code for the header
  const maskedCode = adminToken.length > 6
    ? `${adminToken.substring(0, 6)}...`
    : adminToken;

  // Verify token
  const handleVerify = async () => {
    const res = await fetch('/api/admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: adminToken })
    });

    const { valid } = await res.json();
    if (valid) {
      setIsAuthenticated(true);
      localStorage.setItem('admin_token', adminToken);
    } else {
      alert('Invalid Token. Check your Supabase table for the new tk- code.');
    }
  };

  const isFormValid = formData.name.trim() !== '' && formData.url.startsWith('https://www.');

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-zinc-500/30 overflow-x-hidden">
      {/* Background subtle glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-zinc-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-zinc-900/10 rounded-full blur-[120px]" />
      </div>

      <main className="relative max-w-lg mx-auto px-6 py-20 flex flex-col items-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 mx-auto group hover:border-zinc-700 transition-colors shadow-2xl">
            <Globe className="w-8 h-8 text-zinc-400 group-hover:text-zinc-100 transition-colors" />
          </div>
          <h1 className="text-2xl font-light tracking-[0.2em] uppercase">Connect</h1>
          <p className="text-xs text-zinc-500 tracking-widest mt-2 lowercase">i love you guys ❤️‍🩹</p>
        </motion.div>

        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-zinc-800 border-t-zinc-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="w-full space-y-4">
            <AnimatePresence mode="popLayout">
              {links.map((link, i) => (
                <motion.a
                  key={link.id}
                  href={link.url}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.1 }}
                  className="block w-full"
                >
                  <div className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-xl p-5 hover:border-zinc-700 hover:bg-zinc-900/80 transition-all duration-300">
                    <div className="relative flex items-center justify-between">
                      <span className="text-sm font-light tracking-wider uppercase">{link.name}</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 group-hover:bg-zinc-500 transition-colors" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-100/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </div>
                </motion.a>
              ))}
            </AnimatePresence>

            {links.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                className="text-center py-20 border-2 border-dashed border-zinc-900 rounded-3xl"
              >
                <p className="text-sm font-light uppercase tracking-widest">No links found</p>
              </motion.div>
            )}
          </div>
        )}
      </main>

      {/* Admin Floating Trigger (Mobile) */}
      <div className="md:hidden fixed bottom-8 right-8 z-40">
        <button
          onClick={() => setIsPanelOpen(prev => !prev)}
          className="w-14 h-14 rounded-full bg-zinc-100 text-zinc-950 flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
        >
          <Plus className={`w-6 h-6 transition-transform duration-500 ${isPanelOpen ? 'rotate-45' : ''}`} />
        </button>
      </div>

      {/* Admin Side Panel */}
      <AnimatePresence>
        {isPanelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPanelOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-zinc-950 border-l border-zinc-800 z-[60] p-8 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between mb-12">
                <div>
                  <h2 className="text-xl font-light tracking-widest uppercase">Admin Panel</h2>
                  {isAuthenticated ? (
                    <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-tighter">Authenticated with code: <span className="text-zinc-100 font-mono">{maskedCode}</span></p>
                  ) : (
                    <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-tighter tracking-widest">Verification Required</p>
                  )}
                </div>
                <button onClick={() => setIsPanelOpen(false)} className="p-2 hover:bg-zinc-900 rounded-full transition-colors text-zinc-500 hover:text-white">
                  <X />
                </button>
              </div>

              {!isAuthenticated ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex-1 flex flex-col justify-center gap-6"
                >
                  <div className="space-y-4">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest text-center">New Token Generated</p>
                    <input
                      type="password"
                      autoFocus
                      placeholder="tk-••••••••"
                      value={adminToken}
                      onChange={(e) => setAdminToken(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center text-lg focus:outline-none focus:border-zinc-600 transition-colors tracking-widest"
                    />
                    <p className="text-[9px] text-zinc-600 text-center uppercase">Find your token in the Supabase Table Editor</p>
                  </div>
                  <button
                    onClick={handleVerify}
                    className="w-full py-4 bg-zinc-100 text-zinc-950 rounded-2xl text-xs uppercase tracking-widest font-medium active:scale-95 transition-transform"
                  >
                    Verify Token
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 flex flex-col"
                >
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xs text-zinc-500 uppercase tracking-widest">Manage Sites</h3>
                      {links.length > 0 && (
                        <button
                          onClick={() => { setEditingLink(null); setIsModalOpen(true); }}
                          className="p-2 bg-zinc-100 text-zinc-950 rounded-lg hover:bg-white transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {links.map(link => (
                        <div key={link.id} className="group flex items-center justify-between p-4 bg-zinc-900/30 border border-zinc-900 rounded-xl hover:border-zinc-800 transition-colors">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{link.name}</span>
                            <span className="text-[10px] text-zinc-500 truncate max-w-[150px]">{link.url}</span>
                          </div>
                          <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              onClick={() => { setEditingLink(link); setFormData({ name: link.name, url: link.url }); setIsModalOpen(true); }}
                              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(link.id)}
                              className="p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {links.length === 0 && (
                        <button
                          onClick={() => { setEditingLink(null); setIsModalOpen(true); }}
                          className="w-full py-12 border-2 border-dashed border-zinc-900 rounded-2xl flex flex-col items-center gap-3 hover:border-zinc-800 hover:bg-zinc-900/20 transition-all text-zinc-500 hover:text-zinc-300"
                        >
                          <Plus />
                          <span className="text-xs uppercase tracking-widest font-light">Add First Site</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => { localStorage.removeItem('admin_token'); setAdminToken(''); setIsAuthenticated(false); setIsPanelOpen(false); }}
                    className="mt-8 flex items-center justify-center gap-2 p-4 text-xs text-zinc-600 hover:text-red-400 transition-colors uppercase tracking-widest"
                  >
                    <LogOut className="w-4 h-4" /> Exit Session
                  </button>
                </motion.div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl"
            >
              <h3 className="text-lg font-light tracking-widest uppercase mb-8">{editingLink ? 'Edit Link' : 'Add Link'}</h3>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-500 uppercase tracking-widest ml-1">Site Name</label>
                  <input
                    autoFocus
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm focus:outline-none focus:border-zinc-600 transition-colors"
                    placeholder="e.g. My Portfolio"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-500 uppercase tracking-widest ml-1">Site Link</label>
                  <input
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm focus:outline-none focus:border-zinc-600 transition-colors font-mono"
                    placeholder="https://www."
                  />
                  {!formData.url.startsWith('https://www.') && formData.url.length > 0 && (
                    <p className="text-[9px] text-red-400 uppercase tracking-tighter ml-1">Link must start with https://www.</p>
                  )}
                </div>
              </div>

              <div className="mt-10 flex items-center justify-end gap-6">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs text-zinc-500 hover:text-white uppercase tracking-widest transition-colors font-light"
                >
                  Cancel
                </button>
                <button
                  disabled={!isFormValid}
                  onClick={handleAddOrEdit}
                  className={`px-8 py-3 rounded-xl text-xs uppercase tracking-widest transition-all ${isFormValid ? 'bg-zinc-100 text-zinc-950 font-medium active:scale-95' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
      `}</style>
    </div>
  );
}
