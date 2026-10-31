import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { SimulatedBanner } from '../common/SimulatedBanner';
import { ToastContainer } from '../common/ToastContainer';

export function AppLayout({ currentTab, setCurrentTab, children }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F4FF] flex">
      {/* 220px Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-[220px] flex flex-col min-w-0 transition-all">
        {/* Top Simulated Banner */}
        <SimulatedBanner />

        {/* Universal Top Nav */}
        <TopNav
          currentTab={currentTab}
          onMenuClick={() => setIsMobileOpen(true)}
        />

        {/* Page Main Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 max-w-[1600px] w-full mx-auto">
          {children}
        </main>

        {/* Global Toasts */}
        <ToastContainer />
      </div>
    </div>
  );
}

