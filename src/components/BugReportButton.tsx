import React, { useState } from 'react';
import { Bug, X, Camera, Send, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useClientAuth } from '../contexts/ClientAuthContext';

export default function BugReportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { user } = useAuth();
  const { client } = useClientAuth();

  const userId = user?.id || client?.auth_id || null;
  const userRole = user ? 'coach' : client ? 'client' : null;

  const handleCapture = async () => {
    setCapturing(true);
    try {
      // Temporarily hide the modal for clean screenshot
      const modal = document.getElementById('bug-report-modal');
      const btn = document.getElementById('bug-report-btn');
      if (modal) modal.style.display = 'none';
      if (btn) btn.style.display = 'none';

      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(document.body, {
        scale: 0.5,
        logging: false,
        useCORS: true,
      });
      setScreenshot(canvas.toDataURL('image/jpeg', 0.6));

      if (modal) modal.style.display = '';
      if (btn) btn.style.display = '';
    } catch (err) {
      console.error('Screenshot failed:', err);
    } finally {
      setCapturing(false);
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('bug_reports').insert({
        user_id: userId,
        user_role: userRole,
        page_url: window.location.pathname,
        description: description.trim(),
        screenshot: screenshot,
        user_agent: navigator.userAgent,
        screen_size: `${window.innerWidth}x${window.innerHeight}`,
      });
      if (error) throw error;
      setSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setDescription('');
        setScreenshot(null);
        setSubmitted(false);
      }, 2000);
    } catch (err) {
      console.error('Bug report failed:', err);
      alert('Erreur lors de l\'envoi du signalement.');
    } finally {
      setSubmitting(false);
    }
  };

  // Don't render if no authenticated user
  if (!userId) return null;

  return (
    <>
      <button
        id="bug-report-btn"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 sm:bottom-6 right-4 sm:right-6 z-[100] w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 hover:bg-amber-500/30 hover:scale-110 transition-all shadow-lg backdrop-blur-sm"
        title="Signaler un bug"
      >
        <Bug className="w-5 h-5" />
      </button>

      {isOpen && (
        <div id="bug-report-modal" className="fixed inset-0 z-[101] flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Bug className="w-5 h-5 text-amber-400" />
                Signaler un bug
              </h3>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                  <Check className="w-8 h-8 text-emerald-400" />
                </div>
                <p className="text-white font-medium">Merci pour votre signalement !</p>
                <p className="text-gray-400 text-sm mt-1">Nous allons l'examiner rapidement.</p>
              </div>
            ) : (
              <>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez le problème rencontré..."
                  rows={4}
                  className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 resize-none text-sm"
                />

                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={handleCapture}
                    disabled={capturing}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 text-sm transition-colors disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4" />
                    {capturing ? 'Capture...' : screenshot ? 'Reprendre' : 'Capture d\'écran'}
                  </button>
                  {screenshot && (
                    <img src={screenshot} alt="Screenshot" className="h-10 rounded border border-white/10" />
                  )}
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                  <span className="text-xs text-gray-500">{window.location.pathname}</span>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !description.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    {submitting ? 'Envoi...' : 'Envoyer'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
