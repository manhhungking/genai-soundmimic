export const avatarOptions = ['maya', 'ethan', 'sophia', 'leo'] as const;

export type AvatarVariant = (typeof avatarOptions)[number];

export type UserProfile = {
    avatar: AvatarVariant;
    name: string;
};

export const hostProfileStorageKey = 'soundmimic-host-profile';
export const studentProfileStorageKey = 'soundmimic-student-profile';

export const defaultHostProfile: UserProfile = {
    avatar: 'ethan',
    name: 'Jordan Davis',
};

export const defaultStudentProfile: UserProfile = {
    avatar: 'maya',
    name: '',
};

function isAvatarVariant(value: unknown): value is AvatarVariant {
    return avatarOptions.some((avatar) => avatar === value);
}

export function readProfile(storageKey: string, fallback: UserProfile): UserProfile {
    if (typeof window === 'undefined') return fallback;

    try {
        const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? 'null') as Partial<UserProfile> | null;
        if (saved && typeof saved.name === 'string' && isAvatarVariant(saved.avatar)) {
            return { avatar: saved.avatar, name: saved.name };
        }
    } catch {
        // Ignore malformed local data and restore the safe default.
    }

    return fallback;
}

export function saveProfile(storageKey: string, profile: UserProfile) {
    window.localStorage.setItem(storageKey, JSON.stringify(profile));
}
