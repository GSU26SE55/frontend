import path from "path";
import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // React Compiler ships only as a Babel plugin, so every source file is parsed twice:
    // once by oxc for JSX, once by Babel for the compiler. Measured on this repo that is
    // ~95% of the build (1.5s without it, 22-35s with), and it is what rolldown's
    // PLUGIN_TIMINGS warning is pointing at. Turning off Babel's own source maps was
    // tried and made no measurable difference — the cost is the parse, not the map.
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Route pages are code-split, so a 500 kB warning on a route chunk would be noise.
    // 700 kB still catches a genuinely runaway chunk.
    chunkSizeWarningLimit: 700,
    // Every browser this app targets supports <link rel="modulepreload">; skipping the
    // polyfill removes its inline script from the entry chunk.
    modulePreload: { polyfill: false },
    rollupOptions: {
      output: {
        // `entriesAware` groups name a chunk after every entry that uses it, which produced
        // 112-character filenames like
        // "ui-primitives~index~AccountsPage~AdminTicketDetailPage~…-Ck-glit7.js".
        // Those are long enough to risk path-length limits on Windows deploy targets and are
        // unreadable in a network panel. Keep the leading group name and let the hash carry
        // the identity.
        chunkFileNames(chunk) {
          const name = (chunk.name ?? "chunk").split("~")[0].slice(0, 40);
          return `assets/${name}-[hash].js`;
        },
        // Rolldown's current chunking option. `manualChunks` and `advancedChunks` are both
        // deprecated in rolldown 1.0 and are ignored when `codeSplitting` is present.
        //
        // These groups exist to keep long-lived vendor code in stable, separately cacheable
        // chunks, and to stop the heavy libraries from being duplicated across the many
        // lazy route chunks that use them.
        //
        // There is deliberately NO catch-all `{ test: /node_modules/ }` group. A manual group
        // forces its modules into one chunk across the eager/lazy boundary, so a catch-all
        // would sweep date-fns, lucide-react (imported by ~190 files), zod, axios and
        // dompurify into a single chunk referenced by the app shell — putting straight back
        // onto /login everything the route splitting just removed. Rolldown already extracts
        // modules shared by two or more dynamic entries on its own. If the automatic result
        // ever produces too many tiny chunks, the fix is a broad group with
        // `entriesAware: true`, never a plain catch-all.
        codeSplitting: {
          groups: [
            // Framework. Split out so a page-level change never invalidates React's cache entry.
            {
              name: "react",
              test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 100,
            },
            {
              name: "router-query",
              test: /node_modules[\\/](react-router|react-router-dom|@tanstack)[\\/]/,
              priority: 90,
            },
            // Recharts pulls the whole d3 constellation, and ~12 lazy pages use it.
            //
            // `entriesAware` is essential on every group below this point. A plain group emits
            // ONE chunk for all its modules, so if even a single module in it is reachable from
            // the app shell, the whole chunk becomes a shell dependency — recharts and its d3
            // tree (411 kB) rode into /login that way, because a couple of small utilities in
            // this group are also used by non-chart code. `entriesAware` subdivides the group
            // by which entries actually use each module, so the shell gets only the shared
            // utilities and the chart code stays on the routes that draw charts.
            {
              name: "charts",
              test: /node_modules[\\/](recharts|d3-[^\\/]+|victory-vendor|decimal\.js-light|internmap|delaunator|robust-predicates)[\\/]/,
              priority: 80,
              entriesAware: true,
            },
            // TipTap + ProseMirror — reached only from the three KB editor pages and the
            // blog editor panel.
            {
              name: "editor",
              test: /node_modules[\\/](@tiptap|prosemirror-[^\\/]+|orderedmap|rope-sequence|w3c-keyname|linkifyit|markdown-it|mdurl|uc\.micro)[\\/]/,
              priority: 80,
              entriesAware: true,
            },
            // Fetched on demand by the dynamic import in shared/lib/signalr.ts.
            {
              name: "signalr",
              test: /node_modules[\\/]@microsoft[\\/]signalr[\\/]/,
              priority: 80,
            },
            // Landing-page animation engine, reachable only from the lazy LandingPage.
            {
              name: "anime",
              test: /node_modules[\\/]animejs[\\/]/,
              priority: 80,
            },
            {
              name: "motion",
              test: /node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/,
              priority: 80,
              entriesAware: true,
            },
            // shadcn / Base UI primitives. The shell needs a handful of these (the tooltip
            // provider, the toaster); the rest — the date picker, the drawer, the command
            // palette — belong to individual pages, so this is entries-aware too.
            {
              name: "ui-primitives",
              test: /node_modules[\\/](@base-ui|@radix-ui|vaul|sonner|cmdk|react-day-picker)[\\/]/,
              priority: 70,
              entriesAware: true,
            },
            // lucide-react ships one module per icon, which without this produces a few
            // hundred sub-kilobyte chunks. `entriesAware` subdivides the group by which
            // entries actually import each icon, so a route still only fetches the icons it
            // uses — it just gets them in a handful of files instead of one file each.
            {
              name: "icons",
              test: /node_modules[\\/]lucide-react[\\/]/,
              priority: 60,
              entriesAware: true,
            },
          ],
        },
      },
    },
  },
  // Proxy /api → API gateway so the FE and API share an origin (localhost:5173) in dev.
  // Needed for the Google OAuth flow: the g_oauth_state cookie (SameSite=Lax) is only
  // sent when the callback XHR is same-origin. Target comes from VITE_DEV_API_TARGET
  // (default 4001).
  server: {
    // The dev server is also reached through a reserved ngrok domain, and Vite rejects
    // any Host header it was not told about.
    allowedHosts: [".ngrok-free.dev"],
    proxy: {
      "/api": {
        target: process.env.VITE_DEV_API_TARGET ?? "http://localhost:4001",
        changeOrigin: true,
      },
      // SignalR hub. Same-origin for the same reason as /api: opened through the
      // ngrok tunnel, an absolute http://localhost:4001 hub URL is blocked by the
      // browser's loopback-address restriction. ws:true upgrades the WebSocket.
      "/hubs": {
        target: process.env.VITE_DEV_API_TARGET ?? "http://localhost:4001",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
