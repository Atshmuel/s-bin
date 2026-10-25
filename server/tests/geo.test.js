import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { fromDeviceLocation, isLngLat, timeZoneAt } from '../utils/geo.js';

describe('geo', () => {
    test('a device location [lat, lng] is stored [lng, lat]', () => {
        assert.deepEqual(fromDeviceLocation([32.63532, 35.07587]), [35.07587, 32.63532]);
    });
    test('isLngLat takes a longitude to 180 and a latitude to 90', () => {
        assert.equal(isLngLat([139.69, 35.68]), true);   // Tokyo: refused while stored [lat, lng]
        assert.equal(isLngLat([35.68, 139.69]), false);
        assert.equal(isLngLat([35.07, 32.63, 0]), false);
        assert.equal(isLngLat([35.07, Number.NaN]), false);
    });
    test('the time zone comes from [lng, lat]', () => {
        assert.equal(timeZoneAt([35.07587, 32.63532]), 'Asia/Jerusalem');
        assert.equal(timeZoneAt([139.69, 35.68]), 'Asia/Tokyo');
    });
});
