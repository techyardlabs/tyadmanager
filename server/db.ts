import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Campaign, Creative, DashboardStats, PREDEFINED_SLOTS, PublisherDomain, TelemetryEvent, TimelinePoint, UserAccount, UserRole } from '../src/types.js';

export interface StoredUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  passwordHash: string;
  salt: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface UserSession {
  token: string;
  userId: string;
  username: string;
  role: UserRole;
  createdAt: string;
  expiresAt: string;
}

interface DatabaseSchema {
  campaigns: Campaign[];
  creatives: Creative[];
  events: TelemetryEvent[];
  publishers?: PublisherDomain[];
  users?: StoredUser[];
}

const DB_FILE = path.resolve(process.cwd(), 'data-adserver.json');

// Helper to generate crisp, self-contained SVG banners as data URLs
function createBannerSvg(
  width: number,
  height: number,
  title: string,
  subtitle: string,
  cta: string,
  bgGradient: [string, string],
  accentColor: string
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bgGradient[0]}" />
      <stop offset="100%" stop-color="${bgGradient[1]}" />
    </linearGradient>
    <linearGradient id="btnGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${accentColor}" />
      <stop offset="100%" stop-color="#38bdf8" />
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.3"/>
    </filter>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bgGrad)" />
  <rect x="0" y="0" width="${width}" height="${height}" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" />
  
  <!-- Subtle decorative grid or shapes -->
  <circle cx="${width * 0.88}" cy="${height * 0.5}" r="${Math.min(width, height) * 0.7}" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="24" />
  <circle cx="${width * 0.12}" cy="${height * 0.8}" r="${Math.min(width, height) * 0.4}" fill="none" stroke="${accentColor}" stroke-opacity="0.08" stroke-width="2" />
  
  ${
    height <= 100
      ? `
    <!-- Horizontal Leaderboard Layout (${width}x${height}) -->
    <g transform="translate(24, ${height / 2 + 5})">
      <text x="0" y="-8" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700" letter-spacing="-0.3px">${title}</text>
      <text x="0" y="14" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12">${subtitle}</text>
    </g>
    <g transform="translate(${width - 150}, ${height / 2 - 18})" filter="url(#shadow)">
      <rect width="126" height="36" rx="6" fill="url(#btnGrad)" />
      <text x="63" y="22" fill="#090d16" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" text-anchor="middle">${cta} &#8594;</text>
    </g>
  `
      : height >= 500
      ? `
    <!-- Tall Half-Page Banner Layout (${width}x${height}) -->
    <g transform="translate(24, 48)">
      <rect x="0" y="0" width="76" height="24" rx="4" fill="${accentColor}" fill-opacity="0.2" stroke="${accentColor}" stroke-opacity="0.4" />
      <text x="38" y="16" fill="${accentColor}" font-family="sans-serif" font-size="10" font-weight="700" text-anchor="middle">EXCLUSIVE</text>
      <text x="0" y="60" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="800" letter-spacing="-0.5px">
        ${title.split(' ').slice(0, 3).join(' ')}
      </text>
      <text x="0" y="92" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="800" letter-spacing="-0.5px">
        ${title.split(' ').slice(3).join(' ')}
      </text>
      <text x="0" y="130" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" width="250">
        ${subtitle}
      </text>
    </g>
    <g transform="translate(24, 230)">
      <rect width="252" height="200" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" />
      <circle cx="126" cy="90" r="44" fill="url(#btnGrad)" fill-opacity="0.15" />
      <path d="M 116 76 L 142 90 L 116 104 Z" fill="${accentColor}" />
      <text x="126" y="155" fill="#f8fafc" font-family="sans-serif" font-size="12" font-weight="600" text-anchor="middle">Next-Gen Architecture</text>
      <text x="126" y="175" fill="#64748b" font-family="sans-serif" font-size="10" text-anchor="middle">Zero Configuration Required</text>
    </g>
    <g transform="translate(24, 510)" filter="url(#shadow)">
      <rect width="252" height="46" rx="8" fill="url(#btnGrad)" />
      <text x="126" y="28" fill="#090d16" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" text-anchor="middle">${cta} &#8594;</text>
    </g>
  `
      : width >= 900
      ? `
    <!-- Wide Billboard Layout (${width}x${height}) -->
    <g transform="translate(48, 70)">
      <text x="0" y="28" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="32" font-weight="800" letter-spacing="-0.8px">${title}</text>
      <text x="0" y="66" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16">${subtitle}</text>
      <g transform="translate(0, 96)">
        <rect width="180" height="46" rx="8" fill="url(#btnGrad)" filter="url(#shadow)" />
        <text x="90" y="28" fill="#090d16" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" text-anchor="middle">${cta} &#8594;</text>
      </g>
    </g>
    <g transform="translate(${width - 340}, 30)">
      <rect width="280" height="190" rx="12" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" />
      <text x="140" y="45" fill="#f8fafc" font-family="sans-serif" font-size="14" font-weight="700" text-anchor="middle">⚡ Ultra-Low Latency</text>
      <text x="140" y="80" fill="#38bdf8" font-family="sans-serif" font-size="28" font-weight="800" text-anchor="middle">&lt; 15 ms</text>
      <text x="140" y="110" fill="#94a3b8" font-family="sans-serif" font-size="11" text-anchor="middle">Global Edge Distribution</text>
      <line x1="30" y1="130" x2="250" y2="130" stroke="rgba(255,255,255,0.08)" />
      <text x="140" y="160" fill="#10b981" font-family="sans-serif" font-size="12" font-weight="600" text-anchor="middle">99.99% Guaranteed SLA</text>
    </g>
  `
      : `
    <!-- Medium Rectangle Layout (${width}x${height}) -->
    <g transform="translate(20, 32)">
      <rect x="0" y="0" width="58" height="20" rx="3" fill="${accentColor}" fill-opacity="0.25" />
      <text x="29" y="14" fill="${accentColor}" font-family="sans-serif" font-size="9" font-weight="700" text-anchor="middle">PRO</text>
      <text x="0" y="44" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="800" letter-spacing="-0.4px">
        ${title}
      </text>
      <text x="0" y="68" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">
        ${subtitle}
      </text>
    </g>
    <g transform="translate(20, 115)">
      <rect width="260" height="64" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" />
      <text x="16" y="26" fill="#f8fafc" font-family="sans-serif" font-size="11" font-weight="600">Enterprise Cloud Cluster</text>
      <text x="16" y="46" fill="#64748b" font-family="sans-serif" font-size="10">High availability &amp; instant scaling</text>
    </g>
    <g transform="translate(20, 194)" filter="url(#shadow)">
      <rect width="260" height="38" rx="6" fill="url(#btnGrad)" />
      <text x="130" y="24" fill="#090d16" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" text-anchor="middle">${cta} &#8594;</text>
    </g>
  `
  }
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

