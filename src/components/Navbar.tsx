import React from 'react';
import {
  LayoutDashboard,
  Image as ImageIcon,
  FolderKanban,
  Code2,
  Globe,
  Radio,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'creatives' | 'campaigns' | 'tags' | 'sandbox';

interface NavbarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onResetStats: () => void;
  isResetting: boolean;
  autoRefresh: boolean;
  onToggleAutoRefresh: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  onResetStats,
  isResetting,
  autoRefresh,
  onToggleAutoRefresh,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Engine Status */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 text-white font-black text-lg">
              Ad
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-base tracking-tight">AdServer Pro</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Online
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">Central Delivery &amp; Tag Engine</p>
            </div>
          </div>

          {/* Main Navigation Tabs */}
          <nav className="flex items-center space-x-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <button
              id="nav-tab-dashboard"
              onClick={() => onTabChange('dashboard')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              id="nav-tab-creatives"
              onClick={() => onTabChange('creatives')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'creatives'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Creatives &amp; Media</span>
            </button>

            <button
              id="nav-tab-campaigns"
              onClick={() => onTabChange('campaigns')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'campaigns'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FolderKanban className="w-4 h-4" />
              <span>Campaigns</span>
            </button>

            <button
              id="nav-tab-tags"
              onClick={() => onTabChange('tags')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'tags'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>Tag Generator</span>
            </button>

            <button
              id="nav-tab-sandbox"
              onClick={() => onTabChange('sandbox')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'sandbox'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-emerald-400/90 hover:text-emerald-300 hover:bg-emerald-950/40'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span className="flex items-center gap-1">
                Publisher Sandbox
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </span>
            </button>
          </nav>

          {/* Quick Actions & Live Stream indicator */}
          <div className="flex items-center space-x-2">
            <button
              id="btn-auto-refresh"
              onClick={onToggleAutoRefresh}
              title={autoRefresh ? 'Live Polling Active (every 5s)' : 'Live Polling Paused'}
              className={`flex items-center space-x-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                autoRefresh
                  ? 'bg-blue-950/60 text-blue-400 border-blue-800/60'
                  : 'bg-slate-800/40 text-slate-400 border-slate-700/60'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-pulse text-blue-400' : ''}`} />
              <span className="hidden md:inline">{autoRefresh ? 'Live Stream On' : 'Live Off'}</span>
            </button>

            <button
              id="btn-reset-metrics"
              onClick={onResetStats}
              disabled={isResetting}
              title="Reset Impression and Click counters to zero"
              className="flex items-center space-x-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-950/50 hover:text-rose-300 hover:border-rose-800/50 border border-slate-700 text-slate-300 transition-all cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Reset Stats</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
