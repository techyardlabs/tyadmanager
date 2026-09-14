import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, NavTab } from './components/Navbar.js';
import { DashboardView } from './components/DashboardView.js';
import { CreativesView } from './components/CreativesView.js';
import { CampaignsView } from './components/CampaignsView.js';
import { PublishersView } from './components/PublishersView.js';
import { TagGeneratorView } from './components/TagGeneratorView.js';
import { PublisherSandboxView } from './components/PublisherSandboxView.js';
import { LoginView } from './components/LoginView.js';
import { UserManagementView } from './components/UserManagementView.js';
import { TechYardMark } from './components/TechYardLogo.js';
import { Campaign, Creative, DashboardStats, PREDEFINED_SLOTS, PublisherDomain, SlotDefinition, UserAccount } from './types.js';

export default function App() {
  // Authentication State
  const [user, setUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('adserver_auth_user') || sessionStorage.getItem('adserver_auth_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('adserver_auth_token') || sessionStorage.getItem('adserver_auth_token');
  });

  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

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

  // Verify stored session on boot
  useEffect(() => {
    const verifySession = async () => {
      const savedToken =
        localStorage.getItem('adserver_auth_token') ||
        sessionStorage.getItem('adserver_auth_token');

      if (!savedToken) {
        setUser(null);
        setToken(null);
        setIsAuthChecking(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${savedToken}` },
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setToken(savedToken);
        } else {
          // Token expired or invalid
          localStorage.removeItem('adserver_auth_token');
          localStorage.removeItem('adserver_auth_user');
          sessionStorage.removeItem('adserver_auth_token');
          sessionStorage.removeItem('adserver_auth_user');
          setUser(null);
          setToken(null);
        }
      } catch (err) {
        console.warn('Network issue during session check:', err);
      } finally {
        setIsAuthChecking(false);
      }
    };

    verifySession();
  }, []);

  const handleLoginSuccess = (loggedInUser: UserAccount, authToken: string) => {
    setUser(loggedInUser);
    setToken(authToken);
    showNotification(`Signed in as ${loggedInUser.name || loggedInUser.username}`);
  };

  const handleLogout = async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.warn('Logout error', err);
      }
    }

    localStorage.removeItem('adserver_auth_token');
    localStorage.removeItem('adserver_auth_user');
    sessionStorage.removeItem('adserver_auth_token');
    sessionStorage.removeItem('adserver_auth_user');
    setUser(null);
    setToken(null);
    setCurrentTab('dashboard');
    showNotification('Signed out of portal');
  };

  // Authenticated fetch wrapper
  const authFetch = useCallback(
    (url: string, options: RequestInit = {}) => {
      const headers = {
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      return fetch(url, { ...options, headers });
    },
    [token]
  );

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const [statsRes, slotsRes, creativesRes, campaignsRes, pubRes] = await Promise.all([
        authFetch('/api/dashboard/stats'),
        authFetch('/api/slots'),
        authFetch('/api/creatives'),
        authFetch('/api/campaigns'),
        authFetch('/api/publishers'),
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
  }, [token, authFetch]);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [fetchData, token]);

  // Live polling every 4 seconds for real-time impression & click streams
  useEffect(() => {
    if (!autoRefresh || !token) return;
    const interval = setInterval(() => {
      fetchData();
    }, 4000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData, token]);

  // Save or update creative
  const handleSaveCreative = async (creativeData: Partial<Creative>, isNew: boolean) => {
    try {
      const url = isNew ? '/api/creatives' : `/api/creatives/${creativeData.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await authFetch(url, {
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
      const res = await authFetch(`/api/creatives/${id}`, { method: 'DELETE' });
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
      const res = await authFetch(`/api/creatives/${creative.id}`, {
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

      const res = await authFetch(url, {
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
      const res = await authFetch(`/api/campaigns/${id}`, { method: 'DELETE' });
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
      const res = await authFetch('/api/reset-stats', { method: 'POST' });
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
      const res = await authFetch(`/api/publishers/${id}/toggle`, {
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
      const res = await authFetch('/api/publishers', {
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
      const res = await authFetch(`/api/publishers/${id}`, { method: 'DELETE' });
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

  // Render Authentication Loading State
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-9 h-9 border-2 border-blue-500/20 border-t-cyan-400 rounded-full animate-spin mb-3" />
        <span className="text-xs font-mono text-slate-400">Authenticating Portal Session...</span>
      </div>
    );
  }

  // Render Login Gate if unauthenticated
  if (!user || !token) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

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
        currentUser={user}
        onLogout={handleLogout}
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

        {currentTab === 'users' && (
          <UserManagementView
            currentUser={user}
            authToken={token}
            onUserUpdated={(updated) => {
              setUser(updated);
              if (localStorage.getItem('adserver_auth_token')) {
                localStorage.setItem('adserver_auth_user', JSON.stringify(updated));
              } else {
                sessionStorage.setItem('adserver_auth_user', JSON.stringify(updated));
              }
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <TechYardMark className="w-5 h-5 shrink-0" />
            <span className="text-slate-200 font-bold tracking-tight">TECHYARD <span className="text-cyan-400 font-medium">LABS</span></span>
            <span className="text-slate-700 hidden sm:inline">&bull;</span>
            <span className="text-slate-400 text-[11px] tracking-wider uppercase hidden sm:inline">Empowered by Innovation</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <span>AdServer Pro</span>
            <span className="text-slate-700">&bull;</span>
            <span>CORS Active &bull; Low-Latency Delivery</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
