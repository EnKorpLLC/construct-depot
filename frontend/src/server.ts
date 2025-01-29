import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initializeMetricsSocket } from './app/api/admin/system/metrics/socket';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

export async function startServer() {
  try {
    await app.prepare();

    const server = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url!, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error handling request:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });

    // Initialize WebSocket server for system metrics
    initializeMetricsSocket(server);

    const port = parseInt(process.env.PORT || '3000', 10);
    server.listen(port, () => {
      console.log(`> Server listening at http://localhost:${port}`);
    });

    return server;
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
} 