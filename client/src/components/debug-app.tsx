import React from 'react';

export function DebugApp() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#333' }}>MeshBook Debug View</h1>
      <p>React app is loading successfully!</p>
      <div style={{ 
        background: '#f0f8ff', 
        padding: '10px', 
        borderRadius: '5px',
        marginTop: '20px'
      }}>
        <h3>System Check:</h3>
        <ul>
          <li>✅ React rendering works</li>
          <li>✅ CSS styles loading</li>
          <li>✅ TypeScript compilation successful</li>
          <li>🔄 Testing API connectivity...</li>
        </ul>
        
        <button 
          onClick={() => {
            fetch('/api/users')
              .then(res => res.json())
              .then(data => {
                console.log('API Response:', data);
                alert('API working! Check console for details.');
              })
              .catch(err => {
                console.error('API Error:', err);
                alert('API Error: ' + err.message);
              });
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Test API Connection
        </button>
      </div>
    </div>
  );
}