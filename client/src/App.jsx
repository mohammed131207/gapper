import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import { Spinner } from './components/ui.jsx';
import AppLayout from './components/AppLayout.jsx';
import Landing from './pages/Landing.jsx';
import Auth from './pages/Auth.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Roadmap from './pages/Roadmap.jsx';
import SkillDetail from './pages/SkillDetail.jsx';
import Progress from './pages/Progress.jsx';
import Library from './pages/Library.jsx';
import Resources from './pages/Resources.jsx';
import Settings from './pages/Settings.jsx';
import Journey from './pages/Journey.jsx';
import NotFound from './pages/NotFound.jsx';

function RequireUser({ children, allowNew = false }) {
  const { user } = useAuth();
  const location = useLocation();
  if (user === undefined) return <div className="splash"><Spinner /></div>;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  if (!user.onboarded && !allowNew) return <Navigate to="/onboarding" replace />;
  return children;
}

function GuestOnly({ children }) {
  const { user } = useAuth();
  if (user === undefined) return <div className="splash"><Spinner /></div>;
  if (user && !user.isGuest) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<GuestOnly><Auth mode="login" /></GuestOnly>} />
      <Route path="/signup" element={<GuestOnly><Auth mode="signup" /></GuestOnly>} />
      <Route path="/onboarding" element={<RequireUser allowNew><Onboarding /></RequireUser>} />
      <Route path="/journey" element={<Journey />} />
      <Route element={<RequireUser><AppLayout /></RequireUser>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/roadmap" element={<Roadmap />} />
        <Route path="/library" element={<Library />} />
        <Route path="/skills/:slug" element={<SkillDetail />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
