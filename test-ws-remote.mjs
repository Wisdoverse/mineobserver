import WebSocket from 'ws';

const HOST = 'sn4p3txnjz.coze.site';
const WS_PATH = '/ws/agent';

console.log(`=== 测试 WebSocket: wss://${HOST}${WS_PATH} ===\n`);

const ws = new WebSocket(`wss://${HOST}${WS_PATH}`);

ws.on('open', () => {
  console.log('1. WebSocket 连接成功 ✓');
  
  // 注册 Agent
  ws.send(JSON.stringify({
    type: 'agent:register',
    payload: {
      agentId: 'test_agent_1',
      username: 'TestBot',
      serverHost: 'localhost',
      serverPort: 25565
    }
  }));
  console.log('2. 发送 agent:register ✓');
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  console.log(`3. 收到消息: ${msg.type}`);
  
  if (msg.type === 'agent:registered') {
    console.log('   - Agent 注册成功!');
    
    // 发送状态更新
    ws.send(JSON.stringify({
      type: 'agent:status:update',
      payload: {
        agentId: 'test_agent_1',
        status: {
          position: { x: 100, y: 64, z: 200 },
          yaw: 45, pitch: 10,
          health: 20, maxHealth: 20,
          food: 20, maxFood: 20,
          gamemode: 'survival',
          isOnGround: true,
          inventory: [
            { slot: 0, item: 'dirt', count: 64 },
            { slot: 1, item: 'diamond_sword', count: 1 }
          ],
          equipment: {
            mainhand: { slot: 0, item: 'diamond_sword', count: 1 }
          }
        }
      }
    }));
    console.log('4. 发送 agent:status:update ✓');
  }
});

ws.on('error', (err) => {
  console.log('❌ WebSocket 错误:', err.message);
});

ws.on('close', () => {
  console.log('\n连接关闭');
  process.exit(0);
});

setTimeout(() => {
  console.log('\n测试超时');
  ws.close();
  process.exit(1);
}, 8000);
