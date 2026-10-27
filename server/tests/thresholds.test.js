import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { batteryLevel, DEFAULT_THRESHOLDS, fullnessLevel, thresholdsOf, thresholdsProblem } from '../utils/thresholds.js';
import { collectionDueAt } from '../utils/analytics.js';

describe('thresholds', () => {
    test('an organization without its own gets the defaults; one it set overrides them', () => {
        assert.deepEqual(thresholdsOf(null), DEFAULT_THRESHOLDS);
        assert.equal(thresholdsOf({ thresholds: { fullnessCritical: 70 } }).fullnessCritical, 70);
        assert.equal(thresholdsOf({ thresholds: { fullnessCritical: 70 } }).fullnessWarning, DEFAULT_THRESHOLDS.fullnessWarning);
    });
    test('warning stays at least 5 on the safe side of critical, each whole and in range', () => {
        assert.equal(thresholdsProblem(DEFAULT_THRESHOLDS), null);
        assert.equal(thresholdsProblem({ ...DEFAULT_THRESHOLDS, fullnessWarning: 75, fullnessCritical: 80 }), null);
        assert.match(thresholdsProblem({ ...DEFAULT_THRESHOLDS, fullnessWarning: 76 }), /fullness warning/);
        assert.match(thresholdsProblem({ ...DEFAULT_THRESHOLDS, batteryWarning: 24 }), /battery warning/);
        assert.match(thresholdsProblem({ ...DEFAULT_THRESHOLDS, fullnessCritical: 101 }), /fullnessCritical/);
        assert.match(thresholdsProblem({ ...DEFAULT_THRESHOLDS, batteryCritical: 10.5 }), /batteryCritical/);
    });
    test('fullness is critical from its cut-off up; a battery from its cut-off down', () => {
        const cutOffs = { ...DEFAULT_THRESHOLDS, fullnessWarning: 40, fullnessCritical: 70 };
        assert.deepEqual([69, 70, 40, 39].map(value => fullnessLevel(value, cutOffs)), ['warning', 'critical', 'warning', 'good']);
        assert.deepEqual([20, 21, 50, 51].map(value => batteryLevel(value, DEFAULT_THRESHOLDS)), ['critical', 'warning', 'warning', 'good']);
        assert.equal(fullnessLevel(null, cutOffs), null);
    });
    test('a bin is due when it reaches its organization\'s critical fullness', () => {
        const now = Date.UTC(2026, 9, 27);
        assert.equal(collectionDueAt(60, 10, now, 70).getTime(), now + 86400000);
        assert.equal(collectionDueAt(70, 10, now, 70).getTime(), now);
        assert.equal(collectionDueAt(60, 10, now).getTime(), now + 2 * 86400000);
    });
});
