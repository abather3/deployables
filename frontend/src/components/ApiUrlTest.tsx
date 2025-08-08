import React from 'react';

const ApiUrlTest: React.FC = () => {
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  
  React.useEffect(() => {
    console.log('🔍 API URL TEST COMPONENT:');
    console.log('  REACT_APP_API_URL =', process.env.REACT_APP_API_URL);
    console.log('  Computed apiUrl =', apiUrl);
    console.log('  All process.env =', process.env);
  }, [apiUrl]);

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      <div><strong>API URL Debug:</strong></div>
      <div>Env: {process.env.REACT_APP_API_URL || 'undefined'}</div>
      <div>Computed: {apiUrl}</div>
      <div>Build: {process.env.REACT_APP_BUILD_TIME || 'unknown'}</div>
    </div>
  );
};

export default ApiUrlTest;
