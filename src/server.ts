import { createServer } from 'http';
import { parse as parseUrl } from 'url';
import next from 'next';
import { WebSocketServer } from 'ws';
import type { IncomingMessage } from 'http';
import type { Duplex } from 'stream';

import { setupAgentHandler } from './ws-handlers/agent';
import { agentStateManager } from './ws-handlers/agent-state';
import { getVisionUrl } from './storage/vision-storage';

const dev = process.env.COZE_PROJECT_ENV !== 'PROD';
const hostname = process.env.HOSTNAME || 'localhost';
const PORT = parseInt(process.env.DEPLOY_RUN_PORT || '5000', 10);

// Create Next.js app
const app = next({ dev, hostname, port: PORT });
const handle = app.getRequestHandler();

// WebSocket 服务器映射
const wssMap = new Map<string, WebSocketServer>();

function registerWsEndpoint(path: string): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });
  wssMap.set(path, wss);
  return wss;
}

function handleUpgrade(req: IncomingMessage, socket: Duplex, head: Buffer) {
  const { pathname } = new URL(req.url!, `http://${req.headers.host}`);
  const wss = wssMap.get(pathname);
  if (wss) {
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
  } else if (!dev) {
    // 生产环境销毁未注册的 upgrade 请求
    socket.destroy();
  }
}

// 注册 WebSocket 端点
const agentWss = registerWsEndpoint('/ws/agent');
setupAgentHandler(agentWss);

app.prepare().then(async () => {
  // 从数据库加载在线 Agent
  try {
    await agentStateManager.loadFromDb();
    console.log('> 已从数据库加载 Agent 状态');
  } catch (error) {
    console.error('> 从数据库加载 Agent 状态失败:', error);
  }

  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parseUrl(req.url!, true);
      
      // Vision proxy: 动态生成签名 URL 并重定向
      if (parsedUrl.pathname === '/api/vision-proxy') {
        const key = parsedUrl.query.key as string;
        if (!key) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Missing key parameter' }));
          return;
        }
        try {
          const signedUrl = await getVisionUrl(key);
          res.writeHead(302, { Location: signedUrl });
          res.end();
        } catch (err) {
          console.error('Vision proxy error:', err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Failed to generate signed URL' }));
        }
        return;
      }
      
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  server.once('error', (err) => {
    console.error(err);
    process.exit(1);
  });

  server.on('upgrade', handleUpgrade);

  server.listen(PORT, () => {
    console.log(
      `> Server listening at http://${hostname}:${PORT} as ${
        dev ? 'development' : process.env.COZE_PROJECT_ENV
      }`,
    );
    console.log('> WebSocket endpoints:');
    wssMap.forEach((_, path) => {
      console.log(`  - ws://${hostname}:${PORT}${path}`);
    });
  });
});
