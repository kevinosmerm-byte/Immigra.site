import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const allowedHosts = env.VITE_ALLOWED_HOSTS
    ? env.VITE_ALLOWED_HOSTS.split(',').map((host) => host.trim()).filter(Boolean)
    : undefined;

  return {
    plugins: [react(), {
      name: 'self-contained-app-styles',
      apply: 'build',
      generateBundle: {
        order: 'post',
        handler(_options, bundle) {
          const page = bundle['index.html'];
          if (!page || typeof page.source !== 'string') return;
          page.source = page.source.replace(/<link\b[^>]*rel="stylesheet"[^>]*>/g, tag => {
            const href = tag.match(/href="([^"]+)"/)?.[1];
            const asset = href && bundle[href.replace(/^\//, '')];
            if (!asset || asset.type !== 'asset') throw new Error('Missing production stylesheet: ' + href);
            return '<style data-app-styles="embedded">' + String(asset.source).replace(/<\/style/gi, '<\\/style') + '</style>';
          });
        },
      },
    }],
    server: {
      host: true,
      allowedHosts,
      proxy: {
        '/api': {
          target: env.VITE_DEV_API_TARGET || 'http://127.0.0.1:3001',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  };
});
