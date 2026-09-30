import React, { useState, useEffect } from 'react';
import { SpringEntity, UserProfile, UserRole, InterventionRecommendation } from './types';
import { api } from './services/api';
import { Header } from './components/Header';
import { GisMap } from './components/GisMap';
import { SpringsList } from './components/SpringsList';
import { SpringInspector } from './components/SpringInspector';
import { DelineationPanel } from './components/DelineationPanel';
import { ShapExplainability } from './components/ShapExplainability';
import { InterventionsSimulator } from './components/InterventionsSimulator';
import { FieldValidationModule } from './components/FieldValidationModule';
import { ModelRegistry } from './components/ModelRegistry';
import { DatasetManager } from './components/DatasetManager';
import { TerrainProcessor } from './components/TerrainProcessor';
import { ReportGenerator } from './components/ReportGenerator';
import { SpringRegistrationModal } from './components/SpringRegistrationModal';
import { AuditLogModal } from './components/AuditLogModal';
import { Map, ListFilter, Cpu, Wrench, Camera, Sparkles, AlertCircle } from 'lucide-react';

export function App() {
  const [user, setUser] = useState<UserProfile>({
    id: 'USR-01',
    name: 'Praban Ch.',
    email: 'prabanchbscct@gmail.com',
    role: 'Administrator',
    department: 'State Groundwater Mission'
  });

  const [springs, setSprings] = useState<SpringEntity[]>([]);
  const [selectedSpring, setSelectedSpring] = useState<SpringEntity | null>(null);
  const [interventions, setInterventions] = useState<InterventionRecommendation[]>([]);
  const [currentTab, setCurrentTab] = useState<string>('map');
  const [loading, setLoading] = useState<boolean>(true);

  // Modal states
  const [reportSpringId, setReportSpringId] = useState<string | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);

  // Fetch initial data
  const loadSprings = async () => {
    try {
      const res = await api.getSprings();
      if (res.success && res.data.length > 0) {
        setSprings(res.data);
        if (!selectedSpring) {
          setSelectedSpring(res.data[0]);
        } else {
          const updated = res.data.find(s => s.id === selectedSpring.id);
          if (updated) setSelectedSpring(updated);
        }
      }
    } catch (err) {
      console.error('Failed to load springs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSprings();
    api.getMe().then(res => {
      if (res.success && res.user) setUser(res.user);
    }).catch(err => console.error('Failed to load user:', err));
  }, []);

  // Fetch interventions for selected spring to render on map
  useEffect(() => {
    if (selectedSpring) {
      api.getInterventions(selectedSpring.id).then(res => {
        if (res.success) setInterventions(res.data);
      }).catch(err => console.error('Failed to fetch interventions:', err));
    }
  }, [selectedSpring?.id]);

  const handleSwitchRole = async (newRole: UserRole) => {
    try {
      const res = await api.switchRole(newRole);
      if (res.success && res.user) {
        setUser(res.user);
      }
    } catch (err) {
      console.error('Failed to switch role:', err);
    }
  };

  const handleUpdateSelectedSpring = (updated: SpringEntity) => {
    setSelectedSpring(updated);
    setSprings(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  const handleSpringCreated = (newSpring: SpringEntity) => {
    setSprings(prev => [newSpring, ...prev]);
    setSelectedSpring(newSpring);
    setCurrentTab('map');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-100 font-mono text-xs">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
          <span>Initializing SpringAI-GIS Decision Support Platform...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Bar Contract (3 zones) */}
      <Header
        user={user}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onSwitchRole={handleSwitchRole}
        onOpenRegister={() => setShowRegisterModal(true)}
        onOpenAudit={() => setShowAuditModal(true)}
      />

      {/* Main Viewport Workspace */}
      <main className="flex-1 relative overflow-hidden flex">
        {currentTab === 'map' && (
          <div className="w-full h-full flex">
            {/* Left Drawer: Springs Inventory */}
            <div className="w-80 h-full shrink-0 z-10 hidden md:block">
              <SpringsList
                springs={springs}
                selectedSpring={selectedSpring}
                onSelectSpring={setSelectedSpring}
                onSelectTab={setCurrentTab}
              />
            </div>

            {/* Center: Full GIS Interactive Map Canvas */}
            <div className="flex-1 h-full relative">
              <GisMap
                springs={springs}
                selectedSpring={selectedSpring}
                onSelectSpring={setSelectedSpring}
                interventions={interventions}
              />
            </div>

            {/* Right Drawer: Spring Inspector & Discharge Chart */}
            {selectedSpring && (
              <div className="w-88 h-full shrink-0 z-10 hidden xl:block shadow-2xl">
                <SpringInspector
                  spring={selectedSpring}
                  onRefreshSpring={handleUpdateSelectedSpring}
                  onOpenReport={(id) => setReportSpringId(id)}
                />
              </div>
            )}
          </div>
        )}

        {currentTab === 'inventory' && (
          <div className="w-full h-full flex">
            <div className="w-96 h-full shrink-0 border-r border-slate-800">
              <SpringsList
                springs={springs}
                selectedSpring={selectedSpring}
                onSelectSpring={setSelectedSpring}
                onSelectTab={setCurrentTab}
              />
            </div>
            <div className="flex-1 h-full overflow-y-auto">
              {selectedSpring ? (
                <SpringInspector
                  spring={selectedSpring}
                  onRefreshSpring={handleUpdateSelectedSpring}
                  onOpenReport={(id) => setReportSpringId(id)}
                />
              ) : (
                <div className="p-12 text-center text-slate-500 text-xs">
                  Select a spring from the inventory to inspect hydrogeology and discharge history.
                </div>
              )}
            </div>
          </div>
        )}

        {currentTab === 'recharge' && selectedSpring && (
          <div className="w-full h-full overflow-y-auto bg-slate-950">
            <DelineationPanel
              spring={selectedSpring}
              onUpdateSpring={handleUpdateSelectedSpring}
            />
          </div>
        )}

        {currentTab === 'interventions' && selectedSpring && (
          <div className="w-full h-full overflow-y-auto bg-slate-950">
            <InterventionsSimulator
              spring={selectedSpring}
              onRefreshAllSprings={loadSprings}
            />
          </div>
        )}

        {currentTab === 'validation' && (
          <div className="w-full h-full overflow-y-auto bg-slate-950">
            <FieldValidationModule
              springs={springs}
              user={user}
              onRefreshAllSprings={loadSprings}
            />
          </div>
        )}

        {currentTab === 'datasets' && (
          <div className="w-full h-full overflow-y-auto bg-slate-950">
            <DatasetManager user={user} />
          </div>
        )}

        {currentTab === 'terrain' && (
          <div className="w-full h-full overflow-y-auto bg-slate-950">
            <TerrainProcessor user={user} />
          </div>
        )}

        {currentTab === 'models' && (
          <div className="w-full h-full overflow-y-auto bg-slate-950">
            <ModelRegistry />
          </div>
        )}
      </main>

      {/* Report Generator Modal */}
      {reportSpringId && (
        <ReportGenerator
          springId={reportSpringId}
          onClose={() => setReportSpringId(null)}
        />
      )}

      {/* Spring Registration Modal */}
      <SpringRegistrationModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSpringCreated={handleSpringCreated}
      />

      {/* Audit Log Modal */}
      <AuditLogModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
      />
    </div>
  );
}

export default App;
