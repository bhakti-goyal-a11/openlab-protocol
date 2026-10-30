import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ResourceRadar from './pages/ResourceRadar';
import TrustPass from './pages/TrustPass';
import BookingManager from './pages/BookingManager';
import ProofHandover from './pages/ProofHandover';
import TrustLedger from './pages/TrustLedger';
import SmartAnalytics from './pages/SmartAnalytics';
import CustodianHub from './pages/CustodianHub';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('radar');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center animate-spin">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div>
          </div>
          <p className="text-slate-400 font-mono text-xs tracking-wider animate-pulse">
            INITIALIZING OPENLAB TRUSTX PROTOCOL...
          </p>
        </div>
      </div>
    );
  }

  const renderActiveModule = () => {
    switch (currentTab) {
      case 'radar':
        return <ResourceRadar onNavigateToBooking={() => setCurrentTab('bookings')} />;
      case 'trustpass':
        return <TrustPass />;
      case 'bookings':
        return <BookingManager onNavigateToHandover={() => setCurrentTab('handover')} />;
      case 'handover':
        return <ProofHandover />;
      case 'ledger':
        return <TrustLedger />;
      case 'analytics':
        return <SmartAnalytics />;
      case 'custodian':
        return <CustodianHub />;
      default:
        return <ResourceRadar onNavigateToBooking={() => setCurrentTab('bookings')} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Universal Navbar with Demo Role Switcher */}
      <Navbar />

      {/* Main Container: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Module Sidebar */}
        <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

        {/* Dynamic Center Work Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
          <div className="max-w-7xl mx-auto space-y-6">
            {renderActiveModule()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
