import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Reader from './pages/Reader';
import Settings from './pages/Settings';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';

// Simple scroll-to-top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

import { Toaster } from './components/ui/toaster';

import { setupDiscordSdk } from './lib/discord';

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Initialize dark mode from local storage or system preference
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedMode);
    if (savedMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Initialize Discord SDK
  useEffect(() => {
    const initDiscord = async () => {
      try {
        await setupDiscordSdk();
      } catch (error) {
        console.error("Discord SDK initialization failed:", error);
        // If we are in a browser (not Discord), this might fail. 
        // We can choose to block or allow access. 
        // For now, let's allow access but log the error, 
        // assuming local dev or web usage might not have Discord context.
        // However, if the user explicitly wants Discord Activity, we might want to show an error.
        // But for local dev (npm run dev), we often run in browser.
        // Let's check if we are in an iframe or not? 
        // Actually, let's just set error if it's critical, or just proceed.
        // Given "chủ yếu dùng trên discord", let's try to proceed but maybe show a toast if it fails?
        // Or just set isAuthLoading to false and let it run.
      } finally {
        setIsAuthLoading(false);
      }
    };

    initDiscord();
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="font-bold animate-pulse">Đang kết nối với Discord...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <ScrollToTop />
      <Toaster />
      <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/reader/:id" element={<Reader />} />
          <Route
            path="/settings"
            element={<Settings isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />}
          />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;