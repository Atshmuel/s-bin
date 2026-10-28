import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { generateRegistrationCode, registrationCodeMatches } from '../utils/registrationCode.js';

describe('registration codes', () => {
    test('a code is two groups of four unambiguous characters', () => {
        for (let i = 0; i < 50; i++) assert.match(generateRegistrationCode(), /^[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/);
    });
    test('typed without case or the dash it still matches; anything else does not', () => {
        assert.equal(registrationCodeMatches('k7m3q9tx', 'K7M3-Q9TX'), true);
        assert.equal(registrationCodeMatches('K7M3 Q9TX', 'K7M3-Q9TX'), true);
        assert.equal(registrationCodeMatches('K7M3-Q9TY', 'K7M3-Q9TX'), false);
        assert.equal(registrationCodeMatches('', 'K7M3-Q9TX'), false);
        assert.equal(registrationCodeMatches('K7M3-Q9TX', null), false);
    });
});
