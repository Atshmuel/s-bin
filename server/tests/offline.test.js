import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { isOffline, offlineCauses, upstreamId } from '../utils/offline.js';
import { HOUR_MS, MINUTE_MS } from '../utils/constants.js';

const NOW = Date.UTC(2026, 9, 24, 8);
const INTERVAL_MINUTES = 720;  // missed twice plus the grace: 24 h 10 min
const ago = hours => new Date(NOW - hours * HOUR_MS);
const cellular = { via: 'cellular', gatewayId: null };
const mesh = gatewayId => ({ via: 'mesh', gatewayId });
const device = (id, lastHours, connection) => ({
    _id: id, ownerId: 'org', createdAt: ago(500), status: { updatedAt: ago(lastHours), connection },
});
const causesOf = devices => offlineCauses(devices, new Map([['org', INTERVAL_MINUTES]]), NOW);

describe('isOffline', () => {
    test('after two missed reports and the grace', () => {
        assert.equal(isOffline(device('a', 24, cellular), INTERVAL_MINUTES, NOW), false);
        assert.equal(isOffline({ status: { updatedAt: new Date(NOW - 24 * HOUR_MS - 11 * MINUTE_MS) } },
            INTERVAL_MINUTES, NOW), true);
    });
    test('a device without a report counts from its creation', () => {
        assert.equal(isOffline({ createdAt: ago(30) }, INTERVAL_MINUTES, NOW), true);
        assert.equal(isOffline({ createdAt: ago(2) }, INTERVAL_MINUTES, NOW), false);
    });
});

describe('upstreamId', () => {
    test('is the gateway of a leaf, null for a device with its own connection', () => {
        assert.equal(upstreamId(device('leaf', 1, mesh('gw'))), 'gw');
        assert.equal(upstreamId(device('bin', 1, cellular)), null);
    });
});

describe('offlineCauses', () => {
    test('a silent gateway is the cause for the leaves behind it', () => {
        const causes = causesOf([device('gw', 30, cellular), device('leaf', 30.1, mesh('gw'))]);
        assert.deepEqual(causes.get('gw'), { cause: 'self' });
        assert.deepEqual(causes.get('leaf'), { cause: 'gateway', gatewayId: 'gw' });
    });
    test('a leaf whose gateway kept reporting is offline by itself', () => {
        const causes = causesOf([device('gw', 1, cellular), device('leaf', 30, mesh('gw'))]);
        assert.equal(causes.has('gw'), false);
        assert.deepEqual(causes.get('leaf'), { cause: 'self' });
    });
    test('a leaf whose gateway went silent with it waits for the gateway', () => {
        // The gateway is just under the limit; the leaf, a little older, is over it.
        const causes = causesOf([device('gw', 24, cellular), device('leaf', 24.3, mesh('gw'))]);
        assert.equal(causes.has('gw'), false);
        assert.deepEqual(causes.get('leaf'), { cause: 'gateway', gatewayId: 'gw' });
    });
    test('a leaf whose gateway is unknown is offline by itself', () => {
        assert.deepEqual(causesOf([device('leaf', 30, mesh('gone'))]).get('leaf'), { cause: 'self' });
    });
    test('devices that report are not listed', () => {
        assert.equal(causesOf([device('bin', 2, cellular)]).size, 0);
    });
});