class AdServerDatabase {
  private campaigns: Campaign[] = [];
  private creatives: Creative[] = [];
  private events: TelemetryEvent[] = [];
  private publishers: PublisherDomain[] = [];
  private users: StoredUser[] = [];
  private sessions: Map<string, UserSession> = new Map();

  constructor() {
    this.loadFromDisk();
    if (this.campaigns.length === 0 || this.creatives.length === 0) {
      this.seedInitialData();
      this.saveToDisk();
    }
    if (this.publishers.length === 0) {
      this.seedPublishers();
      this.saveToDisk();
    }
    if (this.users.length === 0) {
      this.seedInitialUser();
      this.saveToDisk();
    }
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const data: DatabaseSchema = JSON.parse(raw);
        this.campaigns = data.campaigns || [];
        this.creatives = data.creatives || [];
        this.events = data.events || [];
        this.publishers = data.publishers || [];
        this.users = data.users || [];
      }
    } catch (err) {
      console.warn('Could not read persistent DB, reinitializing:', err);
    }
  }

  private saveToDisk() {
    try {
      const data: DatabaseSchema = {
        campaigns: this.campaigns,
        creatives: this.creatives,
        events: this.events.slice(-1000), // keep latest 1000 events
        publishers: this.publishers,
        users: this.users,
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save DB to disk:', err);
    }
  }

  public hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, actualSalt, 10000, 64, 'sha512').toString('hex');
    return { hash, salt: actualSalt };
  }

  public verifyPassword(password: string, hash: string, salt: string): boolean {
    const check = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return check === hash;
  }

  private seedInitialUser() {
    const { hash, salt } = this.hashPassword('admin123');
    const adminUser: StoredUser = {
      id: 'usr-admin-01',
      username: 'admin',
      name: 'AdServer Administrator',
      email: 'admin@adserver.io',
      role: 'admin',
      passwordHash: hash,
      salt,
      createdAt: new Date().toISOString(),
    };
    this.users = [adminUser];
  }

  private seedPublishers() {
    const now = new Date();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();

    this.publishers = [
      {
        id: 'pub-chronicle-01',
        domain: 'theglobalchronicle.media',
        status: 'active',
        firstSeen: twoWeeksAgo,
        lastSeen: now.toISOString(),
        totalRequests: 2480,
        impressions: 1940,
        clicks: 86,
        slotsUsed: ['LB-728x90-1', 'MR-300x250-1', 'SB-300x600-1', 'VID-01', 'BB-970x250-1'],
        notes: 'Verified Official Sandbox & Media Partner',
      },
      {
        id: 'pub-local-02',
        domain: 'localhost',
        status: 'active',
        firstSeen: twoWeeksAgo,
        lastSeen: now.toISOString(),
        totalRequests: 420,
        impressions: 380,
        clicks: 24,
        slotsUsed: ['LB-728x90-1', 'MR-300x250-1'],
        notes: 'Developer Localhost Testing',
      },
      {
        id: 'pub-techblog-03',
        domain: 'clouddevnews.io',
        status: 'active',
        firstSeen: fiveDaysAgo,
        lastSeen: oneDayAgo,
        totalRequests: 1150,
        impressions: 920,
        clicks: 48,
        slotsUsed: ['LB-728x90-1', 'MR-300x250-2', 'SB-300x600-1'],
        notes: 'Tech Publisher Network',
      },
      {
        id: 'pub-spam-04',
        domain: 'suspicious-traffic-hub.xyz',
        status: 'blocked',
        firstSeen: fiveDaysAgo,
        lastSeen: oneDayAgo,
        totalRequests: 620,
        impressions: 0,
        clicks: 0,
        slotsUsed: ['MR-300x250-1'],
        notes: 'Auto-flagged: High bounce, unverified bot scraper domain',
      },
    ];
  }

  private seedInitialData() {
    const now = new Date();
    const oneMonthAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const oneMonthAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString();

    const camp1: Campaign = {
      id: 'camp-tech-01',
      name: 'CloudScale Enterprise Q3 Growth',
      advertiser: 'CloudScale Systems Inc.',
      status: 'active',
      startDate: oneMonthAgo,
      endDate: oneMonthAhead,
      budget: 15000,
      impressions: 48920,
      clicks: 1642,
      createdAt: oneMonthAgo,
    };

    const camp2: Campaign = {
      id: 'camp-fin-02',
      name: 'Apex Wealth & Capital Growth',
      advertiser: 'Apex Financial Global',
      status: 'active',
      startDate: oneMonthAgo,
      endDate: oneMonthAhead,
      budget: 25000,
      impressions: 34120,
      clicks: 980,
      createdAt: oneMonthAgo,
    };

    const camp3: Campaign = {
      id: 'camp-media-03',
      name: 'NextGen Stream Innovation Video',
      advertiser: 'MediaPulse Interactive',
      status: 'active',
      startDate: oneMonthAgo,
      endDate: oneMonthAhead,
      budget: 12000,
      impressions: 21540,
      clicks: 1210,
      createdAt: oneMonthAgo,
    };

    this.campaigns = [camp1, camp2, camp3];

    // Seed realistic creatives across each format and slots
    this.creatives = [
      // 1. Leaderboard Banners (728x90) - 4 slots
      {
        id: 'cr-lb-01',
        campaignId: camp1.id,
        campaignName: camp1.name,
        name: 'CloudScale Kubernetes Engine 728x90',
        slotId: 'LB-728x90-1',
        formatType: 'image',
        mediaUrl: createBannerSvg(
          728,
          90,
          'CloudScale Serverless Kubernetes',
          'Autoscale your containers with zero cold starts & 99.999% uptime',
          'Deploy Free',
          ['#0f172a', '#1e1b4b'],
          '#60a5fa'
        ),
        targetUrl: 'https://example.com/cloudscale?utm_source=adserver&utm_slot=LB-728x90-1',
        width: 728,
        height: 90,
        status: 'active',
        weight: 70,
        startDate: oneMonthAgo,
        endDate: oneMonthAhead,
        impressions: 14200,
        clicks: 520,
        createdAt: oneMonthAgo,
      },
      {
        id: 'cr-lb-02',
        campaignId: camp2.id,
        campaignName: camp2.name,
        name: 'Apex Wealth Automated Portfolio 728x90',
        slotId: 'LB-728x90-2',
        formatType: 'image',
        mediaUrl: createBannerSvg(
          728,
          90,
          'Smart Portfolio Management',
          'AI-guided risk hedging with 0.15% fee structure. Start today.',
          'Start Investing',
          ['#064e3b', '#022c22'],
          '#34d399'
        ),
        targetUrl: 'https://example.com/apex-wealth?utm_source=adserver&utm_slot=LB-728x90-2',
        width: 728,
        height: 90,
        status: 'active',
        weight: 60,
        startDate: oneMonthAgo,
        endDate: oneMonthAhead,
        impressions: 9800,
        clicks: 290,
        createdAt: oneMonthAgo,
      },
      {
        id: 'cr-lb-03',
        campaignId: camp1.id,
        campaignName: camp1.name,
        name: 'CloudScale Observability & APM 728x90',
        slotId: 'LB-728x90-3',
        formatType: 'image',
        mediaUrl: createBannerSvg(
          728,
          90,
          'Full-Stack Distributed Tracing',
          'Monitor microservices latency with sub-second live telemetry.',
          'Start Free Trial',
          ['#172554', '#1e293b'],
          '#38bdf8'
        ),
        targetUrl: 'https://example.com/apm?utm_source=adserver&utm_slot=LB-728x90-3',
        width: 728,
        height: 90,
        status: 'active',
        weight: 50,
        startDate: oneMonthAgo,
        endDate: oneMonthAhead,
        impressions: 6400,
        clicks: 195,
        createdAt: oneMonthAgo,
      },
      {
        id: 'cr-lb-04',
        campaignId: camp2.id,
        campaignName: camp2.name,
        name: 'Apex Institutional Prime Brokerage 728x90',
        slotId: 'LB-728x90-4',
        formatType: 'image',
        mediaUrl: createBannerSvg(
          728,
          90,
          'Global Equities & Crypto Liquidity',
          'Ultra-fast FIX protocol execution with dedicated clearing.',
          'Schedule Demo',
          ['#1e1b4b', '#0f172a'],
          '#a78bfa'
        ),
        targetUrl: 'https://example.com/institutional?utm_source=adserver&utm_slot=LB-728x90-4',
        width: 728,
        height: 90,
        status: 'active',
        weight: 50,
        startDate: oneMonthAgo,
        endDate: oneMonthAhead,
        impressions: 4300,
        clicks: 140,
        createdAt: oneMonthAgo,
      },

      // 2. Medium Rectangle / Inline Banners (300x250) - 4 slots
      {
        id: 'cr-mr-01',
        campaignId: camp1.id,
        campaignName: camp1.name,
        name: 'DevStream Cloud IDE 300x250',
        slotId: 'MR-300x250-1',
        formatType: 'image',
        mediaUrl: createBannerSvg(
          300,
          250,
          'DevStream Cloud IDE',
          'Zero-install browser IDE with AI coding engine and instant preview.',
          'Open Workspace',
          ['#0f172a', '#1e293b'],
          '#38bdf8'
        ),
        targetUrl: 'https://example.com/devstream?utm_source=adserver&utm_slot=MR-300x250-1',
        width: 300,
        height: 250,
        status: 'active',
        weight: 80,
        startDate: oneMonthAgo,
        endDate: oneMonthAhead,
        impressions: 16800,
        clicks: 640,
        createdAt: oneMonthAgo,
      },
      {
        id: 'cr-mr-02',
        campaignId: camp2.id,
        campaignName: camp2.name,
        name: 'Apex High Yield Cash Account 300x250',
        slotId: 'MR-300x250-2',
        formatType: 'image',
        mediaUrl: createBannerSvg(
          300,
          250,
          '5.25% APY Cash Reserve',
          'FDIC insured up to $2.5M. Instant liquid withdrawals anytime.',
          'Open Account',
          ['#022c22', '#064e3b'],
          '#10b981'
        ),
        targetUrl: 'https://example.com/apex-cash?utm_source=adserver&utm_slot=MR-300x250-2',
        width: 300,
        height: 250,
        status: 'active',
        weight: 70,
        startDate: oneMonthAgo,
        endDate: oneMonthAhead,
        impressions: 12400,
        clicks: 410,
        createdAt: oneMonthAgo,
      },
      {
        id: 'cr-mr-03',
        campaignId: camp1.id,
        campaignName: camp1.name,
        name: 'Database Aurora Global Mesh 300x250',
        slotId: 'MR-300x250-3',
        formatType: 'image',
        mediaUrl: createBannerSvg(
          300,
          250,
          'Distributed SQL Mesh',
          'Active-active geo-replication across 24 AWS & GCP regions.',
          'Test Cluster',
          ['#18181b', '#27272a'],
          '#f59e0b'
        ),
        targetUrl: 'https://example.com/sqlmesh?utm_source=adserver&utm_slot=MR-300x250-3',
        width: 300,
        height: 250,
        status: 'active',
        weight: 50,
        startDate: oneMonthAgo,
        endDate: oneMonthAhead,
        impressions: 8900,
        clicks: 280,
        createdAt: oneMonthAgo,
      },
      {
        id: 'cr-mr-04',
        campaignId: camp2.id,
        campaignName: camp2.name,
        name: 'Apex Founders Venture Fund 300x250',
        slotId: 'MR-300x250-4',
        formatType: 'image',
        mediaUrl: createBannerSvg(
          300,
          250,
          'Seed & Series A Venture',
          'Backing technical founders building AI & infrastructure.',
          'Pitch Deck Review',
          ['#311042', '#1a0826'],
          '#c084fc'
        ),
        targetUrl: 'https://example.com/founders?utm_source=adserver&utm_slot=MR-300x250-4',
        width: 300,
        height: 250,
        status: 'active',
        weight: 50,
        startDate: oneMonthAgo,
        endDate: oneMonthAhead,
        impressions: 5900,
        clicks: 170,
        createdAt: oneMonthAgo,
      },

      // 3. Sidebar / Half Page Banners (300x600) - 4 slots
      {
        id: 'cr-sb-01',
        campaignId: camp1.id,
        campaignName: camp1.name,
        name: 'CloudScale Zero Trust Gateway 300x600',
        slotId: 'SB-300x600-1',
        formatType: 'image',
        mediaUrl: createBannerSvg(
          300,
          600,
          'Autonomous Cloud Security & Zero-Trust Mesh',
          'Eliminate VPN bottlenecks and protect remote teams with unified identity access.',
          'Get Secure Now',
          ['#090d16', '#111827'],
          '#0ea5e9'
        ),
        targetUrl: 'https://example.com/zerotrust?utm_source=adserver&utm_slot=SB-300x600-1',
        width: 300,
        height: 600,
        status: 'active',
        weight: 90,
        startDate: oneMonthAgo,
        endDate: oneMonthAhead,
        impressions: 21200,
        clicks: 740,
        createdAt: oneMonthAgo,
      },
      {
        id: 'cr-sb-02',
        campaignId: camp2.id,
        campaignName: camp2.name,
        name: 'Apex Wealth Private Banking 300x600',
        slotId: 'SB-300x600-2',
        formatType: 'image',
        mediaUrl: createBannerSvg(
          300,
          600,
          'Bespoke Family Office Advisory Services',
          'Multigenerational wealth preservation, estate planning and tax strategy.',
          'Book Consultation',
          ['#042f2e', '#0f172a'],
          '#2dd4bf'
        ),
        targetUrl: 'https://example.com/family-office?utm_source=adserver&utm_slot=SB-300x600-2',
        width: 300,
        height: 600,
        status: 'active',
        weight: 75,
        startDate: oneMonthAgo,
        endDate: oneMonthAhead,
        impressions: 14500,
        clicks: 460,
        createdAt: oneMonthAgo,
      },
      {
        id: 'cr-sb-03',
        campaignId: camp1.id,
        campaignName: camp1.name,
        name: 'CloudScale AI Infrastructure 300x600',
        slotId: 'SB-300x600-3',
        formatType: 'image',
        mediaUrl: createBannerSvg(
          300,
          600,
          'Dedicated H100 GPU Clusters On Demand',
          'Low latency InfiniBand interconnect with ready-to-run PyTorch images.',
          'Reserve Capacity',
          ['#1e1b4b', '#312e81'],
          '#818cf8'
        ),
        targetUrl: 'https://example.com/gpu-cluster?utm_source=adserver&utm_slot=SB-300x600-3',
        width: 300,
        height: 600,
        status: 'active',
        weight: 60,
        startDate: oneMonthAgo,
        endDate: oneMonthAhead,
        impressions: 8900,
        clicks: 310,
        createdAt: oneMonthAgo,
      },
      {
        id: 'cr-sb-04',
        campaignId: camp2.id,
        campaignName: camp2.name,
        name: 'Apex Global Real Estate Fund 300x600',
        slotId: 'SB-300x600-4',
        formatType: 'image',
        mediaUrl: createBannerSvg(
          300,
          600,
          'Tier-1 Logistics & Data Center Assets',
          'Institutional grade commercial real estate yielding 8.2% targeted IRR.',
          'View Prospectus',
          ['#1c1917', '#292524'],
          '#fbbf24'
        ),
        targetUrl: 'https://example.com/real-estate?utm_source=adserver&utm_slot=SB-300x600-4',
        width: 300,
        height: 600,
        status: 'active',
        weight: 50,
        startDate: oneMonthAgo,
        endDate: oneMonthAhead,
        impressions: 6100,
        clicks: 190,
        createdAt: oneMonthAgo,
      },

      // 4. Billboard Banners (970x250) - 4 slots
      {
        id: 'cr-bb-01',
        campaignId: camp1.id,
        campaignName: camp1.name,
        name: 'CloudScale Global Anycast CDN 970x250',
        slotId: 'BB-970x250-1',
        formatType: 'image',
        mediaUrl: createBannerSvg(
          970,
          250,
          'Next-Generation Edge CDN & Compute Mesh',
          'Deliver dynamic web content in under 15 milliseconds worldwide with instant cache invalidation and edge KV store.',
          'Start Free with $500 Credits',
          ['#090d16', '#172554'],
          '#38bdf8'
        ),
        targetUrl: 'https://example.com/cdn?utm_source=adserver&utm_slot=BB-970x250-1',
        width: 970,
        height: 250,
        status: 'active',
        weight: 90,
        startDate: oneMonthAgo,
        endDate: oneMonthAhead,
        impressions: 28400,
        clicks: 1140,
        createdAt: oneMonthAgo,
      },
      {
        id: 'cr-bb-02',
        campaignId: camp2.id,
        campaignName: camp2.name,
        name: 'Apex Automated Algorithmic Arbitrage 970x250',
        slotId: 'BB-970x250-2',
        formatType: 'image',
        mediaUrl: createBannerSvg(
          970,
          250,
          'Quantitative Institutional Trading Infrastructure',
          'Colocated co-location in NY4, LD4, and TY3 with nanosecond FPGA order routing and ultra-tight liquidity spreads.',
          'Access Market Data API',
          ['#022c22', '#0f291e'],
          '#10b981'
        ),
        targetUrl: 'https://example.com/quant?utm_source=adserver&utm_slot=BB-970x250-2',
        width: 970,
        height: 250,
        status: 'active',
        weight: 75,
        startDate: oneMonthAgo,
        endDate: oneMonthAhead,
        impressions: 17200,
        clicks: 580,
        createdAt: oneMonthAgo,
      },
      {
        id: 'cr-bb-03',
        campaignId: camp1.id,
        campaignName: camp1.name,
        name: 'CloudScale Developer Conference 970x250',
        slotId: 'BB-970x250-3',
        formatType: 'image',
        mediaUrl: createBannerSvg(
          970,
          250,
          'CloudScale Summit 2026: The Future of Cloud Architecture',
          'Join 12,000+ engineers, systems architects, and open-source leaders in San Francisco & streaming live worldwide.',
          'Claim Early Bird Pass',
          ['#2e1065', '#1e1b4b'],
          '#c084fc'
        ),
        targetUrl: 'https://example.com/summit?utm_source=adserver&utm_slot=BB-970x250-3',
        width: 970,
        height: 250,
        status: 'active',
        weight: 60,
        startDate: oneMonthAgo,
        endDate: oneMonthAhead,
        impressions: 11200,
        clicks: 390,
        createdAt: oneMonthAgo,
      },
      {
        id: 'cr-bb-04',
        campaignId: camp2.id,
        campaignName: camp2.name,
        name: 'Apex Carbon Credit Offsets 970x250',
        slotId: 'BB-970x250-4',
        formatType: 'image',
        mediaUrl: createBannerSvg(
          970,
          250,
          'Verified Corporate ESG Net-Zero Procurement',
          'Direct satellite-verified carbon avoidance and removal credits for Fortune 500 sustainability mandates.',
          'Download ESG Report',
          ['#14231b', '#0c1a14'],
          '#4ade80'
        ),
        targetUrl: 'https://example.com/esg?utm_source=adserver&utm_slot=BB-970x250-4',
        width: 970,
        height: 250,
        status: 'active',
        weight: 50,
        startDate: oneMonthAgo,
        endDate: oneMonthAhead,
        impressions: 7800,
        clicks: 220,
        createdAt: oneMonthAgo,
      },

      // 5. Video Ads (Outstream / In-page Player) - 4 slots
      {
        id: 'cr-vid-01',
        campaignId: camp3.id,
        campaignName: camp3.name,
        name: 'Future of Intelligent Cloud - Outstream Video (YouTube)',
        slotId: 'VID-01',
        formatType: 'video',
        videoType: 'youtube',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Clean embed
        mediaUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        targetUrl: 'https://example.com/cloud-video?utm_source=adserver&utm_slot=VID-01',
        width: 640,
        height: 360,
        status: 'active',
        weight: 80,
        startDate: oneMonthAgo,
        endDate: oneMonthAhead,
        impressions: 11400,
        clicks: 620,
        createdAt: oneMonthAgo,
      },
      {
        id: 'cr-vid-02',
        campaignId: camp3.id,
        campaignName: camp3.name,
        name: 'Nature & Earth Motion Reel - Self Hosted MP4',
        slotId: 'VID-02',
        formatType: 'video',
        videoType: 'mp4',
        // Reliable open source test video
        mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        targetUrl: 'https://example.com/nature-gear?utm_source=adserver&utm_slot=VID-02',
        width: 320,
        height: 180,
        status: 'active',
        weight: 75,
        startDate: oneMonthAgo,
        endDate: oneMonthAhead,
        impressions: 5900,
        clicks: 340,
        createdAt: oneMonthAgo,
      },
      {
        id: 'cr-vid-03',
        campaignId: camp3.id,
        campaignName: camp3.name,
        name: 'Interactive Cloud Architecture - Custom Embed',
        slotId: 'VID-03',
        formatType: 'video',
        videoType: 'embed',
        embedCode: `<div style="width:100%;height:100%;background:linear-gradient(135deg,#090d16,#1e293b);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-family:sans-serif;text-align:center;padding:20px;box-sizing:border-box;">
  <div style="background:#38bdf8;color:#090d16;font-weight:bold;font-size:11px;padding:4px 10px;border-radius:20px;margin-bottom:12px;text-transform:uppercase;">Interactive Demo</div>
  <h3 style="margin:0 0 8px 0;font-size:22px;color:#f8fafc;font-weight:700;">Global Infrastructure in Real-Time</h3>
  <p style="margin:0 0 16px 0;color:#94a3b8;font-size:13px;max-width:440px;">Explore multi-region failover and live DNS steering with automated traffic re-balancing.</p>
  <div style="display:flex;gap:12px;">
    <span style="background:rgba(255,255,255,0.08);padding:6px 12px;border-radius:6px;font-size:12px;color:#38bdf8;border:1px solid rgba(56,189,248,0.2);">Latency: 4.2ms</span>
    <span style="background:rgba(255,255,255,0.08);padding:6px 12px;border-radius:6px;font-size:12px;color:#34d399;border:1px solid rgba(52,211,153,0.2);">Throughput: 85 Gbps</span>
  </div>
</div>`,
        mediaUrl: '',
        targetUrl: 'https://example.com/interactive-demo?utm_source=adserver&utm_slot=VID-03',
        width: 854,
        height: 480,
        status: 'active',
        weight: 70,
        startDate: oneMonthAgo,
        endDate: oneMonthAhead,
        impressions: 4200,
        clicks: 250,
        createdAt: oneMonthAgo,
      },
      {
        id: 'cr-vid-04',
        campaignId: camp3.id,
        campaignName: camp3.name,
        name: 'Brand Story Reel - Outstream Video (YouTube)',
        slotId: 'VID-04',
        formatType: 'video',
        videoType: 'youtube',
        youtubeUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw', // Clean historic YouTube video
        mediaUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
        targetUrl: 'https://example.com/brand-story?utm_source=adserver&utm_slot=VID-04',
        width: 640,
        height: 360,
        status: 'active',
        weight: 60,
        startDate: oneMonthAgo,
        endDate: oneMonthAhead,
        impressions: 3100,
        clicks: 160,
        createdAt: oneMonthAgo,
      },
    ];

    // Seed realistic telemetry history points for the timeline
    this.events = [
      {
        id: 'evt-init-1',
        type: 'impression',
        creativeId: 'cr-lb-01',
        campaignId: camp1.id,
        slotId: 'LB-728x90-1',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        referer: 'https://techchronicle.news/article/cloud-innovations-2026',
      },
      {
        id: 'evt-init-2',
        type: 'click',
        creativeId: 'cr-lb-01',
        campaignId: camp1.id,
        slotId: 'LB-728x90-1',
        timestamp: new Date(Date.now() - 3200000).toISOString(),
        referer: 'https://techchronicle.news/article/cloud-innovations-2026',
      },
      {
        id: 'evt-init-3',
        type: 'impression',
        creativeId: 'cr-mr-01',
        campaignId: camp1.id,
        slotId: 'MR-300x250-1',
        timestamp: new Date(Date.now() - 2500000).toISOString(),
        referer: 'https://globalnewsmedia.io/tech-weekly',
      },
      {
        id: 'evt-init-4',
        type: 'impression',
        creativeId: 'cr-sb-01',
        campaignId: camp1.id,
        slotId: 'SB-300x600-1',
        timestamp: new Date(Date.now() - 1200000).toISOString(),
        referer: 'https://marketinsider.com/reports/infra',
      },
      {
        id: 'evt-init-5',
        type: 'click',
        creativeId: 'cr-sb-01',
        campaignId: camp1.id,
        slotId: 'SB-300x600-1',
        timestamp: new Date(Date.now() - 900000).toISOString(),
        referer: 'https://marketinsider.com/reports/infra',
      },
      {
        id: 'evt-init-6',
        type: 'impression',
        creativeId: 'cr-vid-01',
        campaignId: camp3.id,
        slotId: 'VID-01',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        referer: 'https://globalnewsmedia.io/tech-weekly',
      },
    ];
  }

  // API operations
  public getCampaigns(): Campaign[] {
    return this.campaigns;
  }

  public getCampaign(id: string): Campaign | undefined {
    return this.campaigns.find((c) => c.id === id);
  }

  public createCampaign(data: Partial<Campaign>): Campaign {
    const campaign: Campaign = {
      id: 'camp-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      name: data.name || 'Untitled Campaign',
      advertiser: data.advertiser || 'Direct Advertiser',
      status: data.status || 'active',
      startDate: data.startDate || new Date().toISOString(),
      endDate: data.endDate || new Date(Date.now() + 30 * 86400000).toISOString(),
      budget: Number(data.budget) || 1000,
      impressions: 0,
      clicks: 0,
      createdAt: new Date().toISOString(),
    };
    this.campaigns.unshift(campaign);
    this.saveToDisk();
    return campaign;
  }

  public updateCampaign(id: string, updates: Partial<Campaign>): Campaign | null {
    const index = this.campaigns.findIndex((c) => c.id === id);
    if (index === -1) return null;
    this.campaigns[index] = { ...this.campaigns[index], ...updates };
    this.saveToDisk();
    return this.campaigns[index];
  }

  public deleteCampaign(id: string): boolean {
    const prevLen = this.campaigns.length;
    this.campaigns = this.campaigns.filter((c) => c.id !== id);
    if (this.campaigns.length !== prevLen) {
      // Also pause or mark creatives
      this.creatives = this.creatives.filter((cr) => cr.campaignId !== id);
      this.saveToDisk();
      return true;
    }
    return false;
  }

  public getCreatives(slotId?: string): Creative[] {
    if (slotId) {
      return this.creatives.filter((cr) => cr.slotId === slotId);
    }
    return this.creatives;
  }

  public getCreative(id: string): Creative | undefined {
    return this.creatives.find((c) => c.id === id);
  }

  public createCreative(data: Partial<Creative>): Creative {
    const slotDef = PREDEFINED_SLOTS.find((s) => s.id === data.slotId);
    const campaign = this.campaigns.find((c) => c.id === data.campaignId);

    const creative: Creative = {
      id: 'cr-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      campaignId: data.campaignId || (this.campaigns[0]?.id ?? 'camp-default'),
      campaignName: campaign ? campaign.name : 'Default Campaign',
      name: data.name || 'Untitled Creative',
      slotId: data.slotId || 'MR-300x250-1',
      formatType: data.formatType || (slotDef?.allowedFormats.includes('video') ? 'video' : 'image'),
      videoType: data.videoType,
      mediaUrl: data.mediaUrl || '',
      youtubeUrl: data.youtubeUrl,
      embedCode: data.embedCode,
      targetUrl: data.targetUrl || 'https://example.com',
      width: data.width || slotDef?.width || 300,
      height: data.height || slotDef?.height || 250,
      status: data.status || 'active',
      weight: Number(data.weight) || 50,
      startDate: data.startDate || new Date().toISOString(),
      endDate: data.endDate || new Date(Date.now() + 30 * 86400000).toISOString(),
      impressions: 0,
      clicks: 0,
      createdAt: new Date().toISOString(),
    };

    // If mediaUrl was empty and it's image, auto-generate a banner SVG
    if (!creative.mediaUrl && creative.formatType === 'image') {
      creative.mediaUrl = createBannerSvg(
        creative.width,
        creative.height,
        creative.name,
        'Sponsored Promotion by ' + (campaign?.advertiser || 'Advertiser'),
        'Explore Now',
        ['#0f172a', '#1e293b'],
        '#38bdf8'
      );
    }

    this.creatives.unshift(creative);
    this.saveToDisk();
    return creative;
  }

  public updateCreative(id: string, updates: Partial<Creative>): Creative | null {
    const index = this.creatives.findIndex((c) => c.id === id);
    if (index === -1) return null;
    this.creatives[index] = { ...this.creatives[index], ...updates };
    this.saveToDisk();
    return this.creatives[index];
  }

  public deleteCreative(id: string): boolean {
    const prevLen = this.creatives.length;
    this.creatives = this.creatives.filter((c) => c.id !== id);
    if (this.creatives.length !== prevLen) {
      this.saveToDisk();
      return true;
    }
    return false;
  }

  // Delivery decision engine
  public selectAdForSlot(slotId: string): Creative | null {
    const now = new Date().getTime();
    // Filter active, valid date, matching slot
    const candidates = this.creatives.filter((c) => {
      if (c.slotId !== slotId || c.status !== 'active') return false;
      const start = new Date(c.startDate).getTime();
      const end = new Date(c.endDate).getTime();
      if (!isNaN(start) && now < start) return false;
      if (!isNaN(end) && now > end) return false;
      return true;
    });

    if (candidates.length === 0) {
      return null;
    }

    if (candidates.length === 1) {
      return candidates[0];
    }

    // Weighted random selection
    const totalWeight = candidates.reduce((sum, c) => sum + Math.max(1, c.weight || 50), 0);
    let rand = Math.random() * totalWeight;

    for (const cand of candidates) {
      const weight = Math.max(1, cand.weight || 50);
      if (rand < weight) {
        return cand;
      }
      rand -= weight;
    }

    return candidates[0];
  }

  // Event recording
  public recordImpression(
    creativeId: string,
    metadata?: { slotId?: string; userAgent?: string; referer?: string }
  ): boolean {
    const creative = this.creatives.find((c) => c.id === creativeId);
    if (!creative) return false;

    creative.impressions += 1;
    const campaign = this.campaigns.find((c) => c.id === creative.campaignId);
    if (campaign) {
      campaign.impressions += 1;
    }

    const event: TelemetryEvent = {
      id: 'imp-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      type: 'impression',
      creativeId,
      campaignId: creative.campaignId,
      slotId: metadata?.slotId || creative.slotId,
      timestamp: new Date().toISOString(),
      userAgent: metadata?.userAgent,
      referer: metadata?.referer,
    };
    this.events.unshift(event);
    if (this.events.length > 1000) {
      this.events.pop();
    }

    this.saveToDisk();
    return true;
  }

  public recordClick(
    creativeId: string,
    metadata?: { slotId?: string; userAgent?: string; referer?: string; dest?: string }
  ): string {
    const creative = this.creatives.find((c) => c.id === creativeId);
    let target = metadata?.dest || creative?.targetUrl || 'https://example.com';

    if (creative) {
      creative.clicks += 1;
      const campaign = this.campaigns.find((c) => c.id === creative.campaignId);
      if (campaign) {
        campaign.clicks += 1;
      }

      const event: TelemetryEvent = {
        id: 'clk-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        type: 'click',
        creativeId,
        campaignId: creative.campaignId,
        slotId: metadata?.slotId || creative.slotId,
        timestamp: new Date().toISOString(),
        userAgent: metadata?.userAgent,
        referer: metadata?.referer,
      };
      this.events.unshift(event);
      if (this.events.length > 1000) {
        this.events.pop();
      }

      this.saveToDisk();
      target = creative.targetUrl || target;
    }

    return target;
  }

  public resetStats(): void {
    this.campaigns.forEach((c) => {
      c.impressions = 0;
      c.clicks = 0;
    });
    this.creatives.forEach((cr) => {
      cr.impressions = 0;
      cr.clicks = 0;
    });
    this.events = [];
    this.saveToDisk();
  }

  public getDashboardStats(): DashboardStats {
    const totalImpressions = this.campaigns.reduce((sum, c) => sum + c.impressions, 0);
    const totalClicks = this.campaigns.reduce((sum, c) => sum + c.clicks, 0);
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    const activeCampaigns = this.campaigns.filter((c) => c.status === 'active').length;
    const activeCreatives = this.creatives.filter((c) => c.status === 'active').length;

    // Slot stats
    const slotStats: Record<string, { impressions: number; clicks: number; ctr: number }> = {};
    for (const slot of PREDEFINED_SLOTS) {
      const crs = this.creatives.filter((c) => c.slotId === slot.id);
      const imps = crs.reduce((sum, c) => sum + c.impressions, 0);
      const clks = crs.reduce((sum, c) => sum + c.clicks, 0);
      slotStats[slot.id] = {
        impressions: imps,
        clicks: clks,
        ctr: imps > 0 ? Number(((clks / imps) * 100).toFixed(2)) : 0,
      };
    }

    const activeSlotsCount = Object.values(slotStats).filter((s) => s.impressions > 0).length;

    // Build timeline (mock last 7 hours/days + real event distribution)
    const timeline: TimelinePoint[] = [
      { time: '00:00', impressions: Math.round(totalImpressions * 0.08), clicks: Math.round(totalClicks * 0.07) },
      { time: '04:00', impressions: Math.round(totalImpressions * 0.06), clicks: Math.round(totalClicks * 0.05) },
      { time: '08:00', impressions: Math.round(totalImpressions * 0.16), clicks: Math.round(totalClicks * 0.18) },
      { time: '12:00', impressions: Math.round(totalImpressions * 0.26), clicks: Math.round(totalClicks * 0.28) },
      { time: '16:00', impressions: Math.round(totalImpressions * 0.24), clicks: Math.round(totalClicks * 0.22) },
      { time: '20:00', impressions: Math.round(totalImpressions * 0.14), clicks: Math.round(totalClicks * 0.14) },
      { time: 'Now', impressions: Math.round(totalImpressions * 0.06), clicks: Math.round(totalClicks * 0.06) },
    ];

    const activeDomainsCount = this.publishers.filter((p) => p.status === 'active').length;
    const blockedDomainsCount = this.publishers.filter((p) => p.status === 'blocked').length;

    return {
      totalImpressions,
      totalClicks,
      ctr: Number(ctr.toFixed(2)),
      activeCampaigns,
      totalCampaigns: this.campaigns.length,
      activeCreatives,
      totalCreatives: this.creatives.length,
      activeSlotsCount,
      activeDomainsCount,
      blockedDomainsCount,
      totalDomainsCount: this.publishers.length,
      slotStats,
      timeline,
      recentEvents: this.events.slice(0, 50),
    };
  }

  // ==========================================
  // PUBLISHER DOMAIN DETECTION & PROTECTION
  // ==========================================

  public normalizeDomain(raw?: string): string {
    if (!raw) return 'unknown';
    let clean = raw.trim().toLowerCase();
    // Strip protocol
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      try {
        const u = new URL(clean);
        clean = u.hostname;
      } catch (e) {
        clean = clean.replace(/^https?:\/\//, '').split('/')[0];
      }
    } else {
      clean = clean.split('/')[0].split('?')[0].split('#')[0];
    }
    // Strip port
    clean = clean.split(':')[0].trim();
    return clean || 'unknown';
  }

  public getPublisherDomains(): PublisherDomain[] {
    return [...this.publishers].sort((a, b) => {
      // Sort: blocked first, then highest requests/impressions
      if (a.status !== b.status) {
        return a.status === 'blocked' ? -1 : 1;
      }
      return b.totalRequests - a.totalRequests;
    });
  }

  public isDomainBlocked(rawDomain?: string): boolean {
    const domain = this.normalizeDomain(rawDomain);
    if (!domain || domain === 'unknown') return false;
    const pub = this.publishers.find((p) => p.domain === domain);
    return pub ? pub.status === 'blocked' : false;
  }

  public recordDomainActivity(
    rawDomain?: string,
    slotId?: string,
    eventType: 'request' | 'impression' | 'click' = 'request'
  ): { isBlocked: boolean; domainRecord: PublisherDomain } {
    const domain = this.normalizeDomain(rawDomain);
    const now = new Date().toISOString();

    let pub = this.publishers.find((p) => p.domain === domain);
    if (!pub) {
      pub = {
        id: 'pub-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        domain,
        status: 'active',
        firstSeen: now,
        lastSeen: now,
        totalRequests: 0,
        impressions: 0,
        clicks: 0,
        slotsUsed: slotId ? [slotId] : [],
        notes: 'Auto-detected from publisher web traffic',
      };
      this.publishers.push(pub);
    }

    pub.lastSeen = now;
    if (eventType === 'request') {
      pub.totalRequests += 1;
    } else if (eventType === 'impression') {
      pub.impressions += 1;
    } else if (eventType === 'click') {
      pub.clicks += 1;
    }

    if (slotId && !pub.slotsUsed.includes(slotId)) {
      pub.slotsUsed.push(slotId);
    }

    this.saveToDisk();
    return { isBlocked: pub.status === 'blocked', domainRecord: pub };
  }

  public toggleDomainStatus(idOrDomain: string, targetStatus?: 'active' | 'blocked'): PublisherDomain | null {
    const norm = this.normalizeDomain(idOrDomain);
    const pub = this.publishers.find((p) => p.id === idOrDomain || p.domain === norm);
    if (!pub) return null;

    if (targetStatus) {
      pub.status = targetStatus;
    } else {
      pub.status = pub.status === 'active' ? 'blocked' : 'active';
    }

    this.saveToDisk();
    return pub;
  }

  public addPublisherDomain(domainInput: string, status: 'active' | 'blocked' = 'active', notes: string = ''): PublisherDomain {
    const domain = this.normalizeDomain(domainInput);
    const now = new Date().toISOString();

    let pub = this.publishers.find((p) => p.domain === domain);
    if (pub) {
      pub.status = status;
      if (notes) pub.notes = notes;
      pub.lastSeen = now;
    } else {
      pub = {
        id: 'pub-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        domain,
        status,
        firstSeen: now,
        lastSeen: now,
        totalRequests: 0,
        impressions: 0,
        clicks: 0,
        slotsUsed: [],
        notes: notes || 'Manually added to protection list',
      };
      this.publishers.push(pub);
    }

    this.saveToDisk();
    return pub;
  }

  public deletePublisherDomain(id: string): boolean {
    const idx = this.publishers.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    this.publishers.splice(idx, 1);
    this.saveToDisk();
    return true;
  }

  // ==========================================
  // USER AUTHENTICATION & MANAGEMENT
  // ==========================================

  public authenticateUser(
    usernameOrEmail: string,
    password: string
  ): { user: UserAccount; token: string } | null {
    const query = (usernameOrEmail || '').trim().toLowerCase();
    if (!query || !password) return null;

    const user = this.users.find(
      (u) => u.username.toLowerCase() === query || u.email.toLowerCase() === query
    );
    if (!user) return null;

    const isValid = this.verifyPassword(password, user.passwordHash, user.salt);
    if (!isValid) return null;

    user.lastLoginAt = new Date().toISOString();
    this.saveToDisk();

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    this.sessions.set(token, {
      token,
      userId: user.id,
      username: user.username,
      role: user.role,
      createdAt: new Date().toISOString(),
      expiresAt,
    });

    const { passwordHash, salt, ...safeUser } = user;
    return { user: safeUser, token };
  }

  public validateSession(token: string): UserAccount | null {
    if (!token) return null;
    const session = this.sessions.get(token);
    if (!session) return null;

    if (new Date(session.expiresAt).getTime() < Date.now()) {
      this.sessions.delete(token);
      return null;
    }

    const user = this.users.find((u) => u.id === session.userId);
    if (!user) return null;

    const { passwordHash, salt, ...safeUser } = user;
    return safeUser;
  }

  public destroySession(token: string): boolean {
    return this.sessions.delete(token);
  }

  public getUsers(): UserAccount[] {
    return this.users.map(({ passwordHash, salt, ...safeUser }) => safeUser);
  }

  public getUserById(id: string): UserAccount | null {
    const user = this.users.find((u) => u.id === id);
    if (!user) return null;
    const { passwordHash, salt, ...safeUser } = user;
    return safeUser;
  }

  public createUser(data: {
    username: string;
    name: string;
    email: string;
    password: string;
    role?: UserRole;
  }): { success: boolean; user?: UserAccount; error?: string } {
    const trimmedUsername = (data.username || '').trim().toLowerCase();
    const trimmedEmail = (data.email || '').trim().toLowerCase();

    if (!trimmedUsername || !data.password || !trimmedEmail) {
      return { success: false, error: 'Username, email, and password are required' };
    }

    if (trimmedUsername.length < 3) {
      return { success: false, error: 'Username must be at least 3 characters' };
    }

    if (data.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    if (this.users.some((u) => u.username.toLowerCase() === trimmedUsername)) {
      return { success: false, error: `Username "${trimmedUsername}" is already taken` };
    }

    if (this.users.some((u) => u.email.toLowerCase() === trimmedEmail)) {
      return { success: false, error: `Email "${trimmedEmail}" is already registered` };
    }

    const { hash, salt } = this.hashPassword(data.password);
    const newUser: StoredUser = {
      id: 'usr-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      username: trimmedUsername,
      name: (data.name || '').trim() || trimmedUsername,
      email: trimmedEmail,
      role: data.role || 'manager',
      passwordHash: hash,
      salt,
      createdAt: new Date().toISOString(),
    };

    this.users.push(newUser);
    this.saveToDisk();

    const { passwordHash, salt: _, ...safeUser } = newUser;
    return { success: true, user: safeUser };
  }

  public updateUser(
    id: string,
    updates: { name?: string; email?: string; role?: UserRole; newPassword?: string }
  ): { success: boolean; user?: UserAccount; error?: string } {
    const user = this.users.find((u) => u.id === id);
    if (!user) return { success: false, error: 'User not found' };

    if (updates.email) {
      const trimmedEmail = updates.email.trim().toLowerCase();
      const existing = this.users.find((u) => u.email.toLowerCase() === trimmedEmail && u.id !== id);
      if (existing) {
        return { success: false, error: `Email "${trimmedEmail}" is already in use by another account` };
      }
      user.email = trimmedEmail;
    }

    if (updates.name !== undefined) {
      user.name = updates.name.trim();
    }

    if (updates.role) {
      // If demoting an admin, ensure another active admin remains
      if (user.role === 'admin' && updates.role !== 'admin') {
        const adminCount = this.users.filter((u) => u.role === 'admin').length;
        if (adminCount <= 1) {
          return { success: false, error: 'Cannot change role: At least one Administrator is required' };
        }
      }
      user.role = updates.role;
    }

    if (updates.newPassword) {
      if (updates.newPassword.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters' };
      }
      const { hash, salt } = this.hashPassword(updates.newPassword);
      user.passwordHash = hash;
      user.salt = salt;
    }

    this.saveToDisk();
    const { passwordHash, salt, ...safeUser } = user;
    return { success: true, user: safeUser };
  }

  public changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): { success: boolean; error?: string } {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return { success: false, error: 'User not found' };

    const isValid = this.verifyPassword(currentPassword, user.passwordHash, user.salt);
    if (!isValid) {
      return { success: false, error: 'Current password does not match' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters' };
    }

    const { hash, salt } = this.hashPassword(newPassword);
    user.passwordHash = hash;
    user.salt = salt;

    this.saveToDisk();
    return { success: true };
  }

  public deleteUser(id: string, requestUserId?: string): { success: boolean; error?: string } {
    if (requestUserId && id === requestUserId) {
      return { success: false, error: 'You cannot delete your own logged-in account' };
    }

    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) return { success: false, error: 'User not found' };

    const user = this.users[idx];
    if (user.role === 'admin') {
      const adminCount = this.users.filter((u) => u.role === 'admin').length;
      if (adminCount <= 1) {
        return { success: false, error: 'Cannot delete the last remaining Administrator account' };
      }
    }

    // Terminate any active sessions for deleted user
    for (const [token, session] of this.sessions.entries()) {
      if (session.userId === id) {
        this.sessions.delete(token);
      }
    }

    this.users.splice(idx, 1);
    this.saveToDisk();
    return { success: true };
  }
}

export const adServerDb = new AdServerDatabase();
