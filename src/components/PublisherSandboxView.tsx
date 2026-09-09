import React, { useEffect, useState, useRef } from 'react';
import {
  Globe,
  RefreshCw,
  Eye,
  MousePointerClick,
  Activity,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Info,
  Plus,
} from 'lucide-react';
import { PREDEFINED_SLOTS } from '../types.js';

interface PublisherSandboxViewProps {
  onAdEventTriggered?: () => void;
}

export const PublisherSandboxView: React.FC<PublisherSandboxViewProps> = ({
  onAdEventTriggered,
}) => {
  const [selectedPreviewSlot, setSelectedPreviewSlot] = useState<string>('LB-728x90-1');
  const [activeTab, setActiveTab] = useState<'article' | 'inspector'>('article');
  const [renderedCount, setRenderedCount] = useState(0);
  const [dynamicSlots, setDynamicSlots] = useState<string[]>([]);
  const [lastEvent, setLastEvent] = useState<string>('Waiting for ad rendering...');

  // Initialize or scan ads
  const triggerScan = () => {
    if (typeof window !== 'undefined' && (window as any).AdServer) {
      (window as any).AdServer.scan();
      // Count rendered ads in DOM
      setTimeout(() => {
        const rendered = document.querySelectorAll('.ad-container[data-ad-status="rendered"]');
        setRenderedCount(rendered.length);
      }, 500);
    }
  };

  useEffect(() => {
    // Dynamically ensure ad-loader script is present if not already
    const scriptId = 'ad-loader-script-runtime';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = '/cdn/ad-loader.js';
      script.async = true;
      script.onload = () => {
        triggerScan();
      };
      document.body.appendChild(script);
    } else {
      triggerScan();
    }

    const interval = setInterval(() => {
      const rendered = document.querySelectorAll('.ad-container[data-ad-status="rendered"]');
      setRenderedCount(rendered.length);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const handleRefreshAds = () => {
    if (typeof window !== 'undefined' && (window as any).AdServer) {
      (window as any).AdServer.refresh();
      setLastEvent('Refreshed all ad inventory slots via window.AdServer.refresh()');
      if (onAdEventTriggered) onAdEventTriggered();
    }
  };

  const handleInjectDynamicAd = () => {
    const nextSlot = PREDEFINED_SLOTS[(dynamicSlots.length + 5) % PREDEFINED_SLOTS.length].id;
    setDynamicSlots((prev) => [...prev, nextSlot]);
    setLastEvent(`Injected new dynamic ad slot: ${nextSlot} (MutationObserver auto-render)`);
    if (onAdEventTriggered) onAdEventTriggered();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Control Panel */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-white">
                Live Publisher Sandbox Environment
              </h2>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                Simulated Third-Party Site
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Demonstrating real-world delivery via <code className="text-cyan-400">ad-loader.js</code>, viewability IntersectionObserver, and 302 click redirects.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <button
            id="btn-refresh-sandbox-ads"
            onClick={handleRefreshAds}
            className="flex-1 md:flex-none flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Ads</span>
          </button>

          <button
            id="btn-inject-dynamic-slot"
            onClick={handleInjectDynamicAd}
            className="flex-1 md:flex-none flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Inject Dynamic Slot</span>
          </button>
        </div>
      </div>

      {/* Simulated Browser Window Wrapper */}
      <div className="rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl overflow-hidden">
        {/* Browser Top Chrome / URL Bar */}
        <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
            <span className="text-xs text-slate-400 font-mono ml-2 hidden sm:inline">
              Third-Party Publisher Window
            </span>
          </div>

          <div className="flex-1 max-w-lg mx-4 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 text-xs text-slate-400 font-mono flex items-center space-x-2">
            <span className="text-emerald-400">https://</span>
            <span className="text-slate-200">www.theglobalchronicle.media/tech-infrastructure-2026</span>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span className="font-mono text-cyan-400 font-bold">{renderedCount} Ads Loaded</span>
          </div>
        </div>

        {/* Publisher Webpage Content */}
        <div className="bg-slate-900 text-slate-200 p-6 space-y-8 max-h-[85vh] overflow-y-auto">
          {/* Site Header */}
          <header className="border-b border-slate-800 pb-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 font-bold">
                The Global Chronicle
              </span>
              <h1 className="text-xl font-black text-white tracking-tight">
                Global Technology &amp; Market Intelligence
              </h1>
            </div>
            <div className="text-right text-xs text-slate-400 hidden sm:block">
              <div>September 8, 2026</div>
              <div className="text-slate-500">Edition: North America &amp; Global</div>
            </div>
          </header>

          {/* 1. TOP HEADER LEADERBOARD AD: LB-728x90-1 */}
          <div className="text-center">
            <span className="text-[10px] uppercase font-mono text-slate-500 block mb-1">
              Top Placement: Leaderboard (LB-728x90-1)
            </span>
            <div className="flex justify-center">
              <div className="ad-container" data-ad-slot="LB-728x90-1"></div>
            </div>
          </div>

          {/* Main Article & Sidebar Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left 2 Cols: Editorial Content */}
            <article className="lg:col-span-2 space-y-5 text-sm text-slate-300 leading-relaxed font-sans">
              <div className="space-y-2">
                <span className="text-xs uppercase font-bold text-blue-400 tracking-wider">
                  Cloud Infrastructure &amp; Edge Compute
                </span>
                <h2 className="text-2xl font-bold text-white tracking-tight leading-snug">
                  The Zero-Latency Web: How Distributed Edge Networks &amp; Autonomous Ad Delivery Reshape Global Publishing
                </h2>
                <div className="flex items-center space-x-3 text-xs text-slate-400 pt-1">
                  <span>By Sarah Jenkins, Chief Systems Editor</span>
                  <span>&bull;</span>
                  <span>7 min read</span>
                </div>
              </div>

              <p>
                In the modern digital publishing economy, speed is everything. Latency beyond 100 milliseconds directly correlates with bounce rates and user disengagement. As third-party cookies continue their sunset, high-performance, self-hosted ad server architectures are replacing legacy heavyweight ad networks.
              </p>

              <p>
                Leading media enterprises now insist on lightweight, non-blocking delivery tags that execute asynchronously without impeding Core Web Vitals. True viewability measurement—governed by the IAB standard of at least 50% pixel visibility within the active viewport—ensures advertisers only pay for verified consumer engagement.
              </p>

              {/* 2. IN-ARTICLE MEDIUM RECTANGLE AD: MR-300x250-1 */}
              <div className="my-6 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-mono text-slate-500 block mb-2">
                  In-Article Placement: Medium Rectangle (MR-300x250-1)
                </span>
                <div className="flex justify-center">
                  <div className="ad-container" data-ad-slot="MR-300x250-1"></div>
                </div>
              </div>

              <p>
                Furthermore, modern programmatic video delivery is transitioning from intrusive interruptive pre-rolls toward seamless outstream in-page experiences. When readers scroll past editorial paragraphs, responsive players initialize quietly in muted states, offering high-fidelity video without disrupting reading continuity.
              </p>

              {/* 3. OUTSTREAM VIDEO AD: VID-01 */}
              <div className="my-6 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-mono text-purple-400 font-bold block mb-2">
                  Featured Outstream Video Placement (VID-01)
                </span>
                <div className="flex justify-center">
                  <div className="ad-container" data-ad-slot="VID-01"></div>
                </div>
              </div>

              <p>
                Real-time attribution is the cornerstone of trust between publishers and ad buyers. Through direct 302 tracking redirections and keepalive beacon telemetry, impression and click events are verified synchronously, eliminating intermediary discrepancy gaps.
              </p>

              {/* DYNAMICALLY INJECTED AD SLOTS (Demonstrating MutationObserver) */}
              {dynamicSlots.map((slotId, index) => (
                <div
                  key={`${slotId}-${index}`}
                  className="my-6 p-4 rounded-xl bg-blue-950/30 border border-blue-800/40 text-center animate-in fade-in duration-500"
                >
                  <span className="text-[10px] uppercase font-mono text-blue-400 font-bold block mb-2">
                    Dynamically Injected Slot #{index + 1}: {slotId}
                  </span>
                  <div className="flex justify-center">
                    <div className="ad-container" data-ad-slot={slotId}></div>
                  </div>
                </div>
              ))}
            </article>

            {/* Right 1 Col: Publisher Sidebar with Half-Page (300x600) */}
            <aside className="space-y-6">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-mono text-slate-500 block mb-2">
                  Premium Sidebar Slot: Half Page (SB-300x600-1)
                </span>
                <div className="flex justify-center">
                  <div className="ad-container" data-ad-slot="SB-300x600-1"></div>
                </div>
              </div>

              {/* Trending Headlines Widget */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-2">
                  Trending Industry Analysis
                </h3>
                <div className="space-y-2.5">
                  <a href="#test" className="block text-slate-300 hover:text-white transition-colors">
                    &bull; Next-generation container orchestration benchmarks for 2026
                  </a>
                  <a href="#test" className="block text-slate-300 hover:text-white transition-colors">
                    &bull; Global data privacy regulations and first-party identity resolution
                  </a>
                  <a href="#test" className="block text-slate-300 hover:text-white transition-colors">
                    &bull; Autonomous network security: AI-driven DDoS mitigation
                  </a>
                </div>
              </div>
            </aside>
          </div>

          {/* 4. WIDE BILLBOARD AD: BB-970x250-1 */}
          <div className="pt-6 border-t border-slate-800 text-center">
            <span className="text-[10px] uppercase font-mono text-slate-500 block mb-2">
              Pre-Footer Placement: Billboard (BB-970x250-1)
            </span>
            <div className="flex justify-center overflow-x-auto">
              <div className="ad-container" data-ad-slot="BB-970x250-1"></div>
            </div>
          </div>

          {/* Publisher Footer */}
          <footer className="pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
            &copy; 2026 The Global Chronicle Media Group. All rights reserved. Advertising served via AdServer Pro.
          </footer>
        </div>
      </div>
    </div>
  );
};
