import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import AdminSetup from './pages/AdminSetup';
import Members from './pages/Members';
import Tasks from './pages/Tasks';
import Team from './pages/Team';
import Upload from './pages/Upload';
import EditPage from './pages/EditPage'; 
import './styles/index.css';

export default function App() {
  return (

    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin-setup" element={<AdminSetup />} />
        <Route path="/members" element={<Members />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/team" element={<Team />} />
        <Route path="/upload" element={<Upload />} />
        
        <Route path="/edit/:fileId" element={<EditPage />} />
        
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}