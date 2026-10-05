import React from 'react';
import { Match } from '../types/cricket';
import {
  Trophy,
  Volume2,
  VolumeX,
  FileSpreadsheet,
  Tv,
  History,
  Users,
  PlusCircle,
  Download,
  Flame,
  Radio,
} from 'lucide-react';
import { sounds } from '../engine/audioEffects';

interface HeaderProps {
  match: Match | null;
  activeTab: 'scoring' | 'scorecard' | 'commentary' | 'spectator' | 'history' | 'stats';
  setActiveTab: (tab: 'scoring' | 'scorecard' | 'commentary' | 'spectator' | 'history' | 'stats') => void;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  onNewMatch: () => void;
  onExportMatch: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  match,
  activeTab,
  setActiveTab,
  soundEnabled,
  setSoundEnabled,
  onNewMatch,
  onExportMatch,
}) => {
  const toggleSound = () => {
    sounds.enabled = !soundEnabled;
    setSoundEnabled(!soundEnabled);
    if (!soundEnabled) {
      sounds.playTap();
    }
  };

  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-logo-badge">
          <Flame size={24} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="brand-title">PITCHMASTER</span>
            <span className="brand-badge">LIVE SCORING</span>
          </div>
          {match && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {match.series} • {match.venue} ({match.format} - {match.totalOvers} Ov)
            </div>
          )}
        </div>
      </div>

      <nav className="header-nav">
        <button
          className={`nav-btn ${activeTab === 'scoring' ? 'active' : ''}`}
          onClick={() => setActiveTab('scoring')}
        >
          <Radio size={16} />
          <span>Live Scoring</span>
        </button>

        <button
          className={`nav-btn ${activeTab === 'scorecard' ? 'active' : ''}`}
          onClick={() => setActiveTab('scorecard')}
        >
          <FileSpreadsheet size={16} />
          <span>Scorecard</span>
        </button>

        <button
          className={`nav-btn ${activeTab === 'commentary' ? 'active' : ''}`}
          onClick={() => setActiveTab('commentary')}
        >
          <span>Commentary</span>
        </button>

        <button
          className={`nav-btn ${activeTab === 'spectator' ? 'active' : ''}`}
          onClick={() => setActiveTab('spectator')}
        >
          <Tv size={16} />
          <span>Spectator Mode</span>
        </button>

        <button
          className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={16} />
          <span>Matches</span>
        </button>

        <button
          className={`nav-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          <Users size={16} />
          <span>Player Stats</span>
        </button>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          className="icon-btn"
          title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
          onClick={toggleSound}
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>

        {match && (
          <button
            className="icon-btn"
            title="Export Match JSON"
            onClick={onExportMatch}
          >
            <Download size={18} />
          </button>
        )}

        <button className="btn-primary" onClick={onNewMatch}>
          <PlusCircle size={18} />
          <span>New Match</span>
        </button>
      </div>
    </header>
  );
};
