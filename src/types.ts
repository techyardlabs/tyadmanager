export type SlotCategory =
  | 'leaderboard'
  | 'medium_rectangle'
  | 'sidebar_halfpage'
  | 'billboard'
  | 'video';

export interface SlotDefinition {
  id: string;
  name: string;
  category: SlotCategory;
  width: number;
  height: number;
  description: string;
  allowedFormats: ('image' | 'video')[];
}

export interface Campaign {
  id: string;
  name: string;
  advertiser: string;
  status: 'active' | 'paused' | 'completed';
  startDate: string;
  endDate: string;
  budget: number;
  impressions: number;
  clicks: number;
  createdAt: string;
}

export type VideoType = 'youtube' | 'mp4' | 'embed';

export interface Creative {
  id: string;
  campaignId: string;
  campaignName?: string;
  name: string;
  slotId: string;
  formatType: 'image' | 'video';
  videoType?: VideoType;
  mediaUrl: string;
  youtubeUrl?: string;
  embedCode?: string;
  targetUrl: string;
  width: number;
  height: number;
  status: 'active' | 'paused';
  weight: number; // 1 to 100
  startDate: string;
  endDate: string;
  impressions: number;
  clicks: number;
  createdAt: string;
}

export interface TelemetryEvent {
  id: string;
  type: 'impression' | 'click';
  creativeId: string;
  campaignId: string;
  slotId: string;
  timestamp: string;
  userAgent?: string;
  referer?: string;
}

export interface TimelinePoint {
  time: string;
  impressions: number;
  clicks: number;
}

export interface PublisherDomain {
  id: string;
  domain: string;
  status: 'active' | 'blocked';
  firstSeen: string;
  lastSeen: string;
  totalRequests: number;
  impressions: number;
  clicks: number;
  slotsUsed: string[];
  notes?: string;
}

export interface DashboardStats {
  totalImpressions: number;
  totalClicks: number;
  ctr: number;
  activeCampaigns: number;
  totalCampaigns: number;
  activeCreatives: number;
  totalCreatives: number;
  activeSlotsCount: number;
  activeDomainsCount: number;
  blockedDomainsCount: number;
  totalDomainsCount: number;
  slotStats: Record<string, { impressions: number; clicks: number; ctr: number }>;
  timeline: TimelinePoint[];
  recentEvents: TelemetryEvent[];
}

