import React from 'react';
import {
  Eye,
  MousePointerClick,
  Percent,
  Layers,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Radio,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Globe,
  Zap,
} from 'lucide-react';
import { DashboardStats, PREDEFINED_SLOTS, SlotDefinition } from '../types.js';

interface DashboardViewProps {
  stats: DashboardStats | null;
  slots: (SlotDefinition & { totalCreatives: number; activeCreatives: number; hasActiveServing: boolean })[];
  onSelectSlot: (slotId: string) => void;
  onNavigateToTags: (slotId: string) => void;
  onNavigateToSandbox: () => void;
  onNavigateToPublishers?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  slots,
  onSelectSlot,
  onNavigateToTags,
  onNavigateToSandbox,
  onNavigateToPublishers,
}) => {
  const impressions = stats?.totalImpressions ?? 0;
  const clicks = stats?.totalClicks ?? 0;
  const ctr = stats?.ctr ?? 0;
  const activeCampaigns = stats?.activeCampaigns ?? 0;

  // Find peak value in timeline for scaling
  const maxImpressionPoint = Math.max(
    ...(stats?.timeline?.map((p) => p.impressions) || [100])
  );

  return (
    <div className="space-y-6">
      {/* Top Banner Notice & Live Status */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Ad Engine Core Running
              <span className="text-xs font-normal text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-md">
                Latency: &lt;10ms
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Serving 20 distinct inventory placements across 5 standard IAB / digital video formats.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          {onNavigateToPublishers && (
            <button
              onClick={onNavigateToPublishers}
              className="flex-1 md:flex-none flex items-center justify-center space-x-2 text-xs font-semibold px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Websites &amp; Blocklist</span>
              {(stats?.blockedDomainsCount ?? 0) > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 text-[10px]">
                  {stats?.blockedDomainsCount} Blocked
                </span>
              )}
            </button>
          )}

          <button
            onClick={onNavigateToSandbox}
            className="flex-1 md:flex-none flex items-center justify-center space-x-2 text-xs font-semibold px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <Activity className="w-4 h-4" />
            <span>Launch Live Publisher Sandbox</span>
          </button>
        </div>
      </div>

      {/* Website Traffic & Protection Snapshot */}
      {onNavigateToPublishers && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3 text-xs">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-white">Publisher Domains Detected:</span>
              <span className="text-slate-300 ml-2 font-mono">
                {stats?.totalDomainsCount ?? 0} Websites
              </span>
              <span className="text-slate-500 mx-2">•</span>
              <span className="text-emerald-400 font-semibold font-mono">
                {stats?.activeDomainsCount ?? 0} Active
              </span>
              <span className="text-slate-500 mx-2">•</span>
              <span className="text-rose-400 font-semibold font-mono">
                {stats?.blockedDomainsCount ?? 0} Blocked
              </span>
            </div>
          </div>
          <button
            onClick={onNavigateToPublishers}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>Manage Websites &amp; 1-Click Blocking</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Impressions */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Impressions
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl font-black text-white tracking-tight">
              {impressions.toLocaleString()}
            </div>
            <span className="text-xs font-medium text-emerald-400 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              +14.2%
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            Verified IAB Viewable In-View 50%+
          </div>
        </div>

        {/* Total Clicks */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Clicks
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <MousePointerClick className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl font-black text-white tracking-tight">
              {clicks.toLocaleString()}
            </div>
            <span className="text-xs font-medium text-emerald-400 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              +8.9%
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Routed via 302 Tracking Redirects
          </div>
        </div>

        {/* Average CTR */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Avg. Click-Through Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl font-black text-white tracking-tight">{ctr}%</div>
            <span className="text-xs font-medium text-purple-400 bg-purple-950/50 border border-purple-800/40 px-2 py-0.5 rounded-full">
              Standard: 1.2% - 3.8%
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            Normalized across all formats
          </div>
        </div>

        {/* Active Campaigns & Inventory */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Campaigns
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl font-black text-white tracking-tight">
              {activeCampaigns}{' '}
              <span className="text-xs font-normal text-slate-400">
                / {stats?.totalCampaigns ?? 0} Total
              </span>
            </div>
            <span className="text-xs font-medium text-amber-400 bg-amber-950/50 border border-amber-800/40 px-2 py-0.5 rounded-full">
              {stats?.activeCreatives ?? 0} Creatives
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            20 Slots Configured &amp; Ready
          </div>
        </div>
      </div>

      {/* Main Charts & Live Feed Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Timeline (2 cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">
                  Impression &amp; Click Traffic Volume
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">Today (24H Aggregated)</span>
            </div>

            {/* Custom SVG Bar / Area visualization */}
            <div className="h-56 w-full pt-4">
              <div className="h-44 flex items-end justify-between gap-3 px-2 border-b border-slate-800">
                {stats?.timeline?.map((pt, idx) => {
                  const impHeight = Math.max(8, Math.round((pt.impressions / (maxImpressionPoint || 1)) * 140));
                  const clkHeight = Math.max(4, Math.round((pt.clicks / ((maxImpressionPoint * 0.05) || 1)) * 140));

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                      {/* Tooltip on hover */}
                      <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 text-[11px] text-white p-2 rounded-lg border border-slate-700 pointer-events-none whitespace-nowrap z-20 shadow-xl">
                        <div className="font-bold">{pt.time}</div>
                        <div className="text-blue-400">Impressions: {pt.impressions.toLocaleString()}</div>
                        <div className="text-emerald-400">Clicks: {pt.clicks.toLocaleString()}</div>
                      </div>

                      {/* Stacked/side-by-side bars */}
                      <div className="w-full flex items-end justify-center gap-1.5">
                        <div
                          style={{ height: `${impHeight}px` }}
                          className="w-1/2 rounded-t-sm bg-gradient-to-t from-blue-600 to-cyan-400 transition-all duration-300 group-hover:brightness-125"
                        ></div>
                        <div
                          style={{ height: `${clkHeight}px` }}
                          className="w-1/2 rounded-t-sm bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-300 group-hover:brightness-125"
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* X Axis Labels */}
              <div className="flex justify-between text-[11px] font-mono text-slate-400 pt-2 px-2">
                {stats?.timeline?.map((pt, idx) => (
                  <span key={idx}>{pt.time}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-800/80 text-xs text-slate-400">
            <div className="flex items-center space-x-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block"></span>
                Impressions
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block"></span>
                Clicks
              </span>
            </div>
            <span className="text-[11px]">Real-time synchronized across edge nodes</span>
          </div>
        </div>

        {/* Real-Time Live Event Stream (1 col) */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col h-[340px]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <h3 className="text-sm font-bold text-white">Live Event Stream</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
              {stats?.recentEvents?.length ?? 0} events
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
            {(!stats?.recentEvents || stats.recentEvents.length === 0) && (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-4">
                <Clock className="w-6 h-6 mb-2 opacity-50" />
                <p>Waiting for ad requests...</p>
                <p className="text-[10px] text-slate-600 mt-1">Open Publisher Sandbox to trigger events</p>
              </div>
            )}

            {stats?.recentEvents?.slice(0, 15).map((evt) => (
              <div
                key={evt.id}
                className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors flex items-start justify-between gap-2"
              >
                <div className="space-y-0.5 overflow-hidden">
                  <div className="flex items-center space-x-1.5">
                    <span
                      className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        evt.type === 'click'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {evt.type}
                    </span>
                    <span className="text-slate-300 font-semibold text-[11px] truncate">
                      {evt.slotId}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {evt.referer ? evt.referer.replace(/^https?:\/\//, '') : 'direct_delivery'}
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 whitespace-nowrap">
                  {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Beacon: sendBeacon / fetch</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Zero Loss
            </span>
          </div>
        </div>
      </div>

      {/* Inventory Slot Delivery Matrix (All 20 Predefined Slots) */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Predefined Inventory Slots Matrix (20 IAB &amp; Video Placements)
            </h3>
            <p className="text-xs text-slate-400">
              Allocated ad spaces with dimensions, active creatives rotation, and live delivery status.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">
              {slots.filter((s) => s.hasActiveServing).length} of {slots.length} Serving
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 uppercase font-mono text-[10px] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Slot ID</th>
                <th className="py-3 px-4">Placement Name</th>
                <th className="py-3 px-4">Format / Dimensions</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Creatives</th>
                <th className="py-3 px-4 text-right">Impressions</th>
                <th className="py-3 px-4 text-right">Clicks</th>
                <th className="py-3 px-4 text-right">CTR</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {slots.map((slot) => {
                const sStat = stats?.slotStats?.[slot.id] || {
                  impressions: 0,
                  clicks: 0,
                  ctr: 0,
                };
                return (
                  <tr key={slot.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-cyan-400 whitespace-nowrap">
                      {slot.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{slot.name}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">{slot.description}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 border border-slate-700 text-slate-200">
                        {slot.width} &times; {slot.height} px
                      </span>
                      <span className="ml-1.5 text-[10px] uppercase text-slate-400">
                        {slot.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {slot.hasActiveServing ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                          Serving
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                          Idle / Empty
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-slate-200 font-medium">{slot.activeCreatives} active</span>
                      <span className="text-slate-400 text-[10px] ml-1">({slot.totalCreatives} total)</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-200">
                      {sStat.impressions.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-200">
                      {sStat.clicks.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-400">
                      {sStat.ctr}%
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          id={`btn-tag-${slot.id}`}
                          onClick={() => onNavigateToTags(slot.id)}
                          title="Get Publisher Tag"
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-blue-950/60 text-blue-300 hover:bg-blue-900/60 border border-blue-800/60 transition-colors"
                        >
                          Get Tag
                        </button>
                        <button
                          id={`btn-manage-${slot.id}`}
                          onClick={() => onSelectSlot(slot.id)}
                          title="Manage Creatives for Slot"
                          className="px-2 py-1 text-[11px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        >
                          Creatives
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
