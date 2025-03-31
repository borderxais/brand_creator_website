import { createProxyMiddleware } from 'http-proxy-middleware';
import { NextApiRequest, NextApiResponse } from 'next';

// Configure the proxy to your FastAPI backend
const apiProxy = createProxyMiddleware({
  target: 'http://localhost:8000', // Change this to your FastAPI server address
  changeOrigin: true,
  pathRewrite: {
    '^/api/advertiser': '/api/advertiser', // Keep the path the same
  },
  logLevel: 'debug',
});

// Disable body parsing to let proxy handle it
export const config = {
  api: {
    bodyParser: false,
  },
};

// This function handles all advertiser API routes
export default function handler(req, res) {
  // Forward the request to the FastAPI backend
  return apiProxy(req, res);
}
