import CloseRounded from '@mui/icons-material/CloseRounded';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { UserProfile } from '../data/profile';
import ProfileEditor from './ProfileEditor';

type ProfileDialogProps = {
    onClose: () => void;
    onSave: (profile: UserProfile) => void;
    profile: UserProfile;
};

export default function ProfileDialog({ onClose, onSave, profile }: ProfileDialogProps) {
    const { t } = useTranslation();
    const [draft, setDraft] = useState(profile);
    const [message, setMessage] = useState('');
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        closeButtonRef.current?.focus();
        function closeOnEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') onClose();
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', closeOnEscape);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [onClose]);

    function save(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const name = draft.name.trim();
        if (!name) {
            setMessage(t('profile.nameRequired'));
            return;
        }

        onSave({ ...draft, name });
        onClose();
    }

    return (
        <div
            className="settings-backdrop"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <section
                aria-labelledby="profile-dialog-title"
                aria-modal="true"
                className="profile-dialog"
                role="dialog"
            >
                <header>
                    <div>
                        <h2 id="profile-dialog-title">{t('topbar.profileSettings')}</h2>
                        <p>{t('profile.description')}</p>
                    </div>
                    <button
                        aria-label={t('join.closeButton')}
                        onClick={onClose}
                        ref={closeButtonRef}
                        type="button"
                    >
                        <CloseRounded aria-hidden="true" />
                    </button>
                </header>
                <form onSubmit={save}>
                    <ProfileEditor
                        avatar={draft.avatar}
                        idPrefix="host-profile"
                        name={draft.name}
                        onAvatarChange={(avatar) => setDraft((current) => ({ ...current, avatar }))}
                        onNameChange={(name) => {
                            setDraft((current) => ({ ...current, name }));
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
                        {t('profile.save')}
                    </button>
                </form>
            </section>
        </div>
    );
}
