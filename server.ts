
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Endpoint to download the code as ZIP
  app.get("/api/download-source", async (req, res) => {
    try {
      const zip = new AdmZip();
      const rootPath = process.cwd();
      
      // Exclude list to keep the ZIP clean and small
      const exclude = ['node_modules', 'dist', '.git', '.next', '.trunk', '.DS_Store'];
      
      // Specifically include Capacitor/AdSense files if they exist
      const toInclude = ['AdSenseService.ts', 'components/AdOverlay.tsx'];
      
      const files = fs.readdirSync(rootPath);
      
      files.forEach(file => {
        if (!exclude.includes(file)) {
          const itemPath = path.join(rootPath, file);
          const stats = fs.statSync(itemPath);
          if (stats.isDirectory()) {
            zip.addLocalFolder(itemPath, file);
          } else {
            zip.addLocalFile(itemPath);
          }
        }
      });

      const zipName = `fury_arena_PRO_SOURCE.zip`;
      const data = zip.toBuffer();

      res.set('Content-Type', 'application/zip');
      res.set('Content-Disposition', `attachment; filename=${zipName}`);
      res.set('Content-Length', data.length.toString());
      res.end(data);
    } catch (err) {
      console.error("ZIP Generation error:", err);
      res.status(500).json({ error: "Failed to generate ZIP" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
