import type { Student } from './home';

export type RoundPrediction = Student & {
    confidence: number;
    emoji: string;
    prediction: string;
};

export type RoundResult = {
    id: number;
    soundSet: string;
    predictions: RoundPrediction[];
};

export const roundResults: RoundResult[] = [
    {
        id: 1,
        soundSet: 'Everyday Sounds',
        predictions: [
            { name: 'Leo', avatar: 'leo', prediction: 'Bird', emoji: '🐦', confidence: 82 },
            { name: 'Maya', avatar: 'maya', prediction: 'Clap', emoji: '👏', confidence: 77 },
            { name: 'Noah', avatar: 'noah', prediction: 'Cat', emoji: '🐱', confidence: 74 },
            { name: 'Emma', avatar: 'emma', prediction: 'Bell', emoji: '🔔', confidence: 68 },
        ],
    },
];
