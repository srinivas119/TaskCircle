export default function handler(req, res) {
  res.status(200).json({
    message: "Vercel function reached",
    url: req.url,
    originalUrl: req.originalUrl,
    method: req.method,
    query: req.query,
    path: req.path
  });
}