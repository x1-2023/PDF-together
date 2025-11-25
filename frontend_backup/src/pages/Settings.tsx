import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface SettingsProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const Settings: React.FC<SettingsProps> = ({ isDarkMode, toggleDarkMode }) => {
  const navigate = useNavigate();
  const [fontSize, setFontSize] = useState(40);
  const [notifyJoin, setNotifyJoin] = useState(true);
  const [notifyAnnotation, setNotifyAnnotation] = useState(true);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4 font-display transition-colors duration-300">
      {/* Back Button (Absolute for simplicity in this layout) */}
      <button 
        onClick={() => navigate('/')} 
        className="absolute top-4 left-4 p-2 rounded-full bg-surface-light dark:bg-surface-dark shadow-md text-text-light dark:text-text-dark hover:scale-105 transition-transform"
      >
        <span className="material-symbols-outlined">arrow_back</span>
      </button>

      <div className="relative w-full max-w-md bg-surface-light dark:bg-surface-dark rounded-[2rem] shadow-float p-8 text-text-light dark:text-text-dark transition-colors duration-300">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        {/* Profile Section */}
        <section className="mb-8">
          <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Profile Settings</h2>
          <div className="flex items-center gap-6">
            <div className="relative flex-shrink-0 group cursor-pointer">
              <div className="w-20 h-20 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center overflow-hidden">
                 <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuD8joDFCOTF2JOPuLqO3XDRH_HTE6r6JsSVlDVrE035sI8CbHkQoy1AZIHxSafJRVdun1bXcfLaU7FSaX0Df38ovzV6v8K3EZygIfSabw7x5L7nehA1Wqm89lqNAGNfnZAFKgn66TpnCZBTPV_ORfB6TswYWyHyGqdcldmMYnUto29ruroJzNWbO15o0hicZgHNN5y_dmmoVmB6xfYMB4cayhzOeVTTd_IfOqdyKYUQnfoNpS42qYhU0dAJLCaeYDfbLkGyJ-dS2hI" alt="Profile" className="w-full h-full object-cover" />
              </div>
              <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-white dark:bg-surface-dark rounded-full flex items-center justify-center shadow-md border border-border-light dark:border-border-dark group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-lg text-text-muted">photo_camera</span>
              </button>
            </div>
            <div className="flex-grow">
              <label className="block text-sm font-medium text-text-muted mb-2" htmlFor="display-name">Display Name</label>
              <input 
                id="display-name" 
                type="text" 
                defaultValue="Alex" 
                className="w-full bg-transparent border border-border-light dark:border-border-dark rounded-xl py-2 px-3 focus:ring-2 focus:ring-primary focus:border-transparent text-text-light dark:text-text-dark outline-none transition-all"
              />
            </div>
          </div>
          <button className="text-sm text-text-muted hover:text-primary mt-2 ml-24 transition-colors">Change</button>
        </section>

        {/* Appearance Section */}
        <section className="mb-8">
          <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Appearance</h2>
          
          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-base font-medium">Night Study Mode</span>
              <span className="material-symbols-outlined text-lg text-text-muted">dark_mode</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={isDarkMode} onChange={toggleDarkMode} className="sr-only peer" />
              <div className="w-11 h-6 bg-border-light dark:bg-border-dark peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-text-muted after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Font Size Slider */}
          <div>
            <label className="block text-sm font-medium mb-3">Font Size</label>
            <div className="flex items-center gap-4">
              <span className="text-base font-medium text-text-muted">A</span>
              <div className="relative flex-grow flex items-center">
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={fontSize} 
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="range-slider w-full h-1 bg-border-light dark:bg-border-dark rounded-full appearance-none cursor-pointer"
                />
              </div>
              <span className="text-2xl font-bold text-text-light dark:text-text-dark">A⁺</span>
            </div>
          </div>
        </section>

        {/* Notifications Section */}
        <section className="mb-8">
          <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Notifications</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Classmate joined</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={notifyJoin} onChange={() => setNotifyJoin(!notifyJoin)} className="sr-only peer" />
                <div className="w-11 h-6 bg-border-light dark:bg-border-dark rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">New annotation</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={notifyAnnotation} onChange={() => setNotifyAnnotation(!notifyAnnotation)} className="sr-only peer" />
                <div className="w-11 h-6 bg-border-light dark:bg-border-dark rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
              </label>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section>
          <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">About</h2>
          <p className="text-sm text-text-muted">Version 1.2.4</p>
        </section>
      </div>
    </div>
  );
};

export default Settings;