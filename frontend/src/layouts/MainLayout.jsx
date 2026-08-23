import { Outlet } from 'react-router-dom';

function MainLayout() {
  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      {/* Header — will be built in later phases */}
      <header className="bg-dark-800/80 backdrop-blur-md border-b border-dark-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Task<span className="text-primary-400">Circle</span>
              </h1>
            </div>
            <nav className="flex items-center gap-4">
              <span className="text-sm text-dark-400">Phase 1 — Foundation</span>
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-dark-800/50 border-t border-dark-700 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-dark-500">
            TaskCircle &copy; {new Date().getFullYear()} — Built with React + Vite
          </p>
        </div>
      </footer>
    </div>
  );
}

export default MainLayout;
