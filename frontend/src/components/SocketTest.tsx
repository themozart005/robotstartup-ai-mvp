// frontend/src/components/SocketTest.tsx
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export function SocketTest() {
  const [status, setStatus] = useState('Testing...');
  const [socketId, setSocketId] = useState('');

  useEffect(() => {
    console.log('🧪 Starting direct socket test...');
    
    const socket = io('http://localhost:5000', {
      transports: ['polling'],
      forceNew: true,
      timeout: 5000
    });

    socket.on('connect', () => {
      console.log('🎉 DIRECT TEST SUCCESS! Socket ID:', socket.id);
      setStatus('✅ Connected!');
      setSocketId(socket.id || '');
    });

    socket.on('connect_error', (error) => {
      console.error('❌ DIRECT TEST FAILED:', error);
      setStatus('❌ Connection failed: ' + error.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 DIRECT TEST DISCONNECTED:', reason);
      setStatus('🔌 Disconnected: ' + reason);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      margin: '20px', 
      border: '2px solid #ccc', 
      borderRadius: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <h2>Direct Socket.IO Test</h2>
      <p><strong>Status:</strong> {status}</p>
      {socketId && <p><strong>Socket ID:</strong> {socketId}</p>}
    </div>
  );
}