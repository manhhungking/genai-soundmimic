import type { AvatarVariant } from './profile';

export type Student = {
    name: string;
    avatar: AvatarVariant;
};

export const students: Student[] = [
    { name: 'Leo', avatar: 'ethan' },
    { name: 'Maya', avatar: 'sophia' },
    { name: 'Noah', avatar: 'maya' },
    { name: 'Emma', avatar: 'leo' },
];
