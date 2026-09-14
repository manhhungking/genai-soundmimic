import type { AvatarVariant } from './profile';

export type Student = {
    name: string;
    avatar: AvatarVariant;
};

export const students: Student[] = [
    { name: 'Leo', avatar: 'leo' },
    { name: 'Maya', avatar: 'maya' },
    { name: 'Noah', avatar: 'noah' },
    { name: 'Emma', avatar: 'emma' },
];
