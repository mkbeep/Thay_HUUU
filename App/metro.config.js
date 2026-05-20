// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { createProxyMiddleware } = require('http-proxy-middleware');

const API_TARGET = (process.env.EXPO_API_PROXY_TARGET || 'http://127.0.0.1:3000').replace(
  /\/+$/,
  ''
);

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver = {
  ...config.resolver,
  sourceExts: [...(config.resolver?.sourceExts || []), 'cjs'],
  extraNodeModules: {
    ...config.resolver?.extraNodeModules,
  },
};

// Khi quet QR qua ngrok :8081 — chuyen /api, /images, /socket.io ve backend :3000
const backendProxy = createProxyMiddleware({
  target: API_TARGET,
  changeOrigin: true,
  ws: true,
});

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      const url = req.url?.split('?')[0] || '';
      if (
        url.startsWith('/api') ||
        url.startsWith('/images') ||
        url.startsWith('/uploads') ||
        url.startsWith('/socket.io')
      ) {
        return backendProxy(req, res, next);
      }
      // SPA: /table/... tra ve index (Expo web)
      const isAsset =
        url.includes('.') &&
        !url.endsWith('.html') &&
        /\.(js|css|png|jpg|jpeg|gif|webp|ico|svg|woff2?|ttf|map|bundle)$/i.test(url);
      if (
        !isAsset &&
        (url.startsWith('/table') || url.startsWith('/t/') || url.startsWith('/ban/')) &&
        req.method === 'GET'
      ) {
        req.url = '/';
      }
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
