import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import SdgReference from './pages/SdgReference';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ProtectedRoute from './auth/ProtectedRoute';

function AppLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 md:p-10 max-w-7xl">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/:id" element={<EventDetail />} />
                <Route path="/sdg" element={<SdgReference />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
