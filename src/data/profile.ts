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
    'jin',
] as const;

export type AvatarVariant = (typeof avatarOptions)[number];

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
