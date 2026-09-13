import { describe, expect, it } from 'vitest';
import { toZipFileName } from './download';

describe('download utilities', () => {
    it('creates a safe zip filename without duplicating the extension', () => {
        expect(toZipFileName(' My/Classroom Model ')).toBe('My-Classroom Model.zip');
        expect(toZipFileName('Ready.zip')).toBe('Ready.zip');
        expect(toZipFileName('  ')).toBe('sound-mimic-model.zip');
    });
});
