import React, { useState, useEffect } from 'react';
import { Download, X, Share2, PlusSquare, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
  });
  const [isStandalone] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  });
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    return sessionStorage.getItem('internflow_pwa_dismissed') === 'true';
  });
  const [showIOSModal, setShowIOSModal] = useState<boolean>(false);

  useEffect(() => {
    // Capture Chromium install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Chromium (Android / Desktop Chrome / Edge)
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      // Show Apple iOS install guide modal
      setShowIOSModal(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('internflow_pwa_dismissed', 'true');
  };

  // Do not show if already in standalone app mode or dismissed
  if (isStandalone || isDismissed || (!deferredPrompt && !isIOS)) {
    return null;
  }

  return (
    <>
      <aside className="pwa-install-banner" role="region" aria-label="Install InternFlow App">
        <div className="pwa-banner-content">
          <div className="pwa-banner-icon">
            <Smartphone size={16} color="#64d2ff" />
          </div>
          <div className="pwa-banner-text">
            <span className="pwa-banner-title">Install InternFlow PWA</span>
            <span className="pwa-banner-sub">Fast, full-screen mobile experience with offline sync</span>
          </div>
        </div>

        <div className="pwa-banner-actions">
          <button
            type="button"
            className="pwa-btn-install"
            onClick={handleInstallClick}
            aria-label="Install App"
          >
            <Download size={13} />
            <span>Install</span>
          </button>
          <button
            type="button"
            className="pwa-btn-close"
            onClick={handleDismiss}
            aria-label="Dismiss banner"
          >
            <X size={14} />
          </button>
        </div>
      </aside>

      {/* iOS Safari Instructions Bottom Sheet */}
      {showIOSModal && (
        <div className="pwa-ios-modal-overlay" onClick={() => setShowIOSModal(false)}>
          <div className="pwa-ios-modal" onClick={e => e.stopPropagation()}>
            <div className="pwa-ios-handle" />
            <div className="pwa-ios-header">
              <div className="pwa-ios-icon-box">
                <img src="/icons/icon-192.png" alt="InternFlow" className="pwa-ios-app-icon" />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', margin: 0 }}>
                  Install InternFlow on iOS
                </h3>
                <p style={{ fontSize: '0.74rem', color: '#86868b', margin: '2px 0 0 0' }}>
                  Add to your home screen for quick access without the browser address bar.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="pwa-btn-close"
                style={{ marginLeft: 'auto' }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="pwa-ios-steps">
              <div className="pwa-ios-step-row">
                <div className="pwa-ios-step-num">1</div>
                <div className="pwa-ios-step-text">
                  Tap the <Share2 size={14} color="#0071e3" style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} /> <strong>Share</strong> button in Safari's bottom toolbar.
                </div>
              </div>
              <div className="pwa-ios-step-row">
                <div className="pwa-ios-step-num">2</div>
                <div className="pwa-ios-step-text">
                  Scroll down and tap <PlusSquare size={14} color="#30d158" style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} /> <strong>Add to Home Screen</strong>.
                </div>
              </div>
              <div className="pwa-ios-step-row">
                <div className="pwa-ios-step-num">3</div>
                <div className="pwa-ios-step-text">
                  Tap <strong>Add</strong> in the top right corner. Done!
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={() => setShowIOSModal(false)}
              style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
