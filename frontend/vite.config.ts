import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import babel from "@rolldown/plugin-babel";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    babel({
      plugins: ["babel-plugin-react-compiler"],
    }),
  ],

  build: {
    cssMinify: "esbuild",
  },
});