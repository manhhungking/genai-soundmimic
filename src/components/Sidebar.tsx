import BarChartRounded from '@mui/icons-material/BarChartRounded';
import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded';
import HomeRounded from '@mui/icons-material/HomeRounded';
import MenuRounded from '@mui/icons-material/MenuRounded';
import PlayCircleRounded from '@mui/icons-material/PlayCircleRounded';
import SettingsRounded from '@mui/icons-material/SettingsRounded';
import TimelineRounded from '@mui/icons-material/TimelineRounded';
import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import Brand from './Brand';
import ProjectLinks from './ProjectLinks';

type NavItem = {
    label: string;
    icon: ReactNode;
    to: string;
};

const navItems: NavItem[] = [
    { label: 'Home', icon: <HomeRounded />, to: '/home' },
    { label: 'Train Model', icon: <TimelineRounded />, to: '/train' },
    { label: 'Play', icon: <PlayCircleRounded />, to: '/play' },
    { label: 'Results', icon: <BarChartRounded />, to: '/results' },
];

type SidebarProps = {
    collapsed: boolean;
    onToggle: () => void;
};

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
    return (
        <aside className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`}>
            <div className="sidebar__header">
                <Brand />
                <button
                    aria-expanded={!collapsed}
                    aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
                    className="sidebar__collapse"
                    onClick={onToggle}
                    type="button"
                >
                    {collapsed ? <MenuRounded /> : <ChevronLeftRounded />}
                </button>
            </div>
            <nav
                className="sidebar__nav"
                aria-label="Main navigation"
            >
                {navItems.map(({ label, icon, to }) => (
                    <NavLink
                        className={({ isActive }) =>
                            `sidebar__link${isActive && !to.includes('#') ? ' sidebar__link--selected' : ''}`
                        }
                        aria-label={label}
                        key={label}
                        title={collapsed ? label : undefined}
                        to={to}
                    >
                        {icon}
                        <span>{label}</span>
                    </NavLink>
                ))}
            </nav>
            <div className="sidebar__utility">
                <button type="button">
                    <SettingsRounded />
                    <span>Settings</span>
                </button>
            </div>
            <ProjectLinks compact={collapsed} />
        </aside>
    );
}
