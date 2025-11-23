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

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize dark mode from local storage or system preference
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedMode);
    if (savedMode) {
      document.documentElement.classList.add('dark');
    }
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