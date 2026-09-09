import React, { useState } from 'react';
import {
  Globe,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Search,
  Plus,
  Trash2,
  ExternalLink,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Layers,
  MousePointerClick,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { PublisherDomain } from '../types';

interface PublishersViewProps {
  publishers: PublisherDomain[];
  isLoading: boolean;
  onToggleStatus: (id: string, newStatus: 'active' | 'blocked') => Promise<void>;
  onAddDomain: (domain: string, status: 'active' | 'blocked', notes: string) => Promise<void>;
  onDeleteDomain: (id: string) => Promise<void>;
  onRefresh: () => void;
  onNavigateToSandbox: () => void;
}

export const PublishersView: React.FC<PublishersViewProps> = ({
  publishers,
  isLoading,
  onToggleStatus,
  onAddDomain,
  onDeleteDomain,
  onRefresh,
  onNavigateToSandbox,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [newStatus, setNewStatus] = useState<'active' | 'blocked'>('blocked');
  const [newNotes, setNewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Filtered publishers
  const filteredPublishers = publishers.filter((pub) => {
    const matchesSearch = pub.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pub.notes && pub.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus =
      statusFilter === 'all' ? true : pub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Aggregated KPIs
  const totalCount = publishers.length;
  const activeCount = publishers.filter((p) => p.status === 'active').length;
  const blockedCount = publishers.filter((p) => p.status === 'blocked').length;
  const totalRequests = publishers.reduce((sum, p) => sum + (p.totalRequests || 0), 0);
  const totalImpressions = publishers.reduce((sum, p) => sum + (p.impressions || 0), 0);

  const handleToggle = async (pub: PublisherDomain) => {
    const nextStatus = pub.status === 'active' ? 'blocked' : 'active';
    setTogglingId(pub.id);
    try {
      await onToggleStatus(pub.id, nextStatus);
    } finally {
      setTogglingId(null);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddDomain(newDomain.trim(), newStatus, newNotes.trim());
      setNewDomain('');
      setNewNotes('');
      setNewStatus('blocked');
      setIsAddModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Globe className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Website Traffic &amp; Domain Protection
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono border border-slate-700">
              {publishers.length} Detected
            </span>
          </div>
          <p className="text-sm text-slate-400 max-w-3xl">
            Automatically track third-party websites embedding your JavaScript ad tags. Monitor traffic,
            impressions, and clicks, and instantly block or allow ad serving on any domain with one click.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            id="btn-refresh-publishers"
            onClick={onRefresh}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
            title="Refresh domains from server"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            id="btn-add-domain"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add / Block Domain</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Total Detected Websites</p>
            <p className="text-2xl font-bold text-white mt-1">{totalCount}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Embedding your ad tags</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
            <Globe className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Active Serving Domains</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{activeCount}</p>
            <p className="text-[11px] text-emerald-500/80 mt-0.5">Delivering ads normally</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Blocked Domains</p>
            <p className="text-2xl font-bold text-rose-400 mt-1">{blockedCount}</p>
            <p className="text-[11px] text-rose-500/80 mt-0.5">Delivery stopped (0 ads)</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Total Publisher Requests</p>
            <p className="text-2xl font-bold text-cyan-400 mt-1">{totalRequests.toLocaleString()}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {totalImpressions.toLocaleString()} views rendered
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Interactive Sandbox Banner */}
      <div className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border border-blue-900/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center space-x-3">
          <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 mt-0.5 sm:mt-0">
            <Shield className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <span className="font-bold text-slate-200">Real-Time Blocking Verification:</span>
            <span className="text-slate-400 ml-1.5">
              Toggle any website status to <strong>"Blocked"</strong>, then test delivery live in the{' '}
              <button
                onClick={onNavigateToSandbox}
                className="text-cyan-400 underline font-semibold hover:text-cyan-300 cursor-pointer"
              >
                Publisher Sandbox
              </button>{' '}
              (simulating <code>theglobalchronicle.media</code>). The ad delivery tag will immediately halt ad serving and display a blocked warning!
            </span>
          </div>
        </div>
        <button
          onClick={onNavigateToSandbox}
          className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1 font-medium transition-all"
        >
          <span>Open Sandbox</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/70 border border-slate-800 p-3 rounded-xl">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            id="input-search-domains"
            type="text"
            placeholder="Search by domain name (e.g. chronicle, xyz, blog)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setStatusFilter('all')}
              className={`text-xs px-2.5 py-1 rounded-md transition-all font-medium ${
                statusFilter === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`text-xs px-2.5 py-1 rounded-md transition-all font-medium ${
                statusFilter === 'active'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('blocked')}
              className={`text-xs px-2.5 py-1 rounded-md transition-all font-medium ${
                statusFilter === 'blocked'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Blocked ({blockedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Domains Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-xs font-semibold">
                <th className="py-3.5 px-4">Website Domain</th>
                <th className="py-3.5 px-4">Delivery Status &amp; 1-Click Action</th>
                <th className="py-3.5 px-4 text-center">Requests</th>
                <th className="py-3.5 px-4 text-center">Impressions</th>
                <th className="py-3.5 px-4 text-center">Clicks</th>
                <th className="py-3.5 px-4 text-center">CTR</th>
                <th className="py-3.5 px-4">Slots Deployed</th>
                <th className="py-3.5 px-4">Last Traffic</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredPublishers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <Globe className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="font-semibold text-slate-400">No matching publisher domains found</p>
                    <p className="text-xs text-slate-600 mt-1">
                      {searchQuery
                        ? 'Try modifying your search query or filter.'
                        : 'Websites that call your /cdn/ad-loader.js or /api/serve will automatically be listed here.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPublishers.map((pub) => {
                  const isBlocked = pub.status === 'blocked';
                  const isToggling = togglingId === pub.id;
                  const ctr =
                    pub.impressions > 0
                      ? ((pub.clicks / pub.impressions) * 100).toFixed(2)
                      : '0.00';

                  return (
                    <tr
                      key={pub.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isBlocked ? 'bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Domain Name & Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                              isBlocked
                                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                            }`}
                          >
                            {pub.domain.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-white tracking-tight">
                                {pub.domain}
                              </span>
                              {pub.domain === 'theglobalchronicle.media' && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
                                  Sandbox Site
                                </span>
                              )}
                              {pub.domain === 'localhost' && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-700 text-slate-300 font-mono">
                                  Localhost
                                </span>
                              )}
                            </div>
                            {pub.notes && (
                              <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs">
                                {pub.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status & 1-Click Action */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          {isBlocked ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 font-semibold text-[11px]">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span>Blocked</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold text-[11px]">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Serving Active</span>
                            </span>
                          )}

                          {/* 1-Click Toggle Button */}
                          <button
                            id={`btn-toggle-domain-${pub.id}`}
                            onClick={() => handleToggle(pub)}
                            disabled={isToggling}
                            className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 ${
                              isBlocked
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                                : 'bg-rose-600/90 hover:bg-rose-600 text-white shadow-rose-600/20'
                            }`}
                            title={
                              isBlocked
                                ? 'Click to unblock and resume ad delivery on this domain'
                                : 'Click to immediately block ad delivery on this domain'
                            }
                          >
                            {isToggling ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : isBlocked ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Unblock</span>
                              </>
                            ) : (
                              <>
                                <ShieldAlert className="w-3 h-3" />
                                <span>Block</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Traffic stats */}
                      <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                        {pub.totalRequests.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-emerald-400 font-semibold">
                        {pub.impressions.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-blue-400 font-semibold">
                        {pub.clicks.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                        {ctr}%
                      </td>

                      {/* Slots Deployed */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {pub.slotsUsed && pub.slotsUsed.length > 0 ? (
                            pub.slotsUsed.map((slot) => (
                              <span
                                key={slot}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono"
                              >
                                {slot}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-500 italic">None recorded</span>
                          )}
                        </div>
                      </td>

                      {/* Last Traffic Date */}
                      <td className="py-3.5 px-4 text-slate-400">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{formatDate(pub.lastSeen)}</span>
                        </div>
                      </td>

                      {/* Delete */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          id={`btn-delete-domain-${pub.id}`}
                          onClick={() => {
                            if (confirm(`Remove domain '${pub.domain}' from tracking?`)) {
                              onDeleteDomain(pub.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-all cursor-pointer"
                          title="Delete domain record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Add / Blacklist Domain Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-white font-bold text-base">
                <Shield className="w-5 h-5 text-blue-400" />
                <span>Add Website to Protection List</span>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Website Domain Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. badtraffic-bot.xyz or media-partner.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Enter clean domain name or URL. Protocols and paths will automatically be stripped.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Initial Status</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewStatus('blocked')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                      newStatus === 'blocked'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Block (Restrict Ads)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewStatus('active')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                      newStatus === 'active'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Active (Allow Ads)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Notes / Reason</label>
                <textarea
                  placeholder="e.g. Malicious click pattern detected, unauthorized publisher, or pending compliance review..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newDomain.trim()}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold disabled:opacity-50 flex items-center space-x-1.5"
                >
                  {isSubmitting && <RefreshCw className="w-3 h-3 animate-spin" />}
                  <span>Save Domain</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
