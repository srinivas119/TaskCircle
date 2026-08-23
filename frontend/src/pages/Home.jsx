import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function Home() {
  const { user } = useAuth();
  const [backendStatus, setBackendStatus] = useState('checking');
  const [backendData, setBackendData] = useState(null);
  const [dbStatus, setDbStatus] = useState('checking');
  const [dbData, setDbData] = useState(null);

  useEffect(() => {
    checkBackendHealth();
    checkDbHealth();
  }, []);

  const checkBackendHealth = async () => {
    try {
      const response = await api.get('/health');
      setBackendStatus('connected');
      setBackendData(response.data);
    } catch (error) {
      setBackendStatus('disconnected');
      setBackendData(null);
    }
  };

  const checkDbHealth = async () => {
    try {
      const response = await api.get('/health/db');
      setDbStatus(response.data.database === 'connected' ? 'connected' : 'disconnected');
      setDbData(response.data);
    } catch (error) {
      setDbStatus('disconnected');
      setDbData(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'disconnected': return 'bg-red-500';
      default: return 'bg-yellow-500 animate-pulse';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'disconnected': return 'Disconnected';
      default: return 'Checking...';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 rounded-full px-4 py-1.5 mb-6">
          <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-primary-400">Phase 2 — Authentication Active</span>
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-4">
          Task<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">Circle</span>
        </h1>
        <p className="text-xl text-white font-semibold mb-2">
          Welcome back, {user?.name || 'User'}!
        </p>
        <p className="text-lg text-dark-400 max-w-2xl mx-auto">
          Collaborative task management for teams. Share tasks, track progress, and stay organized — together.
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* Backend Status */}
        <div className="card group hover:border-dark-600 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-dark-100">Backend API</h3>
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(backendStatus)}`}></div>
              <span className="text-sm text-dark-400">{getStatusText(backendStatus)}</span>
            </div>
          </div>
          {backendData && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-dark-400">Status</span>
                <span className="text-green-400 font-medium">{backendData.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Environment</span>
                <span className="text-dark-200">{backendData.environment}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Timestamp</span>
                <span className="text-dark-200">{new Date(backendData.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          )}
          {backendStatus === 'disconnected' && (
            <p className="text-sm text-dark-500 mt-2">Start the backend with: <code className="bg-dark-700 px-2 py-0.5 rounded text-primary-400">npm run dev</code></p>
          )}
        </div>

        {/* Database Status */}
        <div className="card group hover:border-dark-600 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-dark-100">Database</h3>
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(dbStatus)}`}></div>
              <span className="text-sm text-dark-400">{getStatusText(dbStatus)}</span>
            </div>
          </div>
          {dbData && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-dark-400">Database</span>
                <span className={`font-medium ${dbData.database === 'connected' ? 'text-green-400' : 'text-red-400'}`}>{dbData.database}</span>
              </div>
              {dbData.error && (
                <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-xs text-red-400">{dbData.error}</p>
                </div>
              )}
            </div>
          )}
          {dbStatus === 'disconnected' && !dbData && (
            <p className="text-sm text-dark-500 mt-2">Configure <code className="bg-dark-700 px-2 py-0.5 rounded text-primary-400">DATABASE_URL</code> in backend/.env</p>
          )}
        </div>
      </div>

      {/* Tech Stack */}
      <div className="card">
        <h3 className="text-lg font-semibold text-dark-100 mb-4">Tech Stack</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { name: 'React', desc: 'Frontend' },
            { name: 'Vite', desc: 'Build Tool' },
            { name: 'Tailwind', desc: 'Styling' },
            { name: 'Express', desc: 'Backend' },
            { name: 'Prisma', desc: 'ORM' },
            { name: 'PostgreSQL', desc: 'Database' },
            { name: 'Socket.IO', desc: 'Realtime' },
            { name: 'Vercel', desc: 'Deployment' },
          ].map((tech) => (
            <div
              key={tech.name}
              className="bg-dark-700/50 border border-dark-600/50 rounded-lg p-3 text-center hover:border-primary-500/30 transition-colors duration-200"
            >
              <p className="font-medium text-dark-100 text-sm">{tech.name}</p>
              <p className="text-xs text-dark-500 mt-0.5">{tech.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Refresh Button */}
      <div className="text-center mt-8">
        <button
          onClick={() => {
            setBackendStatus('checking');
            setDbStatus('checking');
            checkBackendHealth();
            checkDbHealth();
          }}
          className="btn-primary inline-flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Status
        </button>
      </div>
    </div>
  );
}

export default Home;
