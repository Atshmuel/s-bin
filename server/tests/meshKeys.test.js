import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { deriveBeaconKey, deriveLeafKey, generateMeshKey, isMeshKey, meshKeysHeader, nextMeshKeyId } from '../utils/meshKeys.js';

// The same organization key and vectors as the firmware's tests
// (arduino/libraries/SbinMesh/test/auth_test.cpp), computed independently in Python.
const ORGANIZATION_KEY = Array.from({ length: 32 }, (_, i) => i.toString(16).padStart(2, '0')).join('');
const LEAF_MAC = '28:84:85:38:66:44';
const LEAF_KEY = 'ec03733de0bf2c674dfc3e02c081c88c503009e4964933e52b28b7905cb8f3fa';
const BEACON_KEY = '89ff271e100fda114251b8fa137674bb0351fe9fd2a0d616fbfbd120c1f5e7ad';

describe('derived keys', () => {
    test('match the firmware\'s', () => {
        assert.equal(deriveLeafKey(ORGANIZATION_KEY, LEAF_MAC), LEAF_KEY);
        assert.equal(deriveBeaconKey(ORGANIZATION_KEY), BEACON_KEY);
    });
    test('a MAC is read the same in either case', () => {
        assert.equal(deriveLeafKey(ORGANIZATION_KEY, '44:1d:64:bd:63:6c'), deriveLeafKey(ORGANIZATION_KEY, '44:1D:64:BD:63:6C'));
    });
    test('differ by leaf and by organization', () => {
        assert.notEqual(deriveLeafKey(ORGANIZATION_KEY, LEAF_MAC), deriveLeafKey(ORGANIZATION_KEY, '44:1D:64:BD:63:6C'));
        assert.notEqual(deriveLeafKey(generateMeshKey(), LEAF_MAC), LEAF_KEY);
    });
    test('refuse what is not a key or a MAC', () => {
        assert.throws(() => deriveLeafKey('nope', LEAF_MAC));
        assert.throws(() => deriveLeafKey(ORGANIZATION_KEY, '28:84:85:38:66'));
        assert.throws(() => deriveBeaconKey(undefined));
    });
});

describe('mesh keys', () => {
    test('are 64 hex characters, new each time', () => {
        const a = generateMeshKey();
        assert.ok(isMeshKey(a));
        assert.notEqual(a, generateMeshKey());
        assert.equal(isMeshKey(a.toUpperCase()), false);
        assert.equal(isMeshKey(a.slice(2)), false);
        assert.equal(isMeshKey(null), false);
    });
    test('generations run 1 to 255 and wrap', () => {
        assert.equal(nextMeshKeyId(undefined), 1);
        assert.equal(nextMeshKeyId(0), 1);
        assert.equal(nextMeshKeyId(1), 2);
        assert.equal(nextMeshKeyId(254), 255);
        assert.equal(nextMeshKeyId(255), 1);
    });
});

describe('meshKeysHeader', () => {
    const header = meshKeysHeader({ organizationKey: ORGANIZATION_KEY, keyId: 3, mac: LEAF_MAC });
    test('holds the leaf\'s two keys and the generation, byte by byte', () => {
        assert.match(header, /MESH_KEY_ID = 3;/);
        assert.ok(header.includes(`MESH_LEAF_KEY[32] = {${LEAF_KEY.match(/../g).map(b => `0x${b}`).join(', ')}};`));
        assert.ok(header.includes(`MESH_BEACON_KEY[32] = {${BEACON_KEY.match(/../g).map(b => `0x${b}`).join(', ')}};`));
    });
    test('never holds the organization\'s key', () => {
        assert.ok(!header.includes(ORGANIZATION_KEY));
        assert.ok(!header.includes(ORGANIZATION_KEY.match(/../g).map(b => `0x${b}`).join(', ')));
    });
});
