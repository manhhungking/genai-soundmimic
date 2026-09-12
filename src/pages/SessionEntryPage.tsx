import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router';
import Brand from '../components/Brand';
import CornerControls from '../components/CornerControls';
import ProjectLinks from '../components/ProjectLinks';
import { isLanguageCode } from '../locales/config';
import { setAppLanguage } from '../i18n';

export function Component() {
    const { i18n, t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [code, setCode] = useState(() => searchParams.get('code')?.slice(0, 8).toUpperCase() ?? '');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const language = searchParams.get('lng');
        if (isLanguageCode(language)) void setAppLanguage(language, false);
    }, [searchParams]);

    function joinSession(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!code.trim()) {
            setMessage(t('entry.missingCode'));
            return;
        }
        if (!/^\d{8}$/.test(code)) {
            setMessage(t('entry.invalidCode'));
            return;
        }

        const params = new URLSearchParams({
            code,
            lng: i18n.resolvedLanguage ?? i18n.language,
        });
        navigate(`/join/profile?${params.toString()}`);
    }

    return (
        <main className="entry-page">
            <div className="entry-page__glow" />
            <div className="entry-page__content">
                <Brand large />
                <form
                    className="join-card"
                    onSubmit={joinSession}
                >
                    <h1>{t('entry.title')}</h1>
                    <label htmlFor="session-code">{t('entry.codeLabel')}</label>
                    <input
                        id="session-code"
                        value={code}
                        onChange={(event) => {
                            setCode(event.target.value.toUpperCase());
                            setMessage('');
                        }}
                        placeholder={t('entry.codePlaceholder')}
                        autoComplete="off"
                        maxLength={8}
                    />
                    {message && (
                        <p
                            className="join-card__message"
                            role="alert"
                        >
                            {message}
                        </p>
                    )}
                    <button
                        className="primary-button"
                        type="submit"
                    >
                        {t('entry.start')}
                    </button>
                    <div className="join-card__divider">
                        <span />
                        {t('entry.or')}
                        <span />
                    </div>
                    <button
                        className="secondary-button"
                        type="button"
                        onClick={() => navigate('/home')}
                    >
                        {t('entry.teacher')}
                    </button>
                </form>
            </div>
            <ProjectLinks entry />
            <CornerControls />
        </main>
    );
}
