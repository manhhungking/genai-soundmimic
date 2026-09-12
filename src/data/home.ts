export type Student = {
    name: string;
    avatar: 'maya' | 'ethan' | 'sophia' | 'leo';
};

export const students: Student[] = [
    { name: 'Leo', avatar: 'ethan' },
    { name: 'Maya', avatar: 'sophia' },
    { name: 'Noah', avatar: 'maya' },
    { name: 'Emma', avatar: 'leo' },
];
