import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import GroupsRounded from '@mui/icons-material/GroupsRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import SchoolRounded from '@mui/icons-material/SchoolRounded';
import { useState } from 'react';

export default function Topbar() {
    const [copied, setCopied] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    async function copyClassCode() {
        await navigator.clipboard?.writeText('ABCD12');
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
                    <small>Class Code</small>
                    <strong>ABCD12</strong>
                </span>
                <button
                    className="icon-button"
                    type="button"
                    onClick={copyClassCode}
                    aria-label="Copy class code"
                >
                    <ContentCopyRounded />
                </button>
            </div>

            <label className="group-select topbar__control">
                <span className="control-icon control-icon--green">
                    <GroupsRounded />
                </span>
                <span>
                    <small>Group</small>
                    <select defaultValue="group-one">
                        <option value="group-one">Group 1</option>
                        <option value="sound-explorers">Sound Explorers</option>
                    </select>
                </span>
                <ExpandMoreRounded aria-hidden="true" />
            </label>

            <div
                className="role-switch"
                aria-label="Choose role"
            >
                <button
                    aria-label="Student view is coming later"
                    disabled
                    type="button"
                    aria-pressed={false}
                    title="Student view is coming later"
                >
                    <PersonRounded />
                    Student
                </button>
                <button
                    className="is-active"
                    type="button"
                    aria-pressed={true}
                >
                    <SchoolRounded />
                    Host
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
                        <button type="button">Profile settings</button>
                        <button type="button">Leave class</button>
                    </div>
                )}
            </div>

            <div
                className={`toast${copied ? ' toast--visible' : ''}`}
                role="status"
            >
                Class code copied
            </div>
        </header>
    );
}
