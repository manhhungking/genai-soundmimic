import { useRef, type PointerEvent as ReactPointerEvent } from 'react';
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
    const dragRef = useRef({
        activePointerId: null as number | null,
        moved: false,
        startScroll: 0,
        startX: 0,
    });

    function startAvatarDrag(event: ReactPointerEvent<HTMLDivElement>) {
        if (event.pointerType === 'touch') return;
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        dragRef.current = {
            activePointerId: event.pointerId,
            moved: false,
            startScroll: event.currentTarget.scrollLeft,
            startX: event.clientX,
        };
    }

    function dragAvatars(event: ReactPointerEvent<HTMLDivElement>) {
        if (dragRef.current.activePointerId !== event.pointerId) return;
        const distance = event.clientX - dragRef.current.startX;
        if (Math.abs(distance) > 5 && !dragRef.current.moved) {
            dragRef.current.moved = true;
            // Only capture once a real drag starts, so a plain click still targets the avatar button
            // (capturing on pointerdown would retarget the resulting click event to this container).
            event.currentTarget.setPointerCapture?.(event.pointerId);
        }
        if (dragRef.current.moved) event.currentTarget.scrollLeft = dragRef.current.startScroll - distance;
    }

    function finishAvatarDrag(event: ReactPointerEvent<HTMLDivElement>) {
        if (dragRef.current.activePointerId === event.pointerId) {
            event.currentTarget.releasePointerCapture?.(event.pointerId);
            dragRef.current.activePointerId = null;
        }
    }

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
                    onPointerCancel={finishAvatarDrag}
                    onPointerDown={startAvatarDrag}
                    onPointerMove={dragAvatars}
                    onPointerUp={finishAvatarDrag}
                    role="radiogroup"
                >
                    {avatarOptions.map((option, index) => (
                        <button
                            aria-checked={avatar === option}
                            aria-label={t('profile.avatarOption', { number: index + 1 })}
                            className={avatar === option ? 'is-selected' : ''}
                            key={option}
                            onClick={(event) => {
                                if (dragRef.current.moved) {
                                    event.preventDefault();
                                    dragRef.current.moved = false;
                                    return;
                                }
                                onAvatarChange(option);
                            }}
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
