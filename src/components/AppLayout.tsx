import { useState } from 'react';
import { Outlet } from 'react-router';
import CornerControls from './CornerControls';
import GameControls from './GameControls';
import SettingsDialog from './SettingsDialog';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export type AppOutletContext = {
    xaiEnabled: boolean;
};

export function Component() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [xaiEnabled, setXaiEnabled] = useState(false);

    return (
        <div className={`app-shell${sidebarCollapsed ? ' app-shell--sidebar-collapsed' : ''}`}>
            <Sidebar
                collapsed={sidebarCollapsed}
                onOpenSettings={() => setSettingsOpen(true)}
                onToggle={() => setSidebarCollapsed((isCollapsed) => !isCollapsed)}
            />
            <main className="main-content">
                <Topbar onOpenSettings={() => setSettingsOpen(true)} />
                <Outlet context={{ xaiEnabled } satisfies AppOutletContext} />
            </main>
            <GameControls
                xaiEnabled={xaiEnabled}
                onToggleXai={() => setXaiEnabled((enabled) => !enabled)}
            />
            <CornerControls onOpenSettings={() => setSettingsOpen(true)} />
            <SettingsDialog
                onClose={() => setSettingsOpen(false)}
                open={settingsOpen}
            />
        </div>
    );
}
