import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/igreja/",
  build: { outDir: "../frontend/public/igreja", emptyOutDir: true },
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), { name: "lint-banner", generateBundle(_o, bundle) { for (const c of Object.values(bundle)) if (c.type === "chunk") c.code = "/* eslint-disable */\n" + c.code; } }, mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
}));
