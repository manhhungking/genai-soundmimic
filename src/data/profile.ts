export const avatarOptions = [
    'leo',
    'maya',
    'noah',
    'emma',
    'kai',
    'zoe',
    'liam',
    'hana',
    'aisha',
    'hung',
] as const;

export type AvatarVariant = (typeof avatarOptions)[number];

// Proper nouns — kept identical across locales (see docs/avatars/AVATAR_SPEC.md section 4).
export const avatarDisplayNames: Record<AvatarVariant, string> = {
    leo: 'Leo',
    maya: 'Maya',
    noah: 'Noah',
    emma: 'Emma',
    kai: 'Kai',
    zoe: 'Zoe',
    liam: 'Liam',
    hana: 'Hana',
    aisha: 'Aisha',
    hung: 'Hung',
};

export type UserProfile = {
    avatar: AvatarVariant;
    name: string;
};

export const hostProfileStorageKey = 'soundmimic-host-profile';
export const studentProfileStorageKey = 'soundmimic-student-profile';

export const defaultHostProfile: UserProfile = {
    avatar: 'leo',
    name: 'Jordan Davis',
};

export const defaultStudentProfile: UserProfile = {
    avatar: 'maya',
    name: '',
};
