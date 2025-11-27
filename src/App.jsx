import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import TheLoop from './pages/TheLoop';
import Events from './pages/Events';
import Hubs from './pages/Hubs';
import HubDetail from './pages/HubDetail';
import Marketplace from './pages/Marketplace';
import Profile from './pages/Profile';

function App() {
  const { user } = useAuthStore();

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="register" element={user ? <Navigate to="/" /> : <Register />} />
        <Route path="loop" element={<TheLoop />} />
        <Route path="events" element={<Events />} />
        <Route path="hubs" element={<Hubs />} />
        <Route path="hubs/:hubId" element={<HubDetail />} />
        <Route path="marketplace" element={<Marketplace />} />
        <Route path="profile/:userId" element={<Profile />} />
      </Route>
    </Routes>
  );
}

export default App;
