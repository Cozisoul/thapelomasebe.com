import React, { useState, useEffect } from 'react';

const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('tmm_cookie_consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('tmm_cookie_consent', 'granted');
    setIsVisible(false);

    // Update Google Consent Mode dynamically
    if (window.dataLayer) {
      function gtag(){window.dataLayer.push(arguments);}
      gtag('consent', 'update', {
        'ad_storage': 'granted',
        'analytics_storage': 'granted'
      });
      // Fire a custom event to trigger tags if needed
      window.dataLayer.push({ event: 'cookie_consent_granted' });
    }
  };

  const handleDecline = () => {
    localStorage.setItem('tmm_cookie_consent', 'denied');
    setIsVisible(false);
    
    // Explicitly enforce denied (though it's default)
    if (window.dataLayer) {
      function gtag(){window.dataLayer.push(arguments);}
      gtag('consent', 'update', {
        'ad_storage': 'denied',
        'analytics_storage': 'denied'
      });
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-[100] max-w-sm w-[calc(100%-2rem)] bg-system-black text-cosmic-latte p-6 border border-white/20 shadow-2xl flex flex-col gap-4">
      <div className="font-mono text-xs uppercase tracking-widest opacity-50 border-b border-white/20 pb-2">
        00.08 // Data Protocol
      </div>
      <p className="font-sans text-sm leading-relaxed opacity-90">
        This system utilizes cookies to monitor traffic and analyze user behavior via Google Analytics. 
        Your interaction data remains anonymous. Do you consent to analytics tracking?
      </p>
      <div className="flex gap-4 mt-2">
        <button 
          onClick={handleAccept}
          className="flex-1 font-mono text-xs uppercase tracking-widest bg-white text-system-black py-3 px-4 hover:bg-accent-blue hover:text-white transition-colors"
        >
          [ ACCEPT ]
        </button>
        <button 
          onClick={handleDecline}
          className="flex-1 font-mono text-xs uppercase tracking-widest border border-white/30 text-white py-3 px-4 hover:bg-white/10 transition-colors"
        >
          [ DECLINE ]
        </button>
      </div>
    </div>
  );
};

export default CookieBanner;
