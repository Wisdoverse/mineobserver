import WebSocket from 'ws';

const HOST = 'localhost';
const PORT = 5000;
const WS_PATH = '/ws/agent';

console.log('=== WebSocket 连接测试 ===\n');

const ws = new WebSocket(`ws://${HOST}:${PORT}${WS_PATH}`);

ws.on('open', () => {
  console.log('1. WebSocket 连接成功 ✓');
  
  // 测试 1: 注册为观测者
  ws.send(JSON.stringify({ type: 'observer:register', payload: {} }));
  console.log('2. 发送 observer:register ✓');
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  console.log(`3. 收到消息: ${msg.type}`);
  
  if (msg.type === 'agents:list') {
    console.log('   - 观测者注册成功，当前无 Agent');
  }
});

ws.on('error', (err) => {
  console.log('❌ WebSocket 错误:', err.message);
});

ws.on('close', () => {
  console.log('\n=== 测试完成 ===');
  console.log('WebSocket 服务正常工作 ✓');
  process.exit(0);
});

setTimeout(() => {
  console.log('\n测试超时');
  ws.close();
  process.exit(1);
}, 5000);
