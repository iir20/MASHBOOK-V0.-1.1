import React from 'react';

export function DebugTest() {
  console.log('DebugTest: Component rendered successfully');
  
  return (
    <div style={{ 
      padding: '20px', 
      background: '#f0f0f0', 
      minHeight: '100vh',
      color: '#333'
    }}>
      <h1 style={{ color: '#0066cc' }}>Meshbook Debug Test</h1>
      <p>If you can see this, React is working properly.</p>
      <div style={{ marginTop: '20px' }}>
        <h2>System Status:</h2>
        <ul>
          <li>React: ✅ Working</li>
          <li>Component Rendering: ✅ Working</li>
          <li>Server Connection: Testing...</li>
        </ul>
      </div>
    </div>
  );
}