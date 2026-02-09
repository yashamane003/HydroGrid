
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminUserDetail from './pages/AdminUserDetail';
import AddDevice from './pages/AddDevice';
import ProvisionDevice from './pages/ProvisionDevice';
import Analytics from './pages/Analytics';
import Plants from './pages/Plants';
import SidebarLayout from './components/SidebarLayout';
import { ProvisionProvider } from './context/ProvisionContext';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Protected Routes (Sidebar Layout) */}
        <Route element={
            <ProvisionProvider>
                <SidebarLayout />
            </ProvisionProvider>
        }>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users/:id" element={<AdminUserDetail />} />
            <Route path="/add-device" element={<AddDevice />} />
            <Route path="/provision-device" element={<ProvisionDevice />} />
            <Route path="/plants" element={<Plants />} />
            <Route path="/analytics/:id" element={<Analytics />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

