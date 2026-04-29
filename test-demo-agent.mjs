import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:5000/ws/agent');

ws.on('open', () => {
  console.log('Connected to WebSocket');
  
  // 注册为观测者
  ws.send(JSON.stringify({ type: 'observer:register', payload: {} }));
  
  // 模拟演示 Agent 注册
  setTimeout(() => {
    const agentId = 'demo_' + Date.now();
    ws.send(JSON.stringify({
      type: 'agent:register',
      payload: {
        agentId: agentId,
        username: 'TestBot',
        serverHost: 'localhost',
        serverPort: 25565
      }
    }));
    console.log('Sent agent:register for', agentId);
    
    // 发送初始状态
    setTimeout(() => {
      ws.send(JSON.stringify({
        type: 'agent:status:update',
        payload: {
          agentId: agentId,
          status: {
            position: { x: 100, y: 64, z: 200 },
            yaw: 45,
            pitch: 10,
            health: 20,
            maxHealth: 20,
            food: 20,
            maxFood: 20,
            gameMode: 'survival',
            isOnGround: true,
            isSprinting: false,
            isSneaking: false,
            isSleeping: false,
            isRiding: false
          }
        }
      }));
      console.log('Sent initial status');
      
      // 发送世界快照
      const blocks = [];
      for (let x = -5; x <= 5; x++) {
        for (let z = -5; z <= 5; z++) {
          blocks.push({ x: 100 + x, y: 63, z: 200 + z, type: 'grass_block' });
          if (Math.random() > 0.7) {
            blocks.push({ x: 100 + x, y: 64, z: 200 + z, type: 'air' });
          }
        }
      }
      
      ws.send(JSON.stringify({
        type: 'agent:world:snapshot',
        payload: {
          agentId: agentId,
          snapshot: {
            blocks: blocks,
            entities: [
              { id: 'pig_1', type: 'pig', position: { x: 103, y: 65, z: 202 } },
              { id: 'cow_1', type: 'cow', position: { x: 97, y: 65, z: 198 } }
            ]
          }
        }
      }));
      console.log('Sent world snapshot with', blocks.length, 'blocks');
      
      // 发送一些事件
      ws.send(JSON.stringify({
        type: 'agent:event',
        payload: {
          agentId: agentId,
          event: {
            type: 'move',
            message: '移动到 (100, 64, 200)',
            timestamp: Date.now()
          }
        }
      }));
      console.log('Sent event');
      
    }, 500);
  }, 200);
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  console.log('Received:', msg.type, msg.payload ? JSON.stringify(msg.payload).substring(0, 100) : '');
});

ws.on('close', () => {
  console.log('Disconnected');
});

setTimeout(() => {
  console.log('\nTest completed, closing...');
  ws.close();
  process.exit(0);
}, 3000);
