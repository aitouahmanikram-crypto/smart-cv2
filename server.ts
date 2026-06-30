import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

// Import handlers
import healthHandler from './api/health.js';
import loginHandler from './api/auth/login.js';
import registerHandler from './api/auth/register.js';
import meHandler from './api/auth/me.js';
import logoutHandler from './api/auth/logout.js';
import dashboardStatsHandler from './api/dashboard/stats.js';
import profileUpdateHandler from './api/profile/update.js';
import jobsIndexHandler from './api/jobs/index.js';
import jobsCreateHandler from './api/jobs/create.js';
import cvsUploadHandler from './api/cvs/upload.js';
import cvsUploadTestHandler from './api/cvs/upload-test.js';
import cvsIndexHandler from './api/cvs/index.js';
import coverLettersIndexHandler from './api/cover-letters/index.js';
import coverLettersGenerateHandler from './api/cover-letters/generate.js';
import settingsLanguageHandler from './api/settings/language.js';
import matchesSavedHandler from './api/matches/saved.js';
import adminHandler from './api/admin.js';
import actionsHandler from './api/actions.js';

// Support both ESM and CJS for __dirname
const _dirname = typeof __dirname !== 'undefined' 
  ? __dirname 
  : path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const port = parseInt(process.env.PORT || '3000', 10);

  app.use(cors());
  app.use(express.json());

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`[Server] Incoming: ${req.method} ${req.url}`);
    next();
  });

  // API Route Helper to adapt Vercel handlers to Express
  const vercelToExpress = (handler: any, name: string) => async (req: any, res: any) => {
    console.log(`[Server] Routing request to API: ${name} (${req.method})`);
    try {
      // Vercel handlers expect req and res objects
      // Express objects are mostly compatible
      // Handle the case where the import is an ES module with a default export
      const actualHandler = handler.default || handler;
      if (typeof actualHandler !== 'function') {
        console.error(`[Server] Handler for ${name} is not a function!`, actualHandler);
        return res.status(500).json({ success: false, error: `Handler ${name} is missing or invalid` });
      }
      await actualHandler(req, res);
    } catch (err) {
      console.error(`[Server] API Error in ${name}:`, err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: 'Internal server error' });
      }
    }
  };

  // Middleware to inject query action for actions routing
  const actionsWithDefault = (actionName: string) => async (req: any, res: any, next: any) => {
    req.query = req.query || {};
    if (!req.query.action) req.query.action = actionName;
    next();
  };

  // API Routes
  app.all('/api/health', vercelToExpress(healthHandler, 'health'));
  app.all('/api/auth/login', vercelToExpress(loginHandler, 'login'));
  app.all('/api/auth/register', vercelToExpress(registerHandler, 'register'));
  app.all('/api/auth/me', vercelToExpress(meHandler, 'me'));
  app.all('/api/auth/logout', vercelToExpress(logoutHandler, 'logout'));
  app.all('/api/dashboard/stats', vercelToExpress(dashboardStatsHandler, 'stats'));
  app.all('/api/profile/update', vercelToExpress(profileUpdateHandler, 'update-profile'));
  
  // Jobs
  app.all('/api/jobs', vercelToExpress(jobsIndexHandler, 'jobs-index-clean'));
  app.all('/api/jobs/index', vercelToExpress(jobsIndexHandler, 'jobs-index'));
  app.all('/api/jobs/create', vercelToExpress(jobsCreateHandler, 'jobs-create'));
  
  // CVs
  app.all('/api/cvs', vercelToExpress(cvsIndexHandler, 'cvs-index-clean'));
  app.all('/api/cvs/index', vercelToExpress(cvsIndexHandler, 'cvs-index'));
  app.all('/api/cvs/upload', vercelToExpress(cvsUploadHandler, 'cv-upload'));
  app.all('/api/cvs/upload-test', vercelToExpress(cvsUploadTestHandler, 'cv-upload-test'));
  app.all('/api/cvs/rewrite', actionsWithDefault('rewrite_cv'), vercelToExpress(actionsHandler, 'actions-rewrite-cv'));
  app.all('/api/cvs/:cvId/versions', async (req: any, res: any, next: any) => {
    req.query = req.query || {};
    req.query.action = 'cv_versions';
    req.query.cvId = req.params.cvId;
    next();
  }, vercelToExpress(actionsHandler, 'actions-cv-versions'));
  app.all('/api/cvs/:cvId/versions/:versionId/restore', async (req: any, res: any, next: any) => {
    req.query = req.query || {};
    req.query.action = 'restore_cv_version';
    req.query.cvId = req.params.cvId;
    req.query.versionId = req.params.versionId;
    next();
  }, vercelToExpress(actionsHandler, 'actions-restore-cv-version'));

  // Cover Letters
  app.all('/api/cover-letters', vercelToExpress(coverLettersIndexHandler, 'cover-letters-index-clean'));
  app.all('/api/cover-letters/index', vercelToExpress(coverLettersIndexHandler, 'cover-letters-index'));
  app.all('/api/cover-letters/generate', vercelToExpress(coverLettersGenerateHandler, 'cover-letters-generate'));
  
  // Matches & Settings
  app.all('/api/matches', actionsWithDefault('list_matches'), vercelToExpress(actionsHandler, 'actions-list-matches'));
  app.all('/api/matches/saved', vercelToExpress(matchesSavedHandler, 'matches-saved'));
  app.all('/api/matches/save/:id', vercelToExpress(matchesSavedHandler, 'matches-save-id'));
  app.all('/api/matches/analyze', actionsWithDefault('analyze_match'), vercelToExpress(actionsHandler, 'actions-analyze-match'));
  app.all('/api/matches/custom', actionsWithDefault('custom_match'), vercelToExpress(actionsHandler, 'actions-custom-match'));
  
  app.all('/api/settings', actionsWithDefault('get_settings'), vercelToExpress(actionsHandler, 'actions-get-settings'));
  app.all('/api/settings/language', vercelToExpress(settingsLanguageHandler, 'settings-language'));
  
  // History & Career Advice
  app.all('/api/history', actionsWithDefault('list_history'), vercelToExpress(actionsHandler, 'actions-list-history'));
  app.all('/api/history/:type/:id', async (req: any, res: any, next: any) => {
    req.query = req.query || {};
    req.query.action = 'delete_history_item';
    req.query.type = req.params.type;
    req.query.id = req.params.id;
    next();
  }, vercelToExpress(actionsHandler, 'actions-delete-history'));

  app.all('/api/career-advice/:cvId', async (req: any, res: any, next: any) => {
    req.query = req.query || {};
    req.query.action = 'get_career_advice';
    req.query.cvId = req.params.cvId;
    next();
  }, vercelToExpress(actionsHandler, 'actions-get-career-advice'));

  app.all('/api/admin/users/:id', async (req: any, res: any, next: any) => {
    req.query = req.query || {};
    req.query.action = 'users';
    req.query.id = req.params.id;
    next();
  }, vercelToExpress(adminHandler, 'admin-user-detail'));

  app.all('/api/admin/jobs/:id', async (req: any, res: any, next: any) => {
    req.query = req.query || {};
    req.query.action = 'jobs';
    req.query.id = req.params.id;
    next();
  }, vercelToExpress(adminHandler, 'admin-job-detail'));

  app.all('/api/admin', vercelToExpress(adminHandler, 'admin'));
  app.all('/api/actions', vercelToExpress(actionsHandler, 'actions'));
  
  // Catch-all for API that didn't match any route
  app.use('/api/*', (req, res) => {
    console.log(`[Server] API Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ success: false, error: `API Route not found: ${req.method} ${req.originalUrl}` });
  });

  // Serve static files in production, use Vite middleware in development
  if (process.env.NODE_ENV === 'production') {
    // If running from dist/server.cjs, _dirname is already the dist folder
    const distPath = _dirname.endsWith('dist') || _dirname.includes('/dist') 
      ? _dirname 
      : path.resolve(_dirname, 'dist');
    
    console.log(`[Server] Production mode. Serving static files from: ${distPath}`);
    
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      res.sendFile(indexPath);
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
