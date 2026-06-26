import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

// Import handlers
import loginHandler from './api/auth/login.js';
import registerHandler from './api/auth/register.js';
import meHandler from './api/auth/me.js';
import logoutHandler from './api/auth/logout.js';
import dashboardStatsHandler from './api/dashboard/stats.js';
import profileUpdateHandler from './api/profile/update.js';
import jobsIndexHandler from './api/jobs/index.js';
import jobsCreateHandler from './api/jobs/create.js';
import cvsUploadHandler from './api/cvs/upload.js';
import cvsIndexHandler from './api/cvs/index.js';
import adminHandler from './api/admin.js';
import actionsHandler from './api/actions.js';

// Support both ESM and CJS for __dirname
const _dirname = typeof __dirname !== 'undefined' 
  ? __dirname 
  : path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const port = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json());

  // API Route Helper to adapt Vercel handlers to Express
  const vercelToExpress = (handler: any) => async (req: any, res: any) => {
    try {
      // Vercel handlers expect req and res objects
      // Express objects are mostly compatible
      // Handle the case where the import is an ES module with a default export
      const actualHandler = handler.default || handler;
      await actualHandler(req, res);
    } catch (err) {
      console.error('API Error:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: 'Internal server error' });
      }
    }
  };

  // API Routes
  app.all('/api/auth/login', vercelToExpress(loginHandler));
  app.all('/api/auth/register', vercelToExpress(registerHandler));
  app.all('/api/auth/me', vercelToExpress(meHandler));
  app.all('/api/auth/logout', vercelToExpress(logoutHandler));
  app.all('/api/dashboard/stats', vercelToExpress(dashboardStatsHandler));
  app.all('/api/profile/update', vercelToExpress(profileUpdateHandler));
  app.all('/api/jobs/index', vercelToExpress(jobsIndexHandler));
  app.all('/api/jobs/create', vercelToExpress(jobsCreateHandler));
  app.all('/api/cvs/upload', vercelToExpress(cvsUploadHandler));
  app.all('/api/cvs/index', vercelToExpress(cvsIndexHandler));
  app.all('/api/admin', vercelToExpress(adminHandler));
  app.all('/api/actions', vercelToExpress(actionsHandler));

  // Serve static files in production, use Vite middleware in development
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(_dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
