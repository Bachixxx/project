import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../i18n';
import {
  getStoredConsent,
  setStoredConsent,
  loadGoogleAnalytics,
  removeGoogleAnalytics,
} from '../utils/gtag';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    const consent = getStoredConsent();
    if (consent === 'accepted') {
      loadGoogleAnalytics();
    } else if (consent === null) {
      // No choice yet — show banner
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    setStoredConsent('accepted');
    loadGoogleAnalytics();
    setVisible(false);
  };

  const handleRefuse = () => {
    setStoredConsent('refused');
    removeGoogleAnalytics();
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-0 inset-x-0 z-[9999] p-4 sm:p-6"
        >
          <div className="max-w-2xl mx-auto glass rounded-2xl p-5 sm:p-6 shadow-2xl border border-white/10">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
                <Cookie className="w-5 h-5 text-primary-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-white font-semibold text-sm sm:text-base">
                    {t('cookies.title', language)}
                  </h3>
                  <button
                    onClick={handleRefuse}
                    className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-gray-400 text-xs sm:text-sm mt-1 leading-relaxed">
                  {t('cookies.description', language)}
                </p>
                <div className="flex flex-wrap gap-3 mt-4">
                  <button
                    onClick={handleAccept}
                    className="primary-button text-sm px-5 py-2"
                  >
                    {t('cookies.accept', language)}
                  </button>
                  <button
                    onClick={handleRefuse}
                    className="glass-button text-sm px-5 py-2"
                  >
                    {t('cookies.refuse', language)}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
