import { beforeEach, describe, expect, it } from 'vitest';
import { defaultHostProfile } from '../data/profile';
import { readProfile } from './profile';

describe('profile avatar migration', () => {
    beforeEach(() => window.localStorage.clear());

    it.each([
        ['ethan', 'leo'],
        ['sophia', 'maya'],
    ])('maps the legacy %s avatar to %s', (legacyAvatar, expectedAvatar) => {
        window.localStorage.setItem('profile', JSON.stringify({ avatar: legacyAvatar, name: 'Jordan' }));

        expect(readProfile('profile', defaultHostProfile)).toEqual({
            avatar: expectedAvatar,
            name: 'Jordan',
        });
    });

    it('keeps current avatar identifiers unchanged', () => {
        window.localStorage.setItem('profile', JSON.stringify({ avatar: 'hana', name: 'Hana' }));

        expect(readProfile('profile', defaultHostProfile)).toEqual({ avatar: 'hana', name: 'Hana' });
    });
});
