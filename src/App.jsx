import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import React, { useState, useEffect } from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import Dashboard from '@/pages/Dashboard';
import PersonDetail from '@/pages/PersonDetail';
import PeopleList from '@/pages/PeopleList';
import ActivityPage from '@/pages/ActivityPage';
import SettingsPage from '@/pages/SettingsPage';
import LoginForm from '@/components/auth/LoginForm';
import SignupForm from '@/components/auth/SignupForm';
import { initUsers, getSession, logoutUser } from '@/lib/auth';

// Init default users on first load
initUsers();

function AppContent() {
  const [session, setSession] = useState(() => getSession());
  const [authView, setAuthView] = useState('login'); // 'login' | 'signup'

  const handleLogin = (user) => {
    setSession({ username: user.username });
  };

  const handleLogout = () => {
    logoutUser();
    setSession(null);
    setAuthView('login');
  };

  if (!session) {
    return authView === 'login'
      ? <LoginForm onLogin={handleLogin} onGoSignup={() => setAuthView('signup')} />
      : <SignupForm onGoLogin={() => setAuthView('login')} />;
  }

  return (
    <Routes>
      <Route element={<MobileLayout session={session} onLogout={handleLogout} />}>
        <Route path="/" element={<Dashboard session={session} />} />
        <Route path="/people" element={<PeopleList />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/settings" element={<SettingsPage session={session} onLogout={handleLogout} />} />
        <Route path="/person/:id" element={<PersonDetail session={session} />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <AppContent />
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;