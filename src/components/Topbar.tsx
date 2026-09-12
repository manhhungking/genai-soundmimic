import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import GroupsRounded from '@mui/icons-material/GroupsRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import QrCode2Rounded from '@mui/icons-material/QrCode2Rounded';
import SchoolRounded from '@mui/icons-material/SchoolRounded';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

type TopbarProps = {
    classCode: string;
    onOpenJoinCode: () => void;
    onOpenSettings: () => void;
};

export default function Topbar({ classCode, onOpenJoinCode, onOpenSettings }: TopbarProps) {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

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

            <label className="group-select topbar__control">
                <span className="control-icon control-icon--green">
                    <GroupsRounded />
                </span>
                <span>
                    <small>{t('topbar.group')}</small>
                    <select defaultValue="group-one">
                        <option value="group-one">{t('topbar.groupOne')}</option>
                        <option value="sound-explorers">{t('topbar.soundExplorers')}</option>
                    </select>
                </span>
                <ExpandMoreRounded aria-hidden="true" />
            </label>

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
                    className="profile__button"
                    type="button"
                    onClick={() => setProfileOpen((open) => !open)}
                    aria-expanded={profileOpen}
                >
                    <span className="profile__initials">JD</span>
                    <ExpandMoreRounded />
                </button>
                {profileOpen && (
                    <div className="profile__menu">
                        <button
                            onClick={() => {
                                setProfileOpen(false);
                                onOpenSettings();
                            }}
                            type="button"
                        >
                            {t('topbar.profileSettings')}
                        </button>
                        <button type="button">{t('topbar.leaveClass')}</button>
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
