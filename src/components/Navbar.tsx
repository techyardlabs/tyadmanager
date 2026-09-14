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
  Shield,
  ShieldAlert,
  Users,
  LogOut,
} from 'lucide-react';
import { UserAccount } from '../types.js';
import { TechYardMark } from './TechYardLogo.js';

export type NavTab =
  | 'dashboard'
  | 'creatives'
  | 'campaigns'
  | 'publishers'
  | 'tags'
  | 'sandbox'
  | 'users';

interface NavbarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onResetStats: () => void;
  isResetting: boolean;
  autoRefresh: boolean;
  onToggleAutoRefresh: () => void;
  blockedCount?: number;
  currentUser?: UserAccount | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  onResetStats,
  isResetting,
  autoRefresh,
  onToggleAutoRefresh,
  blockedCount = 0,
  currentUser,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Engine Status */}
          <div className="flex items-center space-x-3">
            <div className="relative group cursor-pointer" onClick={() => onTabChange('dashboard')}>
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-cyan-500/20 to-purple-500/20 blur-md rounded-xl opacity-75 group-hover:opacity-100 transition-opacity" />
              <TechYardMark className="w-10 h-10 relative z-10 drop-shadow" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-white text-base tracking-tight">
                  TECHYARD <span className="text-cyan-400 font-semibold">LABS</span>
                </span>
                <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  AdServer
                </span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Online
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
                Empowered By Innovation
              </p>
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
              id="nav-tab-publishers"
              onClick={() => onTabChange('publishers')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'publishers'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span className="flex items-center gap-1.5">
                Websites &amp; Blocking
                {blockedCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold border border-rose-500/30">
                    {blockedCount}
                  </span>
                )}
              </span>
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

            <button
              id="nav-tab-users"
              onClick={() => onTabChange('users')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'users'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Users &amp; Security</span>
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

            {currentUser && (
              <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-800">
                <button
                  onClick={() => onTabChange('users')}
                  title="My Account & Security"
                  className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 text-left transition-colors cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-[10px] font-bold">
                    {currentUser.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="hidden xl:block text-left">
                    <div className="text-xs font-semibold text-slate-200 leading-tight">
                      {currentUser.username}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono capitalize">
                      {currentUser.role}
                    </div>
                  </div>
                </button>

                {onLogout && (
                  <button
                    onClick={onLogout}
                    title="Sign Out of Portal"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
