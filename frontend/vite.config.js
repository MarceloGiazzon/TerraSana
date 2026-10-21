import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["maplibre-gl"],
  },
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  server: {
    proxy: {
      "/tiles": {
        target: "https://tile.openstreetmap.org",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tiles/, ""),
      },
    },
    fs: {
      allow: [fileURLToPath(new URL("..", import.meta.url))],
    },
  },
});