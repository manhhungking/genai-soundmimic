import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useSearchParams } from 'react-router';
import Brand from '../components/Brand';
import CornerControls from '../components/CornerControls';
import ProfileEditor from '../components/ProfileEditor';
import ProjectLinks from '../components/ProjectLinks';
import {
    defaultStudentProfile,
    studentProfileStorageKey,
} from '../data/profile';
import { isLanguageCode, setAppLanguage } from '../i18n';
import { readProfile, saveProfile } from '../util/profile';

export function Component() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const code = searchParams.get('code') ?? '';
    const [profile, setProfile] = useState(() => readProfile(studentProfileStorageKey, defaultStudentProfile));
    const [message, setMessage] = useState('');

    useEffect(() => {
        const language = searchParams.get('lng');
        if (isLanguageCode(language)) void setAppLanguage(language, false);
    }, [searchParams]);

    if (!/^\d{8}$/.test(code)) return <Navigate replace to="/" />;

    function joinClass(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const name = profile.name.trim();
        if (!name) {
            setMessage(t('profile.nameRequired'));
            return;
        }

        const nextProfile = { ...profile, name };
        setProfile(nextProfile);
        saveProfile(studentProfileStorageKey, nextProfile);
        const language = searchParams.get('lng');
        const query = new URLSearchParams({ code });
        if (isLanguageCode(language)) query.set('lng', language);
        navigate(`/join/play?${query.toString()}`);
    }

    return (
        <main className="entry-page profile-setup-page">
            <div className="entry-page__glow" />
            <div className="profile-setup-page__content">
                <Brand large />
                <section className="profile-setup-card">
                    <header>
                        <h1>{t('join.profileTitle')}</h1>
                        <p>{t('join.profileDescription')}</p>
                        <strong>
                            {t('topbar.classCode')}: {code}
                        </strong>
                    </header>
                    <form onSubmit={joinClass}>
                        <ProfileEditor
                            avatar={profile.avatar}
                            idPrefix="student-profile"
                            name={profile.name}
                            onAvatarChange={(avatar) => setProfile((current) => ({ ...current, avatar }))}
                            onNameChange={(name) => {
                                setProfile((current) => ({ ...current, name }));
                                setMessage('');
                            }}
                        />
                        {message && (
                            <p
                                className="profile-editor__message"
                                role="alert"
                            >
                                {message}
                            </p>
                        )}
                        <button
                            className="primary-button"
                            type="submit"
                        >
                            {t('join.profileSubmit')}
                        </button>
                    </form>
                </section>
            </div>
            <ProjectLinks entry />
            <CornerControls />
        </main>
    );
}
