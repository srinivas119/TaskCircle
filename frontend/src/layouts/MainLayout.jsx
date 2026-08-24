import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function MainLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }

    return location.pathname.startsWith(path);
  };

  const navItems = [
    {
      name: 'Home',
      path: '/',
      icon: '🏠',
    },
    {
      name: 'Groups',
      path: '/groups',
      icon: '👥',
    },
    {
      name: 'My Tasks',
      path: '/my-tasks',
      icon: '📋',
    },
    {
      name: 'Notifications',
      path: '/notifications',
      icon: '🔔',
    },
  ];

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">

      {/* ================= NAVBAR ================= */}
      <header className="sticky top-0 z-50 bg-dark-800/90 backdrop-blur-xl border-b border-dark-700">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="h-16 flex items-center justify-between">

            {/* ================= LOGO ================= */}
            <Link
              to="/"
              className="flex items-center gap-3 shrink-0"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                <span className="text-white font-bold text-lg">
                  T
                </span>
              </div>

              <h1 className="text-xl font-bold text-white tracking-tight">
                Task
                <span className="text-primary-400">
                  Circle
                </span>
              </h1>
            </Link>

            {/* ================= DESKTOP NAV ================= */}
            {user && (
              <nav className="hidden md:flex items-center gap-1 ml-8">

                {navItems.map((item) => {
                  const active = isActive(item.path);

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        active
                          ? 'bg-primary-500/15 text-primary-400'
                          : 'text-dark-300 hover:text-white hover:bg-dark-700'
                      }`}
                    >
                      <span className="text-base">
                        {item.icon}
                      </span>

                      <span>
                        {item.name}
                      </span>
                    </Link>
                  );
                })}

              </nav>
            )}

            {/* ================= RIGHT SIDE ================= */}
            <div className="flex items-center gap-3 ml-auto">

              {user ? (
                <>

                  {/* Profile */}
                  <Link
                    to="/profile"
                    className={`flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg transition-colors ${
                      isActive('/profile')
                        ? 'bg-primary-500/15'
                        : 'hover:bg-dark-700'
                    }`}
                  >

                    {user.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt={user.name || 'User'}
                        className="w-8 h-8 rounded-full border-2 border-primary-500 object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-sm font-bold text-white">
                        {user.name
                          ? user.name[0].toUpperCase()
                          : 'U'}
                      </div>
                    )}

                    <span className="hidden lg:block text-sm font-medium text-dark-200">
                      {user.name || 'Profile'}
                    </span>

                  </Link>

                  {/* Logout */}
                  <button
                    onClick={logout}
                    className="hidden sm:block text-xs font-semibold text-red-400 hover:text-red-300 transition-colors bg-red-500/10 border border-red-500/20 hover:bg-red-500/15 px-3 py-2 rounded-lg"
                  >
                    Logout
                  </button>

                </>
              ) : (
                <Link
                  to="/login"
                  className="text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 px-4 py-2 rounded-lg transition-colors shadow-lg shadow-primary-500/15"
                >
                  Sign In
                </Link>
              )}

            </div>

          </div>

          {/* ================= MOBILE NAV ================= */}
          {user && (
            <nav className="md:hidden flex items-center gap-1 overflow-x-auto pb-3 scrollbar-hide">

              {navItems.map((item) => {
                const active = isActive(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      active
                        ? 'bg-primary-500/15 text-primary-400'
                        : 'text-dark-300 hover:text-white hover:bg-dark-700'
                    }`}
                  >
                    <span>
                      {item.icon}
                    </span>

                    <span>
                      {item.name}
                    </span>
                  </Link>
                );
              })}

              <button
                onClick={logout}
                className="sm:hidden flex items-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-lg text-xs font-medium text-red-400 bg-red-500/10"
              >
                🚪 Logout
              </button>

            </nav>
          )}

        </div>
      </header>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="bg-dark-800/50 border-t border-dark-700 py-6 mt-auto">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">

            <p className="text-sm text-dark-500">
              TaskCircle © {new Date().getFullYear()}
            </p>

            <p className="text-xs text-dark-600">
              Collaborative Task Management
            </p>

          </div>

        </div>

      </footer>

    </div>
  );
}

export default MainLayout;