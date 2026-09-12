import type { Student } from '../data/home';

type AvatarProps = {
    name: string;
    variant: Student['avatar'];
    size?: 'small' | 'medium';
};

export default function Avatar({ name, variant, size = 'medium' }: AvatarProps) {
    return (
        <span
            className={`avatar avatar--${variant} avatar--${size}`}
            role="img"
            aria-label={`${name}'s avatar`}
        />
    );
}
