import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, NavTab } from './components/Navbar.js';
import { DashboardView } from './components/DashboardView.js';
import { CreativesView } from './components/CreativesView.js';
import { CampaignsView } from './components/CampaignsView.js';
import { PublishersView } from './components/PublishersView.js';
import { TagGeneratorView } from './components/TagGeneratorView.js';
import { PublisherSandboxView } from './components/PublisherSandboxView.js';
import { Campaign, Creative, DashboardStats, PREDEFINED_SLOTS, PublisherDomain, SlotDefinition } from './types.js';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [slots, setSlots] = useState<
    (SlotDefinition & { totalCreatives: number; activeCreatives: number; hasActiveServing: boolean })[]
  >([]);
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [publishers, setPublishers] = useState<PublisherDomain[]>([]);
  const [isPublishersLoading, setIsPublishersLoading] = useState(false);
  const [selectedSlotFilter, setSelectedSlotFilter] = useState<string>('all');
  const [tagSlotId, setTagSlotId] = useState<string>('MR-300x250-1');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      const [statsRes, slotsRes, creativesRes, campaignsRes, pubRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/slots'),
        fetch('/api/creatives'),
        fetch('/api/campaigns'),
        fetch('/api/publishers'),
      ]);

      if (statsRes.ok) {
        const d = await statsRes.json();
        setStats(d);
      }
      if (slotsRes.ok) {
        const d = await slotsRes.json();
        setSlots(d);
      }
      if (creativesRes.ok) {
        const d = await creativesRes.json();
        setCreatives(d);
      }
      if (campaignsRes.ok) {
        const d = await campaignsRes.json();
        setCampaigns(d);
      }
      if (pubRes.ok) {
        const d = await pubRes.json();
        setPublishers(d);
      }
    } catch (err) {
      console.error('Failed to load adserver data:', err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Live polling every 4 seconds for real-time impression & click streams
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchData();
    }, 4000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  // Save or update creative
  const handleSaveCreative = async (creativeData: Partial<Creative>, isNew: boolean) => {
    try {
      const url = isNew ? '/api/creatives' : `/api/creatives/${creativeData.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creativeData),
      });

      if (res.ok) {
        showNotification(isNew ? 'Creative deployed successfully!' : 'Creative updated!');
        await fetchData();
      } else {
        const err = await res.json();
        alert('Failed to save creative: ' + (err.error || 'Server error'));
      }
    } catch (err: any) {
      alert('Error saving creative: ' + err.message);
    }
  };

  // Delete creative
  const handleDeleteCreative = async (id: string) => {
    if (!confirm('Are you sure you want to delete this creative?')) return;
    try {
      const res = await fetch(`/api/creatives/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showNotification('Creative deleted');
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle status of creative
  const handleToggleStatus = async (creative: Creative) => {
    const newStatus = creative.status === 'active' ? 'paused' : 'active';
    try {
      const res = await fetch(`/api/creatives/${creative.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showNotification(`Creative ${newStatus === 'active' ? 'activated' : 'paused'}`);
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save campaign
  const handleSaveCampaign = async (campaignData: Partial<Campaign>, isNew: boolean) => {
    try {
      const url = isNew ? '/api/campaigns' : `/api/campaigns/${campaignData.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignData),
      });

      if (res.ok) {
        showNotification(isNew ? 'Campaign created!' : 'Campaign updated!');
        await fetchData();
      }
    } catch (err: any) {
      alert('Error saving campaign: ' + err.message);
    }
  };

  // Delete campaign
  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign? All assigned creatives will also be removed.')) return;
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showNotification('Campaign removed');
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Reset telemetry stats
  const handleResetStats = async () => {
    if (!confirm('Reset all Impression and Click counters across all campaigns to 0?')) return;
    setIsResetting(true);
    try {
      const res = await fetch('/api/reset-stats', { method: 'POST' });
      if (res.ok) {
        showNotification('All impression and click statistics reset to 0.');
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsResetting(false);
    }
  };

  // Publisher Domain Management Handlers
  const handleToggleDomainStatus = async (id: string, newStatus: 'active' | 'blocked') => {
    try {
      const res = await fetch(`/api/publishers/${id}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated: PublisherDomain = await res.json();
        setPublishers((prev) => prev.map((p) => (p.id === id ? updated : p)));
        showNotification(
          newStatus === 'blocked'
            ? `🚫 Website '${updated.domain}' is now BLOCKED from serving ads.`
            : `✅ Website '${updated.domain}' is now UNBLOCKED and delivering ads.`
        );
        fetchData();
      }
    } catch (err: any) {
      console.error('Failed to toggle domain:', err);
      alert('Failed to update domain: ' + err.message);
    }
  };

  const handleAddDomain = async (domain: string, status: 'active' | 'blocked', notes: string) => {
    try {
      const res = await fetch('/api/publishers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, status, notes }),
      });
      if (res.ok) {
        showNotification(`Domain '${domain}' added (${status === 'blocked' ? 'Blocked' : 'Active'})`);
        await fetchData();
      }
    } catch (err: any) {
      console.error(err);
      alert('Error adding domain: ' + err.message);
    }
  };

  const handleDeleteDomain = async (id: string) => {
    try {
      const res = await fetch(`/api/publishers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showNotification('Domain removed from tracking list');
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Navigation callbacks
  const handleSelectSlotFromDashboard = (slotId: string) => {
    setSelectedSlotFilter(slotId);
    setCurrentTab('creatives');
  };

  const handleNavigateToTags = (slotId: string) => {
    setTagSlotId(slotId);
    setCurrentTab('tags');
  };

  const handleNavigateToSandbox = () => {
    setCurrentTab('sandbox');
  };

  const blockedDomainsCount = publishers.filter((p) => p.status === 'blocked').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-semibold animate-in fade-in duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{notification}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onResetStats={handleResetStats}
        isResetting={isResetting}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={() => setAutoRefresh(!autoRefresh)}
        blockedCount={blockedDomainsCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <DashboardView
            stats={stats}
            slots={slots.length > 0 ? slots : (PREDEFINED_SLOTS as any)}
            onSelectSlot={handleSelectSlotFromDashboard}
            onNavigateToTags={handleNavigateToTags}
            onNavigateToSandbox={handleNavigateToSandbox}
            onNavigateToPublishers={() => setCurrentTab('publishers')}
          />
        )}

        {currentTab === 'creatives' && (
          <CreativesView
            creatives={creatives}
            campaigns={campaigns}
            selectedSlotFilter={selectedSlotFilter}
            onSelectSlotFilter={setSelectedSlotFilter}
            onSaveCreative={handleSaveCreative}
            onDeleteCreative={handleDeleteCreative}
            onToggleStatus={handleToggleStatus}
          />
        )}

        {currentTab === 'campaigns' && (
          <CampaignsView
            campaigns={campaigns}
            creatives={creatives}
            onSaveCampaign={handleSaveCampaign}
            onDeleteCampaign={handleDeleteCampaign}
          />
        )}

        {currentTab === 'publishers' && (
          <PublishersView
            publishers={publishers}
            isLoading={isPublishersLoading}
            onToggleStatus={handleToggleDomainStatus}
            onAddDomain={handleAddDomain}
            onDeleteDomain={handleDeleteDomain}
            onRefresh={fetchData}
            onNavigateToSandbox={handleNavigateToSandbox}
          />
        )}

        {currentTab === 'tags' && (
          <TagGeneratorView
            initialSlotId={tagSlotId}
            onNavigateToSandbox={handleNavigateToSandbox}
          />
        )}

        {currentTab === 'sandbox' && (
          <PublisherSandboxView onAdEventTriggered={fetchData} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AdServer Pro &bull; Production-Grade Central Delivery &amp; Management Architecture</span>
          <span className="text-slate-400">
            CORS Active &bull; Low-Latency Delivery &bull; IAB 50% Viewability
          </span>
        </div>
      </footer>
    </div>
  );
}
