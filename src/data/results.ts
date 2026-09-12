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
            { name: 'Leo', avatar: 'ethan', prediction: 'Bird', emoji: '🐦', confidence: 82 },
            { name: 'Maya', avatar: 'sophia', prediction: 'Clap', emoji: '👏', confidence: 77 },
            { name: 'Noah', avatar: 'maya', prediction: 'Cat', emoji: '🐱', confidence: 74 },
            { name: 'Emma', avatar: 'leo', prediction: 'Bell', emoji: '🔔', confidence: 68 },
        ],
    },
];
