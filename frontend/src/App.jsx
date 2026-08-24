import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';

import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import GroupDetails from './pages/GroupDetails';
import Groups from './pages/group';
import MyTasks from './pages/MyTasks';
import Notifications from './pages/Notifications';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route element={<ProtectedRoute />}>

            <Route path="/" element={<MainLayout />}>

              <Route index element={<Home />} />

              <Route path="groups" element={<Groups />} />

              <Route
                path="groups/:groupId"
                element={<GroupDetails />}
              />

              <Route
                path="groups/:groupId/tasks"
                element={<MyTasks />}
              />

              <Route
                path="my-tasks"
                element={<MyTasks />}
              />

              <Route
                path="notifications"
                element={<Notifications />}
              />

              <Route
                path="profile"
                element={<Profile />}
              />

            </Route>

          </Route>

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;