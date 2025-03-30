const { spawn } = require('child_process');
const os = require('os');

// 检测操作系统
const isWindows = os.platform() === 'win32';

// 启动命令
const npmCmd = isWindows ? 'npm.cmd' : 'npm';
const nodeCmd = isWindows ? 'node.exe' : 'node';

// 启动前端
const frontendProcess = spawn(npmCmd, ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

// 启动模拟服务器
const mockServerProcess = spawn(nodeCmd, ['mock-server.js'], {
  stdio: 'inherit',
  shell: true
});

// 处理进程退出
function cleanup() {
  console.log('正在关闭所有进程...');
  
  if (frontendProcess && !frontendProcess.killed) {
    frontendProcess.kill();
  }
  
  if (mockServerProcess && !mockServerProcess.killed) {
    mockServerProcess.kill();
  }
  
  process.exit(0);
}

// 监听退出信号
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

// 输出启动信息
console.log('\n=================================');
console.log('开发环境已启动:');
console.log('- 前端: http://localhost:3000');
console.log('- 模拟服务器: http://localhost:3005');
console.log('按Ctrl+C退出');
console.log('=================================\n'); 