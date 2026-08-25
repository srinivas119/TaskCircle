import app from '../src/index.js';

export default function handler(req, res) {
  const path = req.query['...path'];

  if (path) {
    const cleanPath = Array.isArray(path)
      ? `/${path.join('/')}`
      : `/${path}`;

    req.url = cleanPath;
  }

  return app(req, res);
}