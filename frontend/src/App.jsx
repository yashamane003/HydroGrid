
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminUserDetail from './pages/AdminUserDetail';
import AddDevice from './pages/AddDevice';
import Analytics from './pages/Analytics';
import SidebarLayout from './components/SidebarLayout';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Protected Routes (Sidebar Layout) */}
        <Route element={<SidebarLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users/:id" element={<AdminUserDetail />} />
            <Route path="/add-device" element={<AddDevice />} />
            <Route path="/analytics/:id" element={<Analytics />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

