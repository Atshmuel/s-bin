import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanDiagnostics } from '../utils/diagnostics.js';

describe('diagnostics', () => {
    test('valid fields are kept, nested ones too', () => {
        const sent = {
            firmwareVersion: '1.0.0', resetReason: 'deepsleep', batteryMv: 3912, chipTempC: 31.5, charger: 'constant_voltage',
            stages: { modemMs: 4200, mqttMs: 900 }, network: { operator: '425-01', band: 'EUTRAN-BAND3', rsrp: -102, cellId: 27447297 },
        };
        assert.deepEqual(cleanDiagnostics(sent), sent);
    });
    test('a wrong or unknown field is dropped, never the rest', () => {
        assert.deepEqual(cleanDiagnostics({
            firmwareVersion: 'v1', batteryMv: 3900, resetReason: 'exploded', chipTempC: 400, extra: 1,
            network: { operator: '425-01', rsrp: 5 }, stages: { modemMs: -1 },
        }), { batteryMv: 3900, network: { operator: '425-01' } });
    });
    test('nothing valid, or no object, is null', () => {
        assert.equal(cleanDiagnostics(undefined), null);
        assert.equal(cleanDiagnostics('text'), null);
        assert.equal(cleanDiagnostics([1, 2]), null);
        assert.equal(cleanDiagnostics({ batteryMv: -5 }), null);
    });
});
