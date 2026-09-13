import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded';
import CheckRounded from '@mui/icons-material/CheckRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import GroupsRounded from '@mui/icons-material/GroupsRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import QrCode2Rounded from '@mui/icons-material/QrCode2Rounded';
import SchoolRounded from '@mui/icons-material/SchoolRounded';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { UserProfile } from '../data/profile';
import Avatar from './Avatar';

type TopbarProps = {
    classCode: string;
    onLeaveClass: () => void;
    onOpenJoinCode: () => void;
    onOpenProfileSettings: () => void;
    profile: UserProfile;
};

export default function Topbar({ classCode, onLeaveClass, onOpenJoinCode, onOpenProfileSettings, profile }: TopbarProps) {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);
    const [groupOpen, setGroupOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState('group-one');
    const [profileOpen, setProfileOpen] = useState(false);
    const groupRef = useRef<HTMLDivElement>(null);
    const groupTriggerRef = useRef<HTMLButtonElement>(null);

    const groups = [
        { value: 'group-one', label: t('topbar.groupOne') },
        { value: 'sound-explorers', label: t('topbar.soundExplorers') },
    ];
    const currentGroup = groups.find(({ value }) => value === selectedGroup) ?? groups[0];

    useEffect(() => {
        if (!groupOpen) return;

        function closeOnOutsidePress(event: PointerEvent) {
            if (!groupRef.current?.contains(event.target as Node)) setGroupOpen(false);
        }

        function closeOnEscape(event: KeyboardEvent) {
            if (event.key !== 'Escape') return;
            setGroupOpen(false);
            groupTriggerRef.current?.focus();
        }

        document.addEventListener('pointerdown', closeOnOutsidePress);
        document.addEventListener('keydown', closeOnEscape);
        return () => {
            document.removeEventListener('pointerdown', closeOnOutsidePress);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [groupOpen]);

    async function copyClassCode() {
        await navigator.clipboard?.writeText(classCode);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
    }

    return (
        <header className="topbar">
            <div className="class-code topbar__control">
                <span className="control-icon control-icon--blue">
                    <GroupsRounded />
                </span>
                <span>
                    <small>{t('topbar.classCode')}</small>
                    <strong>{classCode}</strong>
                </span>
                <div className="class-code__actions">
                    <button
                        className="icon-button class-code__qr"
                        type="button"
                        onClick={onOpenJoinCode}
                        aria-label={t('join.show')}
                    >
                        <QrCode2Rounded />
                    </button>
                    <button
                        className="icon-button"
                        type="button"
                        onClick={copyClassCode}
                        aria-label={t('topbar.copyCode')}
                    >
                        <ContentCopyRounded />
                    </button>
                </div>
            </div>

            <div
                className={`group-select topbar__control${groupOpen ? ' is-open' : ''}`}
                ref={groupRef}
            >
                <span className="control-icon control-icon--green">
                    <GroupsRounded />
                </span>
                <button
                    aria-expanded={groupOpen}
                    aria-haspopup="listbox"
                    aria-label={`${t('topbar.group')}: ${currentGroup.label}`}
                    className="group-select__trigger"
                    onClick={() => setGroupOpen((isOpen) => !isOpen)}
                    ref={groupTriggerRef}
                    type="button"
                >
                    <span>
                        <small>{t('topbar.group')}</small>
                        <strong>{currentGroup.label}</strong>
                    </span>
                    <ExpandMoreRounded
                        aria-hidden="true"
                        className="group-select__chevron"
                    />
                </button>
                {groupOpen && (
                    <ul
                        aria-label={t('topbar.group')}
                        className="group-select__menu"
                        role="listbox"
                    >
                        {groups.map(({ value, label }) => (
                            <li key={value} role="presentation">
                                <button
                                    aria-selected={value === selectedGroup}
                                    onClick={() => {
                                        setSelectedGroup(value);
                                        setGroupOpen(false);
                                        groupTriggerRef.current?.focus();
                                    }}
                                    role="option"
                                    type="button"
                                >
                                    <span>{label}</span>
                                    {value === selectedGroup && <CheckRounded aria-hidden="true" />}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div
                className="role-switch"
                aria-label={t('topbar.chooseRole')}
            >
                <button
                    aria-label={t('topbar.studentComing')}
                    disabled
                    type="button"
                    aria-pressed={false}
                    title={t('topbar.studentComing')}
                >
                    <PersonRounded />
                    {t('topbar.student')}
                </button>
                <button
                    className="is-active"
                    type="button"
                    aria-pressed={true}
                >
                    <SchoolRounded />
                    {t('topbar.host')}
                </button>
            </div>

            <div className="profile">
                <button
                    aria-label={t('profile.open', { name: profile.name })}
                    className="profile__button"
                    type="button"
                    onClick={() => setProfileOpen((open) => !open)}
                    aria-expanded={profileOpen}
                >
                    <Avatar
                        name={profile.name}
                        size="small"
                        variant={profile.avatar}
                    />
                    <ExpandMoreRounded />
                </button>
                {profileOpen && (
                    <div className="profile__menu">
                        <button
                            onClick={() => {
                                setProfileOpen(false);
                                onOpenProfileSettings();
                            }}
                            type="button"
                        >
                            {t('topbar.profileSettings')}
                        </button>
                        <button
                            className="profile__leave"
                            onClick={() => {
                                setProfileOpen(false);
                                onLeaveClass();
                            }}
                            type="button"
                        >
                            {t('topbar.leaveClass')}
                        </button>
                    </div>
                )}
            </div>

            <div
                className={`toast${copied ? ' toast--visible' : ''}`}
                role="status"
            >
                {t('topbar.codeCopied')}
            </div>
        </header>
    );
}
