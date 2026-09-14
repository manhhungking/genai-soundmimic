import { avatarOptions, type AvatarVariant, type UserProfile } from '../data/profile';

const legacyAvatars: Record<string, AvatarVariant> = {
    ethan: 'leo',
    sophia: 'maya',
};

function isAvatarVariant(value: unknown): value is AvatarVariant {
    return avatarOptions.some((avatar) => avatar === value);
}

export function normalizeAvatarVariant(value: unknown): AvatarVariant | undefined {
    if (isAvatarVariant(value)) return value;
    return typeof value === 'string' ? legacyAvatars[value] : undefined;
}

export function readProfile(storageKey: string, fallback: UserProfile): UserProfile {
    if (typeof window === 'undefined') return fallback;

    try {
        const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? 'null') as Partial<UserProfile> | null;
        const avatar = normalizeAvatarVariant(saved?.avatar);
        if (saved && typeof saved.name === 'string' && avatar) {
            return { avatar, name: saved.name };
        }
    } catch {
        // Ignore malformed local data and restore the safe default.
    }

    return fallback;
}

export function saveProfile(storageKey: string, profile: UserProfile) {
    window.localStorage.setItem(storageKey, JSON.stringify(profile));
}
