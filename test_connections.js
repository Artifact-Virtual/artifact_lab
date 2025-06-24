const http = require('http');

console.log('Testing service connections from Node.js...\n');

// Test ADE service
console.log('Testing ADE service (IPv4)...');
const adeReq = http.get({
  hostname: '127.0.0.1',
  port: 9000,
  path: '/status',
  family: 4
}, (res) => {
  console.log('✅ ADE service responded with status:', res.statusCode);
  
  // Test Ollama service
  console.log('\nTesting Ollama service (IPv4)...');
  const ollamaReq = http.get({
    hostname: '127.0.0.1',
    port: 11500,
    path: '/api/version',
    family: 4
  }, (res) => {
    console.log('✅ Ollama service responded with status:', res.statusCode);
    process.exit(0);
  });
  
  ollamaReq.on('error', (error) => {
    console.log('❌ Ollama service error:', error.message);
    process.exit(1);
  });
  
  ollamaReq.setTimeout(5000, () => {
    console.log('❌ Ollama service timeout');
    process.exit(1);
  });
});

adeReq.on('error', (error) => {
  console.log('❌ ADE service error:', error.message);
  process.exit(1);
});

adeReq.setTimeout(5000, () => {
  console.log('❌ ADE service timeout');
  process.exit(1);
});
