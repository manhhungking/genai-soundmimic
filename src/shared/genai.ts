export { randomId, theme as genAITheme } from '@genai-fi/base';

export async function loadClassifier() {
    return import('@genai-fi/classifier');
}
