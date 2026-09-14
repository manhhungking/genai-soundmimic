import type ClassifierApp from '@genai-fi/classifier';
import type { SoundClass } from './model';

export type ActiveSoundClassifier = {
    app: ClassifierApp;
    classes: SoundClass[];
};

let activeClassifier: ActiveSoundClassifier | undefined;

export function getActiveSoundClassifier() {
    return activeClassifier;
}

export function setActiveSoundClassifier(app: ClassifierApp, classes: SoundClass[]) {
    if (activeClassifier?.app !== app) activeClassifier?.app.model?.dispose();
    activeClassifier = { app, classes: classes.map((soundClass) => ({ ...soundClass })) };
}

export function clearActiveSoundClassifier() {
    activeClassifier?.app.model?.dispose();
    activeClassifier = undefined;
}

