import WebSocket from 'ws';

const HOST = 'sn4p3txnjz.coze.site';
const WS_PATH = '/ws/agent';

console.log(`=== 正确流程测试 ===\n`);

const ws = new WebSocket(`wss://${HOST}${WS_PATH}`);
let registeredAgentId = null;

ws.on('open', () => {
  console.log(`✓ WebSocket 连接成功`);
  
  ws.send(JSON.stringify({
    type: 'agent:register',
    payload: { agentId: 'myagent_1', username: 'MyBot', serverHost: 'localhost', serverPort: 25565 }
  }));
  console.log(`→ 发送 agent:register`);
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  console.log(`← 收到: ${msg.type}`);
  
  if (msg.type === 'agent:register:ack') {
    registeredAgentId = msg.payload.agentId;
    console.log(`   Agent ID: ${registeredAgentId}`);
    
    // 使用正确的 agentId 发送状态
    setTimeout(() => {
      ws.send(JSON.stringify({
        type: 'agent:status:update',
        payload: {
          agentId: registeredAgentId,
          status: {
            position: { x: 100, y: 64, z: 200 },
            yaw: 45, pitch: 10,
            health: 20, maxHealth: 20,
            food: 20, maxFood: 20,
            gamemode: 'survival',
            isOnGround: true,
            inventory: [{ slot: 0, item: 'dirt', count: 64 }],
            equipment: {}
          }
        }
      }));
      console.log(`→ 发送 agent:status:update`);
    }, 100);
  }
  
  if (msg.type === 'status:update') {
    console.log('   ✓ 状态已更新并广播给观测者');
    
    // 发送事件
    setTimeout(() => {
      ws.send(JSON.stringify({
        type: 'agent:event',
        payload: {
          agentId: registeredAgentId,
          event: {
            type: 'chat',
            description: 'Hello World!'
          }
        }
      }));
      console.log(`→ 发送 agent:event`);
      
      setTimeout(() => {
        console.log('\n=== 测试成功! ===');
        ws.close();
        process.exit(0);
      }, 500);
    }, 100);
  }
});

ws.on('error', (err) => console.log('❌ 错误:', err.message));
ws.on('close', () => console.log('\n连接关闭'));

setTimeout(() => {
  console.log('\n超时');
  ws.close();
  process.exit(1);
}, 10000);
