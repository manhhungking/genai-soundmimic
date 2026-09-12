import { useTranslation } from 'react-i18next';
import { avatarOptions, type AvatarVariant } from '../data/profile';
import Avatar from './Avatar';

type ProfileEditorProps = {
    avatar: AvatarVariant;
    idPrefix: string;
    name: string;
    onAvatarChange: (avatar: AvatarVariant) => void;
    onNameChange: (name: string) => void;
};

export default function ProfileEditor({
    avatar,
    idPrefix,
    name,
    onAvatarChange,
    onNameChange,
}: ProfileEditorProps) {
    const { t } = useTranslation();

    return (
        <div className="profile-editor">
            <label htmlFor={`${idPrefix}-name`}>{t('profile.nameLabel')}</label>
            <input
                autoComplete="nickname"
                id={`${idPrefix}-name`}
                maxLength={24}
                onChange={(event) => onNameChange(event.target.value)}
                placeholder={t('profile.namePlaceholder')}
                value={name}
            />

            <fieldset>
                <legend>{t('profile.chooseAvatar')}</legend>
                <div
                    aria-label={t('profile.chooseAvatar')}
                    className="profile-editor__avatars"
                    role="radiogroup"
                >
                    {avatarOptions.map((option, index) => (
                        <button
                            aria-checked={avatar === option}
                            aria-label={t('profile.avatarOption', { number: index + 1 })}
                            className={avatar === option ? 'is-selected' : ''}
                            key={option}
                            onClick={() => onAvatarChange(option)}
                            role="radio"
                            type="button"
                        >
                            <Avatar
                                name={t('profile.avatarOption', { number: index + 1 })}
                                size="large"
                                variant={option}
                            />
                        </button>
                    ))}
                </div>
            </fieldset>
        </div>
    );
}
