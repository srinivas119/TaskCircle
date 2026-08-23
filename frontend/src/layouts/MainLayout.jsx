import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function MainLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      {/* Header */}
      <header className="bg-dark-800/80 backdrop-blur-md border-b border-dark-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Task<span className="text-primary-400">Circle</span>
              </h1>
            </Link>

            <nav className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <Link
                    to="/profile"
                    className="text-sm font-medium text-dark-300 hover:text-white flex items-center gap-2 transition-colors"
                  >
                    {user.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt={user.name || 'User'}
                        className="w-6 h-6 rounded-full border border-primary-500 object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-xs font-bold text-white">
                        {user.name ? user.name[0].toUpperCase() : 'U'}
                      </div>
                    )}
                    <span className="hidden sm:inline">{user.name || 'Profile'}</span>
                  </Link>
                  <button
                    onClick={logout}
                    className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors bg-red-500/10 border border-red-500/20 px-2.5 py-1.5 rounded-lg"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 px-4 py-2 rounded-lg transition-colors shadow-lg shadow-primary-500/15"
                >
                  Sign In
                </Link>
              )}
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
            TaskCircle &copy; {new Date().getFullYear()} — Collaborative Task Management
          </p>
        </div>
      </footer>
    </div>
  );
}

export default MainLayout;
