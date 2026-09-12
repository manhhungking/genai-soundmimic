import BarChartRounded from '@mui/icons-material/BarChartRounded';
import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded';
import HomeRounded from '@mui/icons-material/HomeRounded';
import MenuRounded from '@mui/icons-material/MenuRounded';
import PlayCircleRounded from '@mui/icons-material/PlayCircleRounded';
import SettingsRounded from '@mui/icons-material/SettingsRounded';
import TimelineRounded from '@mui/icons-material/TimelineRounded';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router';
import Brand from './Brand';
import ProjectLinks from './ProjectLinks';

type NavItem = {
    labelKey: 'nav.home' | 'nav.train' | 'nav.play' | 'nav.results';
    icon: ReactNode;
    to: string;
};

const navItems: NavItem[] = [
    { labelKey: 'nav.home', icon: <HomeRounded />, to: '/home' },
    { labelKey: 'nav.train', icon: <TimelineRounded />, to: '/train' },
    { labelKey: 'nav.play', icon: <PlayCircleRounded />, to: '/play' },
    { labelKey: 'nav.results', icon: <BarChartRounded />, to: '/results' },
];

type SidebarProps = {
    collapsed: boolean;
    onOpenSettings: () => void;
    onToggle: () => void;
};

export default function Sidebar({ collapsed, onOpenSettings, onToggle }: SidebarProps) {
    const { t } = useTranslation();

    return (
        <aside className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`}>
            <div className="sidebar__header">
                <Brand />
                <button
                    aria-expanded={!collapsed}
                    aria-label={t(collapsed ? 'nav.expand' : 'nav.collapse')}
                    className="sidebar__collapse"
                    onClick={onToggle}
                    type="button"
                >
                    {collapsed ? <MenuRounded /> : <ChevronLeftRounded />}
                </button>
            </div>
            <nav
                className="sidebar__nav"
                aria-label={t('nav.main')}
            >
                {navItems.map(({ labelKey, icon, to }) => {
                    const label = t(labelKey);
                    return (
                        <NavLink
                            className={({ isActive }) =>
                                `sidebar__link${isActive && !to.includes('#') ? ' sidebar__link--selected' : ''}`
                            }
                            aria-label={label}
                            key={labelKey}
                            title={collapsed ? label : undefined}
                            to={to}
                        >
                            {icon}
                            <span>{label}</span>
                        </NavLink>
                    );
                })}
            </nav>
            <div className="sidebar__utility">
                <button
                    aria-label={t('nav.settings')}
                    onClick={onOpenSettings}
                    type="button"
                >
                    <SettingsRounded />
                    <span>{t('nav.settings')}</span>
                </button>
            </div>
            <ProjectLinks compact={collapsed} />
        </aside>
    );
}
