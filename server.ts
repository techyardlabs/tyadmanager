import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { adServerDb } from './server/db.ts';
import { PREDEFINED_SLOTS } from './src/types.ts';

const PORT = 3000;

// 1x1 Transparent GIF Buffer for pixel impression tracking
const TRANSPARENT_GIF_1X1 = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

async function startServer() {
  const app = express();

  // Enable CORS globally so publisher sites can fetch ad tags and assets from any domain
  app.use(
    cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Body parser with generous payload size for creative media uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Ensure uploads directory exists
  const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // CDN Static Ad Delivery Tag Endpoint
  app.get('/cdn/ad-loader.js', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=300'); // Low TTL for quick dev updates

    const scriptPath = path.resolve(process.cwd(), 'public', 'cdn', 'ad-loader.js');
    if (fs.existsSync(scriptPath)) {
      res.sendFile(scriptPath);
    } else {
      res.status(404).send('console.error("Ad loader not found");');
    }
  });

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Helper to extract requesting publisher domain
  const extractRequestDomain = (req: Request): string => {
    const queryDomain = (req.query.domain as string) || '';
    if (queryDomain) {
      return adServerDb.normalizeDomain(queryDomain);
    }
    const queryRef = (req.query.ref as string) || '';
    if (queryRef) {
      return adServerDb.normalizeDomain(queryRef);
    }
    const referer = (req.headers.referer as string) || '';
    if (referer) {
      return adServerDb.normalizeDomain(referer);
    }
    const origin = (req.headers.origin as string) || '';
    if (origin) {
      return adServerDb.normalizeDomain(origin);
    }
    return 'unknown';
  };

  // ==========================================
  // AD SERVING & TELEMETRY ENGINE (CORS ENABLED)
  // ==========================================

  // 1. Dynamic Ad Delivery Route: GET /api/serve?slot=<slotId>&ref=<publisherUrl>&domain=<domain>
  app.get('/api/serve', (req: Request, res: Response) => {
    const slotId = (req.query.slot as string) || '';
    const domain = extractRequestDomain(req);

    if (!slotId) {
      res.status(400).json({ error: 'Missing required query parameter: slot' });
      return;
    }

    // Check domain blocking
    const isBlocked = adServerDb.isDomainBlocked(domain);

    // Track request telemetry on domain level
    adServerDb.recordDomainActivity(domain, slotId, 'request');

    if (isBlocked) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.status(200).json({
        ad: null,
        slotId,
        domain,
        blocked: true,
        message: `Ad serving suspended: Website '${domain}' is blocked by the ad server administrator.`,
      });
      return;
    }

    const ad = adServerDb.selectAdForSlot(slotId);

    if (!ad) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.json({ ad: null, slotId, domain, message: 'No active creative scheduled for this slot' });
      return;
    }

    // Determine host origin for absolute tracking URLs
    const proto = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host || `localhost:${PORT}`;
    const baseUrl = `${proto}://${host}`;

    const clickUrl = `${baseUrl}/api/click/${ad.id}?slot=${encodeURIComponent(
      slotId
    )}&domain=${encodeURIComponent(domain)}&dest=${encodeURIComponent(ad.targetUrl)}`;
    const impressionUrl = `${baseUrl}/api/impression/${ad.id}?slot=${encodeURIComponent(
      slotId
    )}&domain=${encodeURIComponent(domain)}`;

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json({
      ad: {
        creativeId: ad.id,
        campaignId: ad.campaignId,
        slotId: ad.slotId,
        name: ad.name,
        formatType: ad.formatType,
        videoType: ad.videoType,
        mediaUrl: ad.mediaUrl,
        youtubeUrl: ad.youtubeUrl,
        embedCode: ad.embedCode,
        targetUrl: ad.targetUrl,
        clickUrl,
        impressionUrl,
        width: ad.width,
        height: ad.height,
        weight: ad.weight,
        domain,
      },
    });
  });

  // 2. Impression Tracking Beacon: GET & POST /api/impression/:creativeId
  const handleImpression = (req: Request, res: Response) => {
    const { creativeId } = req.params;
    const slotId = (req.query.slot as string) || '';
    const domain = extractRequestDomain(req);
    const userAgent = (req.headers['user-agent'] as string) || '';
    const referer = (req.headers.referer as string) || (req.query.ref as string) || '';

    // If domain is blocked, reject recording impression
    if (adServerDb.isDomainBlocked(domain)) {
      res.status(403).json({ error: 'Domain is blocked', domain });
      return;
    }

    adServerDb.recordImpression(creativeId, {
      slotId,
      userAgent,
      referer,
    });

    // Record domain-level impression count
    adServerDb.recordDomainActivity(domain, slotId, 'impression');

    // Check if client expects a 1x1 tracking pixel or JSON
    const acceptsImage = req.headers.accept && req.headers.accept.includes('image/');
    if (acceptsImage || req.method === 'GET') {
      res.setHeader('Content-Type', 'image/gif');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.status(200).send(TRANSPARENT_GIF_1X1);
    } else {
      res.json({ success: true, recorded: 'impression', domain });
    }
  };

  app.get('/api/impression/:creativeId', handleImpression);
  app.post('/api/impression/:creativeId', handleImpression);

  // 3. Click Tracking Redirect: GET /api/click/:creativeId
  app.get('/api/click/:creativeId', (req: Request, res: Response) => {
    const { creativeId } = req.params;
    const slotId = (req.query.slot as string) || '';
    const dest = (req.query.dest as string) || '';
    const domain = extractRequestDomain(req);
    const userAgent = (req.headers['user-agent'] as string) || '';
    const referer = (req.headers.referer as string) || (req.query.ref as string) || '';

    if (adServerDb.isDomainBlocked(domain)) {
      res.status(403).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Access Suspended</title></head>
        <body style="background:#090d16;color:#e2e8f0;font-family:sans-serif;padding:40px;text-align:center;">
          <h2 style="color:#ef4444;">Ad Delivery Suspended</h2>
          <p>The referring domain <code>${domain}</code> has been restricted by the ad server administrator.</p>
        </body>
        </html>
      `);
      return;
    }

    const targetUrl = adServerDb.recordClick(creativeId, {
      slotId,
      userAgent,
      referer,
      dest,
    });

    // Record domain-level click count
    adServerDb.recordDomainActivity(domain, slotId, 'click');

    // Clean destination URL fallback
    let safeRedirect = targetUrl;
    if (!safeRedirect.startsWith('http://') && !safeRedirect.startsWith('https://')) {
      safeRedirect = 'https://' + safeRedirect;
    }

    res.redirect(302, safeRedirect);
  });

  // ==========================================
  // ADMIN & AUTH CONTROL PANEL REST APIS
  // ==========================================

  // Session user resolver
  const getAuthUser = (req: Request) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    const token = authHeader.substring(7).trim();
    return adServerDb.validateSession(token);
  };

  // 1. Authentication Endpoints
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    const result = adServerDb.authenticateUser(username, password);
    if (!result) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    res.json({
      success: true,
      user: result.user,
      token: result.token,
    });
  });

  app.get('/api/auth/me', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized or session expired' });
      return;
    }
    res.json({ user });
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      adServerDb.destroySession(token);
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });

  app.post('/api/auth/change-password', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required' });
      return;
    }

    const result = adServerDb.changePassword(user.id, currentPassword, newPassword);
    if (!result.success) {
      res.status(400).json({ error: result.error || 'Failed to change password' });
      return;
    }

    res.json({ success: true, message: 'Password updated successfully' });
  });

  // 2. User Management Endpoints
  app.get('/api/users', (req: Request, res: Response) => {
    res.json(adServerDb.getUsers());
  });

  app.post('/api/users', (req: Request, res: Response) => {
    const { username, name, email, password, role } = req.body || {};
    const result = adServerDb.createUser({ username, name, email, password, role });
    if (!result.success) {
      res.status(400).json({ error: result.error || 'Failed to create user' });
      return;
    }
    res.status(201).json(result.user);
  });

  app.put('/api/users/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, email, role, newPassword } = req.body || {};
    const result = adServerDb.updateUser(id, { name, email, role, newPassword });
    if (!result.success) {
      res.status(400).json({ error: result.error || 'Failed to update user' });
      return;
    }
    res.json(result.user);
  });

  app.delete('/api/users/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const currentUser = getAuthUser(req);
    const result = adServerDb.deleteUser(id, currentUser?.id);
    if (!result.success) {
      res.status(400).json({ error: result.error || 'Failed to delete user' });
      return;
    }
    res.json({ success: true, message: 'User deleted successfully' });
  });

  // Dashboard Stats
  app.get('/api/dashboard/stats', (req: Request, res: Response) => {
    const stats = adServerDb.getDashboardStats();
    res.json(stats);
  });

  // Predefined Inventory Slots
  app.get('/api/slots', (req: Request, res: Response) => {
    const creatives = adServerDb.getCreatives();
    const result = PREDEFINED_SLOTS.map((slot) => {
      const assigned = creatives.filter((c) => c.slotId === slot.id);
      const activeCount = assigned.filter((c) => c.status === 'active').length;
      return {
        ...slot,
        totalCreatives: assigned.length,
        activeCreatives: activeCount,
        hasActiveServing: activeCount > 0,
      };
    });
    res.json(result);
  });

  // Campaigns CRUD
  app.get('/api/campaigns', (req: Request, res: Response) => {
    res.json(adServerDb.getCampaigns());
  });

  app.post('/api/campaigns', (req: Request, res: Response) => {
    const campaign = adServerDb.createCampaign(req.body);
    res.status(201).json(campaign);
  });

  app.put('/api/campaigns/:id', (req: Request, res: Response) => {
    const updated = adServerDb.updateCampaign(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }
    res.json(updated);
  });

  app.delete('/api/campaigns/:id', (req: Request, res: Response) => {
    const deleted = adServerDb.deleteCampaign(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }
    res.json({ success: true });
  });

  // Creatives CRUD
  app.get('/api/creatives', (req: Request, res: Response) => {
    const slotId = req.query.slot as string;
    res.json(adServerDb.getCreatives(slotId));
  });

  app.post('/api/creatives', (req: Request, res: Response) => {
    const creative = adServerDb.createCreative(req.body);
    res.status(201).json(creative);
  });

  app.put('/api/creatives/:id', (req: Request, res: Response) => {
    const updated = adServerDb.updateCreative(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Creative not found' });
      return;
    }
    res.json(updated);
  });

  app.delete('/api/creatives/:id', (req: Request, res: Response) => {
    const deleted = adServerDb.deleteCreative(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Creative not found' });
      return;
    }
    res.json({ success: true });
  });

  // Creative File Upload (images / media data URLs)
  app.post('/api/upload', (req: Request, res: Response) => {
    const { filename, dataUrl } = req.body;
    if (!dataUrl) {
      res.status(400).json({ error: 'No dataUrl provided' });
      return;
    }

    // We can store as file in public/uploads or return dataUrl
    try {
      const match = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (match) {
        const ext = match[1].split('/')[1] || 'png';
        const safeName = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
        const filePath = path.resolve(uploadsDir, safeName);
        fs.writeFileSync(filePath, Buffer.from(match[2], 'base64'));
        const publicUrl = `/uploads/${safeName}`;
        res.json({ url: publicUrl, filename: safeName });
        return;
      }
      // If direct string or external URL
      res.json({ url: dataUrl });
    } catch (err: any) {
      res.status(500).json({ error: 'Upload failed: ' + err.message });
    }
  });

  // Publisher Domain Detection & Protection APIs
  app.get('/api/publishers', (req: Request, res: Response) => {
    res.json(adServerDb.getPublisherDomains());
  });

  app.post('/api/publishers', (req: Request, res: Response) => {
    const { domain, status, notes } = req.body;
    if (!domain) {
      res.status(400).json({ error: 'Domain name is required' });
      return;
    }
    const record = adServerDb.addPublisherDomain(domain, status || 'active', notes || '');
    res.status(201).json(record);
  });

  app.put('/api/publishers/:id/toggle', (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body || {};
    const updated = adServerDb.toggleDomainStatus(id, status);
    if (!updated) {
      res.status(404).json({ error: 'Publisher domain not found' });
      return;
    }
    res.json(updated);
  });

  app.delete('/api/publishers/:id', (req: Request, res: Response) => {
    const deleted = adServerDb.deletePublisherDomain(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Publisher domain not found' });
      return;
    }
    res.json({ success: true });
  });

  // Reset metrics
  app.post('/api/reset-stats', (req: Request, res: Response) => {
    adServerDb.resetStats();
    res.json({ success: true, message: 'All impression and click statistics reset to 0' });
  });

  // Static uploads serving
  app.use('/uploads', express.static(uploadsDir));

  // ==========================================
  // VITE CLIENT MIDDLEWARE / SPA FALLBACK
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AdServer Engine] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
