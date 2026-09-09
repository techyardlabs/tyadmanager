/**
 * AdServer Pro - High Performance Dynamic Ad Delivery Tag
 * Version: 2.4.0 (Production CDN Build)
 * Lightweight, non-blocking asynchronous script for publisher integration.
 */
(function () {
  'use strict';

  if (window.__AD_SERVER_LOADER_INITIALIZED__) {
    if (window.AdServer && typeof window.AdServer.scan === 'function') {
      window.AdServer.scan();
    }
    return;
  }
  window.__AD_SERVER_LOADER_INITIALIZED__ = true;

  // Resolve Ad Server Host origin from current script src
  var serverOrigin = '';
  var currentScript =
    document.currentScript ||
    (function () {
      var scripts = document.getElementsByTagName('script');
      for (var i = scripts.length - 1; i >= 0; i--) {
        if (scripts[i].src && scripts[i].src.indexOf('ad-loader.js') !== -1) {
          return scripts[i];
        }
      }
      return null;
    })();

  if (currentScript && currentScript.src) {
    try {
      var parsedUrl = new URL(currentScript.src);
      serverOrigin = parsedUrl.origin;
    } catch (e) {
      serverOrigin = window.location.origin;
    }
  } else {
    serverOrigin = window.location.origin;
  }

  // Viewability tracking with IntersectionObserver
  var viewedImpressions = {};
  var observer = null;

  if (typeof IntersectionObserver !== 'undefined') {
    observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            var container = entry.target;
            var impressionUrl = container.getAttribute('data-ad-impression-url');
            var creativeId = container.getAttribute('data-ad-creative-id');

            if (impressionUrl && creativeId && !viewedImpressions[creativeId]) {
              viewedImpressions[creativeId] = true;
              sendBeacon(impressionUrl);
              container.removeAttribute('data-ad-impression-url');
              observer.unobserve(container);
            }
          }
        });
      },
      { threshold: [0.5] }
    );
  }

  function sendBeacon(url) {
    if (navigator.sendBeacon) {
      try {
        navigator.sendBeacon(url);
        return;
      } catch (e) {}
    }
    var img = new Image(1, 1);
    img.src = url;
  }

  function extractYouTubeId(url) {
    if (!url) return '';
    var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    var match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : '';
  }

  function renderAd(container, ad) {
    container.innerHTML = '';
    container.setAttribute('data-ad-status', 'rendered');
    container.setAttribute('data-ad-creative-id', ad.creativeId);
    container.setAttribute('data-ad-impression-url', ad.impressionUrl);

    // Outer responsive frame
    var frame = document.createElement('div');
    frame.className = 'ad-frame-wrapper';
    frame.style.cssText =
      'position:relative;display:inline-block;max-width:100%;overflow:hidden;box-sizing:border-box;vertical-align:middle;text-align:left;border-radius:6px;background:#090d16;font-family:system-ui,-apple-system,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,0.15);';

    // Set standard dimensions or responsive sizing
    if (ad.width && ad.height) {
      frame.style.width = ad.width + 'px';
      frame.style.height = ad.height + 'px';
    }

    // Badge label
    var badge = document.createElement('div');
    badge.style.cssText =
      'position:absolute;top:4px;right:6px;font-size:9px;line-height:1;background:rgba(15,23,42,0.85);color:#cbd5e1;padding:3px 6px;border-radius:3px;font-weight:600;letter-spacing:0.5px;z-index:30;pointer-events:none;border:1px solid rgba(255,255,255,0.15);text-transform:uppercase;';
    badge.innerText = 'Sponsored Ad';
    frame.appendChild(badge);

    if (ad.formatType === 'video') {
      renderVideoAd(frame, ad);
    } else {
      renderImageAd(frame, ad);
    }

    container.appendChild(frame);

    // Track impression
    if (observer) {
      observer.observe(container);
    } else {
      // Fallback: fire impression after 500ms
      setTimeout(function () {
        if (!viewedImpressions[ad.creativeId]) {
          viewedImpressions[ad.creativeId] = true;
          sendBeacon(ad.impressionUrl);
        }
      }, 600);
    }
  }

  function renderImageAd(frame, ad) {
    var link = document.createElement('a');
    link.href = ad.clickUrl;
    link.target = '_blank';
    link.rel = 'noopener sponsored';
    link.style.cssText =
      'display:block;width:100%;height:100%;text-decoration:none;position:relative;overflow:hidden;cursor:pointer;';

    var img = document.createElement('img');
    img.src = ad.mediaUrl;
    img.alt = ad.name || 'Sponsored Advertisement';
    img.loading = 'lazy';
    img.style.cssText =
      'width:100%;height:100%;object-fit:cover;display:block;transition:transform 0.25s ease;';

    link.addEventListener('mouseenter', function () {
      img.style.transform = 'scale(1.02)';
    });
    link.addEventListener('mouseleave', function () {
      img.style.transform = 'scale(1)';
    });

    link.appendChild(img);
    frame.appendChild(link);
  }

  function renderVideoAd(frame, ad) {
    var videoContainer = document.createElement('div');
    videoContainer.style.cssText =
      'position:relative;width:100%;height:100%;overflow:hidden;background:#000;';

    if (ad.videoType === 'youtube') {
      var ytId = extractYouTubeId(ad.youtubeUrl || ad.mediaUrl);
      var iframe = document.createElement('iframe');
      iframe.src =
        'https://www.youtube-nocookie.com/embed/' +
        ytId +
        '?autoplay=1&mute=1&controls=1&playsinline=1&modestbranding=1&rel=0';
      iframe.title = ad.name || 'Sponsored Video Ad';
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
      iframe.setAttribute('allowfullscreen', 'true');
      iframe.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;border:none;';
      videoContainer.appendChild(iframe);
    } else if (ad.videoType === 'embed') {
      var embedWrapper = document.createElement('div');
      embedWrapper.style.cssText = 'width:100%;height:100%;';
      embedWrapper.innerHTML = ad.embedCode || '';
      videoContainer.appendChild(embedWrapper);
    } else {
      // Direct MP4 / WebM
      var video = document.createElement('video');
      video.src = ad.mediaUrl;
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      video.loop = true;
      video.controls = true;
      video.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
      videoContainer.appendChild(video);
    }

    // Click bar overlay to target URL
    if (ad.targetUrl) {
      var bottomBar = document.createElement('a');
      bottomBar.href = ad.clickUrl;
      bottomBar.target = '_blank';
      bottomBar.rel = 'noopener sponsored';
      bottomBar.style.cssText =
        'position:absolute;bottom:0;left:0;right:0;padding:6px 12px;background:linear-gradient(to top, rgba(0,0,0,0.85), transparent);color:#fff;font-size:11px;text-decoration:none;display:flex;align-items:center;justify-content:space-between;z-index:20;font-weight:500;';
      bottomBar.innerHTML =
        '<span>Learn More &rarr;</span><span style="opacity:0.75;font-size:10px;">' +
        (ad.targetUrl.replace(/^https?:\/\//, '').split('/')[0] || 'Visit Sponsor') +
        '</span>';
      videoContainer.appendChild(bottomBar);
    }

    frame.appendChild(videoContainer);
  }

  function renderFallback(container, slotId) {
    container.setAttribute('data-ad-status', 'empty');
    container.innerHTML =
      '<div style="border:1px dashed #334155;border-radius:6px;background:rgba(15,23,42,0.4);color:#64748b;font-size:11px;display:flex;align-items:center;justify-content:center;padding:12px;text-align:center;min-height:70px;font-family:system-ui,sans-serif;">' +
      '<div><div style="font-weight:600;color:#94a3b8;margin-bottom:2px;">Ad Space Available</div><div style="font-size:10px;opacity:0.8;">Slot: ' +
      slotId +
      '</div></div></div>';
  }

  function renderBlocked(container, slotId, domain) {
    container.setAttribute('data-ad-status', 'blocked');
    container.innerHTML =
      '<div style="border:1px dashed rgba(239,68,68,0.4);border-radius:6px;background:rgba(239,68,68,0.06);color:#f87171;font-size:11px;display:flex;align-items:center;justify-content:center;padding:14px;text-align:center;min-height:70px;font-family:system-ui,-apple-system,sans-serif;">' +
      '<div><div style="font-weight:700;color:#ef4444;display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:3px;"><span style="font-size:14px;">&#128683;</span> Ad Delivery Blocked by Admin</div>' +
      '<div style="font-size:11px;color:#cbd5e1;opacity:0.9;">Website domain <strong>' +
      (domain || 'this site') +
      '</strong> is currently restricted from serving ads.</div>' +
      '<div style="font-size:10px;color:#94a3b8;margin-top:2px;">Slot: ' +
      slotId +
      '</div></div></div>';
  }

  function loadSlot(container) {
    var slotId = container.getAttribute('data-ad-slot');
    if (!slotId) return;

    if (container.getAttribute('data-ad-status') === 'loading' || container.getAttribute('data-ad-status') === 'rendered') {
      return;
    }

    container.setAttribute('data-ad-status', 'loading');

    var currentDomain = container.getAttribute('data-ad-domain') || window.location.hostname || '';
    var apiUrl =
      serverOrigin +
      '/api/serve?slot=' +
      encodeURIComponent(slotId) +
      '&domain=' +
      encodeURIComponent(currentDomain) +
      '&ref=' +
      encodeURIComponent(window.location.href) +
      '&cb=' +
      Date.now();

    var xhr = new XMLHttpRequest();
    xhr.open('GET', apiUrl, true);
    xhr.withCredentials = false;
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          var response = JSON.parse(xhr.responseText);
          if (response && response.blocked) {
            renderBlocked(container, slotId, response.domain || currentDomain);
          } else if (response && response.ad) {
            renderAd(container, response.ad);
          } else {
            renderFallback(container, slotId);
          }
        } catch (e) {
          renderFallback(container, slotId);
        }
      } else {
        renderFallback(container, slotId);
      }
    };
    xhr.onerror = function () {
      renderFallback(container, slotId);
    };
    xhr.send();
  }

  function scanAndLoadAll() {
    var nodes = document.querySelectorAll('.ad-container[data-ad-slot], [data-ad-slot]');
    for (var i = 0; i < nodes.length; i++) {
      loadSlot(nodes[i]);
    }
  }

  // Programmatic API
  window.AdServer = {
    version: '2.4.0',
    scan: scanAndLoadAll,
    refresh: function (slotId) {
      var selector = slotId
        ? '[data-ad-slot="' + slotId + '"]'
        : '.ad-container[data-ad-slot]';
      var nodes = document.querySelectorAll(selector);
      for (var i = 0; i < nodes.length; i++) {
        nodes[i].removeAttribute('data-ad-status');
        loadSlot(nodes[i]);
      }
    },
    loadSlot: loadSlot,
  };

  // Scan on DOMContentLoaded or immediately if ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scanAndLoadAll);
  } else {
    scanAndLoadAll();
  }

  // MutationObserver for SPA / dynamically injected ad slots
  if (typeof MutationObserver !== 'undefined') {
    var mo = new MutationObserver(function (mutations) {
      var found = false;
      for (var i = 0; i < mutations.length; i++) {
        if (mutations[i].addedNodes && mutations[i].addedNodes.length) {
          found = true;
          break;
        }
      }
      if (found) {
        scanAndLoadAll();
      }
    });
    mo.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
    });
  }
})();
