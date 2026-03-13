const GA_MEASUREMENT_ID = 'G-XS4QYRDH0B';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

export function loadGoogleAnalytics() {
  if (document.getElementById('gtag-script')) return;

  // Load gtag.js script
  const script = document.createElement('script');
  script.id = 'gtag-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer and gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID);
}

export function removeGoogleAnalytics() {
  // Remove script
  const script = document.getElementById('gtag-script');
  if (script) script.remove();

  // Remove GA cookies
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const name = cookie.split('=')[0].trim();
    if (name.startsWith('_ga') || name.startsWith('_gid') || name.startsWith('_gat')) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    }
  }

  // Clear dataLayer
  window.dataLayer = [];
}

export type CookieConsent = 'accepted' | 'refused' | null;

const CONSENT_KEY = 'cookie_consent';

export function getStoredConsent(): CookieConsent {
  return localStorage.getItem(CONSENT_KEY) as CookieConsent;
}

export function setStoredConsent(consent: 'accepted' | 'refused') {
  localStorage.setItem(CONSENT_KEY, consent);
}
