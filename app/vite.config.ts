import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import ytSearch from 'yt-search'

const youtubeApiPlugin = () => ({
  name: 'youtube-api',
  configureServer(server: any) {
    server.middlewares.use('/api/yt-search', async (req: any, res: any) => {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const query = url.searchParams.get('q');
      if (!query) {
        res.statusCode = 400;
        return res.end('Query required');
      }
      try {
        const r = await ytSearch(query);
        const videos = r.videos.slice(0, 15).map((v: any) => ({
          videoId: v.videoId,
          title: v.title,
          thumbnail: v.thumbnail,
          author: v.author.name
        }));
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(videos));
      } catch (e) {
        res.statusCode = 500;
        res.end('Error searching YouTube');
      }
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    youtubeApiPlugin()
  ],
})
