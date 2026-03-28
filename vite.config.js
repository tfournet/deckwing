import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Vite plugin: fix Electron CSS loading.
 *
 * 1. Strip `crossorigin` — Electron serves from localhost via Express,
 *    so CORS mode on <script>/<link> tags causes sheet.cssRules access
 *    failures and may trigger the server's CORS middleware rejection.
 *
 * 2. Move <link rel="stylesheet"> before <script type="module"> — CSS
 *    must be render-blocking before the module script executes so React
 *    never paints an unstyled frame.  Vite 7 emits the script first by
 *    default; swapping them guarantees styles are parsed before React
 *    mounts the component tree.
 */
function fixElectronCSS() {
  return {
    name: 'fix-electron-css',
    enforce: 'post',
    transformIndexHtml(html) {
      // Strip crossorigin attributes
      let out = html.replace(/ crossorigin/g, '');

      // Move <link rel="stylesheet"> before <script type="module">.
      // Capture both tags, then emit them in CSS-first order.
      const linkTag = out.match(/<link rel="stylesheet"[^>]*>/)?.[0];
      const scriptTag = out.match(/<script type="module"[^>]*><\/script>/)?.[0];
      if (linkTag && scriptTag) {
        // Remove both from their current positions
        out = out.replace(linkTag, '');
        out = out.replace(scriptTag, '');
        // Re-insert CSS first, then JS, right before </head>
        out = out.replace('</head>', `    ${linkTag}\n    ${scriptTag}\n  </head>`);
      }

      return out;
    },
  };
}

export default defineConfig({
  plugins: [react(), fixElectronCSS()],
  server: {
    host: 'localhost',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  test: {
    globals: true,
    environment: 'node',
  },
})
