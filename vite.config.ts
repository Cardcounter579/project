import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      // db.json writes on every API mutation — don't full-reload the client
      ignored: ["**/data/**"],
    },
  },
});
