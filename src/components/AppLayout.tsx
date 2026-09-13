import { useID } from '@genai-fi/base/hooks/id';
import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router';
import {
    defaultHostProfile,
    hostProfileStorageKey,
    type UserProfile,
} from '../data/profile';
import { readProfile, saveProfile } from '../util/profile';
import CornerControls from './CornerControls';
import GameControls from './GameControls';
import JoinCodeDialog from './JoinCodeDialog';
import ProfileDialog from './ProfileDialog';
import SettingsDialog from './SettingsDialog';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export type AppOutletContext = {
    xaiEnabled: boolean;
};

export function Component() {
    const navigate = useNavigate();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [joinCodeOpen, setJoinCodeOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [profile, setProfile] = useState(() => readProfile(hostProfileStorageKey, defaultHostProfile));
    const [xaiEnabled, setXaiEnabled] = useState(false);
    const classCode = useID(8);

    return (
        <div className={`app-shell${sidebarCollapsed ? ' app-shell--sidebar-collapsed' : ''}`}>
            <Sidebar
                collapsed={sidebarCollapsed}
                onOpenJoinCode={() => setJoinCodeOpen(true)}
                onOpenSettings={() => setSettingsOpen(true)}
                onToggle={() => setSidebarCollapsed((isCollapsed) => !isCollapsed)}
            />
            <main className="main-content">
                <Topbar
                    classCode={classCode}
                    onLeaveClass={() => {
                        window.sessionStorage.removeItem('genai-sm-idcode-8');
                        navigate('/');
                    }}
                    onOpenJoinCode={() => setJoinCodeOpen(true)}
                    onOpenProfileSettings={() => setProfileOpen(true)}
                    profile={profile}
                />
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
            <JoinCodeDialog
                code={classCode}
                onClose={() => setJoinCodeOpen(false)}
                open={joinCodeOpen}
            />
            {profileOpen && (
                <ProfileDialog
                    onClose={() => setProfileOpen(false)}
                    onSave={(nextProfile: UserProfile) => {
                        setProfile(nextProfile);
                        saveProfile(hostProfileStorageKey, nextProfile);
                    }}
                    profile={profile}
                />
            )}
        </div>
    );
}
