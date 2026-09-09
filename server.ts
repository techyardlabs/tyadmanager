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

  // ==========================================
  // AD SERVING & TELEMETRY ENGINE (CORS ENABLED)
  // ==========================================

  // 1. Dynamic Ad Delivery Route: GET /api/serve?slot=<slotId>&ref=<publisherUrl>
  app.get('/api/serve', (req: Request, res: Response) => {
    const slotId = (req.query.slot as string) || '';
    const referer = (req.query.ref as string) || (req.headers.referer as string) || '';

    if (!slotId) {
      res.status(400).json({ error: 'Missing required query parameter: slot' });
      return;
    }

    const ad = adServerDb.selectAdForSlot(slotId);

    if (!ad) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.json({ ad: null, slotId, message: 'No active creative scheduled for this slot' });
      return;
    }

    // Determine host origin for absolute tracking URLs
    const proto = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host || `localhost:${PORT}`;
    const baseUrl = `${proto}://${host}`;

    const clickUrl = `${baseUrl}/api/click/${ad.id}?slot=${encodeURIComponent(
      slotId
    )}&dest=${encodeURIComponent(ad.targetUrl)}`;
    const impressionUrl = `${baseUrl}/api/impression/${ad.id}?slot=${encodeURIComponent(
      slotId
    )}`;

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
      },
    });
  });

  // 2. Impression Tracking Beacon: GET & POST /api/impression/:creativeId
  const handleImpression = (req: Request, res: Response) => {
    const { creativeId } = req.params;
    const slotId = (req.query.slot as string) || '';
    const userAgent = (req.headers['user-agent'] as string) || '';
    const referer = (req.headers.referer as string) || '';

    adServerDb.recordImpression(creativeId, {
      slotId,
      userAgent,
      referer,
    });

    // Check if client expects a 1x1 tracking pixel or JSON
    const acceptsImage = req.headers.accept && req.headers.accept.includes('image/');
    if (acceptsImage || req.method === 'GET') {
      res.setHeader('Content-Type', 'image/gif');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.status(200).send(TRANSPARENT_GIF_1X1);
    } else {
      res.json({ success: true, recorded: 'impression' });
    }
  };

  app.get('/api/impression/:creativeId', handleImpression);
  app.post('/api/impression/:creativeId', handleImpression);

  // 3. Click Tracking Redirect: GET /api/click/:creativeId
  app.get('/api/click/:creativeId', (req: Request, res: Response) => {
    const { creativeId } = req.params;
    const slotId = (req.query.slot as string) || '';
    const dest = (req.query.dest as string) || '';
    const userAgent = (req.headers['user-agent'] as string) || '';
    const referer = (req.headers.referer as string) || '';

    const targetUrl = adServerDb.recordClick(creativeId, {
      slotId,
      userAgent,
      referer,
      dest,
    });

    // Clean destination URL fallback
    let safeRedirect = targetUrl;
    if (!safeRedirect.startsWith('http://') && !safeRedirect.startsWith('https://')) {
      safeRedirect = 'https://' + safeRedirect;
    }

    res.redirect(302, safeRedirect);
  });

  // ==========================================
  // ADMIN CONTROL PANEL REST APIS
  // ==========================================

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