export const PREDEFINED_SLOTS: SlotDefinition[] = [
  // 1. Leaderboard Banners (728x90 px) - 4 slots
  {
    id: 'LB-728x90-1',
    name: 'Top Header Leaderboard (LB-1)',
    category: 'leaderboard',
    width: 728,
    height: 90,
    description: 'Prime above-the-fold placement at top of publisher pages',
    allowedFormats: ['image'],
  },
  {
    id: 'LB-728x90-2',
    name: 'Mid-Content Leaderboard (LB-2)',
    category: 'leaderboard',
    width: 728,
    height: 90,
    description: 'In-article divider leaderboard banner',
    allowedFormats: ['image'],
  },
  {
    id: 'LB-728x90-3',
    name: 'Article Footer Leaderboard (LB-3)',
    category: 'leaderboard',
    width: 728,
    height: 90,
    description: 'End-of-article engagement leaderboard banner',
    allowedFormats: ['image'],
  },
  {
    id: 'LB-728x90-4',
    name: 'Sticky Footer Leaderboard (LB-4)',
    category: 'leaderboard',
    width: 728,
    height: 90,
    description: 'Persistent sticky bottom leaderboard banner',
    allowedFormats: ['image'],
  },

  // 2. Medium Rectangle / Inline Banners (300x250 px) - 4 slots
  {
    id: 'MR-300x250-1',
    name: 'Sidebar Top Medium Rectangle (MR-1)',
    category: 'medium_rectangle',
    width: 300,
    height: 250,
    description: 'Top of publisher sidebar, high viewability inline rectangle',
    allowedFormats: ['image'],
  },
  {
    id: 'MR-300x250-2',
    name: 'In-Article Paragraph 3 Medium Rect (MR-2)',
    category: 'medium_rectangle',
    width: 300,
    height: 250,
    description: 'In-feed editorial inline banner positioned within article text',
    allowedFormats: ['image'],
  },
  {
    id: 'MR-300x250-3',
    name: 'Sidebar Mid Medium Rectangle (MR-3)',
    category: 'medium_rectangle',
    width: 300,
    height: 250,
    description: 'Secondary sidebar inline rectangle widget',
    allowedFormats: ['image'],
  },
  {
    id: 'MR-300x250-4',
    name: 'Comments Section Medium Rect (MR-4)',
    category: 'medium_rectangle',
    width: 300,
    height: 250,
    description: 'Positioned above reader comments and discussion forums',
    allowedFormats: ['image'],
  },

  // 3. Sidebar / Half Page Banners (300x600 px) - 4 slots
  {
    id: 'SB-300x600-1',
    name: 'Premium Sticky Half Page (SB-1)',
    category: 'sidebar_halfpage',
    width: 300,
    height: 600,
    description: 'High-impact tall sidebar half-page banner with sticky scrolling',
    allowedFormats: ['image'],
  },
  {
    id: 'SB-300x600-2',
    name: 'Secondary Half Page (SB-2)',
    category: 'sidebar_halfpage',
    width: 300,
    height: 600,
    description: 'Mid-rail tall banner for long-form publisher articles',
    allowedFormats: ['image'],
  },
  {
    id: 'SB-300x600-3',
    name: 'Category Index Half Page (SB-3)',
    category: 'sidebar_halfpage',
    width: 300,
    height: 600,
    description: 'Section index sidebar slot with maximum visual footprint',
    allowedFormats: ['image'],
  },
  {
    id: 'SB-300x600-4',
    name: 'Archive & Gallery Half Page (SB-4)',
    category: 'sidebar_halfpage',
    width: 300,
    height: 600,
    description: 'Gallery and multimedia sidebar placement',
    allowedFormats: ['image'],
  },

  // 4. Billboard Banners (970x250 px) - 4 slots
  {
    id: 'BB-970x250-1',
    name: 'Masthead Pushdown Billboard (BB-1)',
    category: 'billboard',
    width: 970,
    height: 250,
    description: 'Ultra-wide premium billboard displayed directly below main navigation',
    allowedFormats: ['image'],
  },
  {
    id: 'BB-970x250-2',
    name: 'Breaking News Billboard (BB-2)',
    category: 'billboard',
    width: 970,
    height: 250,
    description: 'Section takeover billboard banner for special editions',
    allowedFormats: ['image'],
  },
  {
    id: 'BB-970x250-3',
    name: 'Mid-Feed Showcase Billboard (BB-3)',
    category: 'billboard',
    width: 970,
    height: 250,
    description: 'Horizontal wide billboard interrupting infinite content feeds',
    allowedFormats: ['image'],
  },
  {
    id: 'BB-970x250-4',
    name: 'Pre-Footer Billboard (BB-4)',
    category: 'billboard',
    width: 970,
    height: 250,
    description: 'Wide cinematic billboard anchored before site footer',
    allowedFormats: ['image'],
  },

  // 5. Video Ads (Outstream / In-page Player) - 4 slots
  {
    id: 'VID-01',
    name: 'Outstream In-Read Video Player (VID-01)',
    category: 'video',
    width: 640,
    height: 360,
    description: 'Responsive outstream video expanding between editorial paragraphs',
    allowedFormats: ['video'],
  },
  {
    id: 'VID-02',
    name: 'Sidebar Video Companion (VID-02)',
    category: 'video',
    width: 320,
    height: 180,
    description: 'Floating/sticky sidebar in-page video player',
    allowedFormats: ['video'],
  },
  {
    id: 'VID-03',
    name: 'Featured Media Outstream Video (VID-03)',
    category: 'video',
    width: 854,
    height: 480,
    description: 'High-definition outstream hero video placement',
    allowedFormats: ['video'],
  },
  {
    id: 'VID-04',
    name: 'Article End Video Showcase (VID-04)',
    category: 'video',
    width: 640,
    height: 360,
    description: 'Auto-playing muted video player at conclusion of content',
    allowedFormats: ['video'],
  },
];

export type UserRole = 'admin' | 'manager';

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthSession {
  token: string;
  user: UserAccount;
  expiresAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: UserAccount | null;
  isLoading: boolean;
}
