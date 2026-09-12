import type { AvatarVariant } from '../data/profile';
import { useTranslation } from 'react-i18next';

type AvatarProps = {
    name: string;
    variant: AvatarVariant;
    size?: 'large' | 'small' | 'medium';
};

export default function Avatar({ name, variant, size = 'medium' }: AvatarProps) {
    const { t } = useTranslation();

    return (
        <span
            className={`avatar avatar--${variant} avatar--${size}`}
            role="img"
            aria-label={t('media.avatar', { name })}
        />
    );
}
