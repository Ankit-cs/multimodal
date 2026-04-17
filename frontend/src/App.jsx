import React from 'react'
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast"

import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Sessions from './pages/Sessions';
import Logs from './pages/Logs';
import Profile from './pages/Profile';
import MainLayout from './components/MainLayout';
import Team from './pages/Team';
import Integrations from './pages/Integrations';
import Calendar from './pages/Calendar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import LandingPage from './pages/LandingPage';
import ProtectedRoute from './components/ProtectedRoute';
import { ChatProvider } from './context/ChatContext';

const App = () => {
  return (
    <div>
      <Toaster />
      <Routes>
        {/* ── Public routes (no login required) ── */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* ── Private routes — ChatProvider wraps everything so chat state survives navigation ── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<ChatProvider><MainLayout /></ChatProvider>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/history" element={<History />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/team" element={<Team />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/calendar" element={<Calendar />} />
          </Route>
        </Route>
      </Routes>
    </div>
  )
}

export default App
