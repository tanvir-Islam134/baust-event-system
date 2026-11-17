import app from '../server/src/app.js';

export default function handler(req, res) {
  // Ensure req.url starts with /api so Express routes match seamlessly
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  return app(req, res);
}
