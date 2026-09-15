// Static bootstrap, executed after hydration. No credential is embedded here.
export const UMAMI_BOOTSTRAP = `(() => {
  if (location.hostname !== 'manuelgarciallera.com' || location.protocol !== 'https:') return;
  if (navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true) return;
  if (document.getElementById('portfolio-umami')) return;
  window.portfolioAnalyticsFilter = function(type, payload) {
    if (type !== 'event' || !payload || payload.name) return false;
    try {
      var url = new URL(payload.url, 'https://manuelgarciallera.com');
      if (url.hostname !== 'manuelgarciallera.com') return false;
      var referrer = '';
      try { if (payload.referrer) referrer = new URL(payload.referrer).origin + '/'; } catch (_) {}
      return { website: payload.website, hostname: payload.hostname, language: payload.language,
        screen: payload.screen, url: url.pathname, referrer: referrer };
    } catch (_) { return false; }
  };
  var script = document.createElement('script');
  script.id = 'portfolio-umami';
  script.defer = true;
  script.src = 'https://cloud.umami.is/script.js';
  script.setAttribute('data-website-id', '7c0010a4-8f44-4340-8ee2-d8a7bda1152c');
  script.setAttribute('data-domains', 'manuelgarciallera.com');
  script.setAttribute('data-exclude-search', 'true');
  script.setAttribute('data-exclude-hash', 'true');
  script.setAttribute('data-do-not-track', 'true');
  script.setAttribute('data-before-send', 'portfolioAnalyticsFilter');
  document.head.appendChild(script);
})();`
