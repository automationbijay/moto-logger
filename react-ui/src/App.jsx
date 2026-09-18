import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { VehicleProvider } from './contexts/VehicleContext.jsx'
import { ProtectedRoute } from './components/ProtectedRoute.jsx'
import { Layout } from './components/Layout.jsx'

// Pages
import Dashboard from './pages/Dashboard.jsx'
import Logs from './pages/Logs.jsx'
import Profile from './pages/Profile.jsx'
import AddLog from './pages/AddLog.jsx'
import AddNote from './pages/AddNote.jsx'
import EditProfile from './pages/EditProfile.jsx'
import CurrencySettings from './pages/CurrencySettings.jsx'
import LogDetails from './pages/LogDetails.jsx'
import Login from './pages/auth/Login.jsx'
import Signup from './pages/auth/Signup.jsx'

import NotesReminders from './pages/NotesReminders.jsx'
import VehicleForm from './pages/VehicleForm.jsx'
import Reminders from './pages/Reminders.jsx'

function App() {
  return (
    <AuthProvider>
      <VehicleProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            <Route element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route path="/" element={<Dashboard />} />
              <Route path="/logs" element={<Logs />} />
              <Route path="/notes" element={<NotesReminders />} />
              <Route path="/add-log" element={<AddLog />} />
              <Route path="/add-note" element={<AddNote />} />
              <Route path="/vehicle" element={<VehicleForm />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/edit-profile" element={<EditProfile />} />
              <Route path="/reminders" element={<Reminders />} />
              <Route path="/currency" element={<CurrencySettings />} />
              <Route path="/log-details" element={<LogDetails />} />
            </Route>
            
            {/* Catch-all route to redirect 404s to home page */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </VehicleProvider>
    </AuthProvider>
  )
}

export default App
