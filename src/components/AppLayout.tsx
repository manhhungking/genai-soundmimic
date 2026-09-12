import { useState } from 'react';
import { Outlet } from 'react-router';
import CornerControls from './CornerControls';
import GameControls from './GameControls';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export type AppOutletContext = {
    xaiEnabled: boolean;
};

export function Component() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [xaiEnabled, setXaiEnabled] = useState(false);

    return (
        <div className={`app-shell${sidebarCollapsed ? ' app-shell--sidebar-collapsed' : ''}`}>
            <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed((isCollapsed) => !isCollapsed)}
            />
            <main className="main-content">
                <Topbar />
                <Outlet context={{ xaiEnabled } satisfies AppOutletContext} />
            </main>
            <GameControls
                xaiEnabled={xaiEnabled}
                onToggleXai={() => setXaiEnabled((enabled) => !enabled)}
            />
            <CornerControls />
        </div>
    );
}
