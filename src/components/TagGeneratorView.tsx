import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Globe,
  Sliders,
  Sparkles,
  ExternalLink,
  Layers,
  Terminal,
} from 'lucide-react';
import { PREDEFINED_SLOTS, SlotDefinition } from '../types.js';

interface TagGeneratorViewProps {
  initialSlotId?: string;
  onNavigateToSandbox: () => void;
}

export const TagGeneratorView: React.FC<TagGeneratorViewProps> = ({
  initialSlotId = 'MR-300x250-1',
  onNavigateToSandbox,
}) => {
  const [selectedSlotId, setSelectedSlotId] = useState(initialSlotId);
  const [centerBanner, setCenterBanner] = useState(true);
  const [includeComment, setIncludeComment] = useState(true);
  const [includeLoaderScript, setIncludeLoaderScript] = useState(true);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedApi, setCopiedApi] = useState(false);

  const selectedSlot =
    PREDEFINED_SLOTS.find((s) => s.id === selectedSlotId) || PREDEFINED_SLOTS[0];

  // Resolve current origin or fallback
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://my-ad-server.com';
  const cdnUrl = `${origin}/cdn/ad-loader.js`;
  const apiUrl = `${origin}/api/serve?slot=${selectedSlot.id}`;

  // Generate publisher HTML tag
  const generateSnippet = () => {
    let code = '';
    if (includeComment) {
      code += `<!-- AdServer Placement: ${selectedSlot.name} (${selectedSlot.width}x${selectedSlot.height}) -->\n`;
    }

    if (centerBanner) {
      code += `<div style="display: flex; justify-content: center; margin: 16px 0;">\n`;
      code += `  <div class="ad-container" data-ad-slot="${selectedSlot.id}"></div>\n`;
      code += `</div>\n`;
    } else {
      code += `<div class="ad-container" data-ad-slot="${selectedSlot.id}"></div>\n`;
    }

    if (includeLoaderScript) {
      code += `<script async src="${cdnUrl}"></script>`;
    }

    return code;
  };

  const codeSnippet = generateSnippet();

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(codeSnippet);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  };

  const handleCopyApi = () => {
    navigator.clipboard.writeText(apiUrl);
    setCopiedApi(true);
    setTimeout(() => setCopiedApi(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Code2 className="w-5 h-5 text-blue-400" />
            Publisher Ad Tag Generator
          </h2>
          <p className="text-xs text-slate-400">
            Generate lightweight, non-blocking asynchronous JavaScript tags ready to embed on third-party publisher websites.
          </p>
        </div>

        <button
          onClick={onNavigateToSandbox}
          className="flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <Globe className="w-4 h-4" />
          <span>Test in Live Publisher Sandbox</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Configuration Controls */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-5">
          <div>
            <h3 className="text-sm font-bold text-white mb-3">1. Select Inventory Slot</h3>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Target Ad Slot ID:
            </label>
            <select
              value={selectedSlotId}
              onChange={(e) => setSelectedSlotId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-400 focus:outline-none focus:border-blue-500"
            >
              {PREDEFINED_SLOTS.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {slot.id} — {slot.name} ({slot.width}x{slot.height}px)
                </option>
              ))}
            </select>

            {/* Slot Details Card */}
            <div className="mt-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">IAB Format:</span>
                <span className="font-semibold text-white uppercase">{selectedSlot.category.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Pixel Dimensions:</span>
                <span className="font-mono text-cyan-400 font-bold">
                  {selectedSlot.width} &times; {selectedSlot.height} px
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Media Type:</span>
                <span className="text-emerald-400 font-medium">
                  {selectedSlot.allowedFormats.join(', ')}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 pt-1.5 border-t border-slate-800/80">
                {selectedSlot.description}
              </p>
            </div>
          </div>

          {/* Tag Options */}
          <div className="pt-3 border-t border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white">2. Tag Options</h3>

            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={centerBanner}
                onChange={(e) => setCenterBanner(e.target.checked)}
                className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0"
              />
              <span>Wrap with flexbox horizontal centering</span>
            </label>

            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeComment}
                onChange={(e) => setIncludeComment(e.target.checked)}
                className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0"
              />
              <span>Include descriptive HTML comment</span>
            </label>

            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeLoaderScript}
                onChange={(e) => setIncludeLoaderScript(e.target.checked)}
                className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0"
              />
              <span>Include &lt;script async src="ad-loader.js"&gt;</span>
            </label>
          </div>

          {/* CDN Deliverability note */}
          <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/40 text-[11px] text-blue-300 space-y-1">
            <span className="font-bold flex items-center gap-1 text-blue-200">
              <Sparkles className="w-3.5 h-3.5" /> High Performance Edge Script
            </span>
            <p className="text-blue-300/80">
              The tag script is only ~3KB, loads asynchronously without blocking DOM rendering, and automatically detects subsequent dynamically inserted ads via MutationObserver.
            </p>
          </div>
        </div>

        {/* Right Columns: Ready-to-paste Code Snippet & API Direct */}
        <div className="lg:col-span-2 space-y-5">
          {/* HTML Publisher Tag Box */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                <h3 className="text-sm font-bold text-white">
                  Ready-to-Paste Publisher HTML Tag
                </h3>
              </div>
              <button
                id="btn-copy-html-tag"
                onClick={handleCopyHtml}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              >
                {copiedHtml ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedHtml ? 'Copied Tag!' : 'Copy Publisher Code'}</span>
              </button>
            </div>

            <div className="relative group">
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-cyan-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {codeSnippet}
              </pre>
            </div>

            <p className="text-xs text-slate-400">
              Publishers paste this code snippet into their page markup wherever they want the ad to appear. Multiple tags for different slots can be placed on the same page.
            </p>
          </div>

          {/* Headless API Endpoint for Mobile Apps & JAMStack */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  Headless REST Delivery API (Mobile &amp; In-App)
                </h3>
              </div>
              <button
                onClick={handleCopyApi}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
              >
                {copiedApi ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedApi ? 'Copied URL!' : 'Copy Endpoint URL'}</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-slate-300 break-all flex items-center justify-between gap-2">
              <span className="text-emerald-400 font-bold">GET</span>
              <span className="text-slate-300 flex-1 truncate">{apiUrl}</span>
            </div>

            {/* Sample JSON Response */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono text-slate-400">Sample JSON Payload (Ultra-Low Latency Edge Response):</span>
              <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-400 overflow-x-auto">
{`{
  "ad": {
    "creativeId": "cr-mr-01",
    "slotId": "${selectedSlot.id}",
    "formatType": "${selectedSlot.category === 'video' ? 'video' : 'image'}",
    "mediaUrl": "${origin}/uploads/banner.png",
    "targetUrl": "https://example.com/landing",
    "clickUrl": "${origin}/api/click/cr-mr-01?dest=https%3A%2F%2Fexample.com",
    "impressionUrl": "${origin}/api/impression/cr-mr-01",
    "width": ${selectedSlot.width},
    "height": ${selectedSlot.height}
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
