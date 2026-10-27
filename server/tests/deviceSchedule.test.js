import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { lastSlotEpoch } from '../utils/deviceSchedule.js';

const local = (epochSeconds, timeZone) => new Intl.DateTimeFormat('en-GB', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
}).format(new Date(epochSeconds * 1000));

describe('lastSlotEpoch', () => {
    test("is the day's last report slot, in local time", () => {
        // Twice a day from 08:00: the last report is at 20:00.
        assert.equal(local(lastSlotEpoch('2026-10-26', 720, 8, 'Asia/Jerusalem'), 'Asia/Jerusalem'), '26/10/2026, 20:00');
        // Every 3 hours from 02:00: 02, 05, ..., 23.
        assert.equal(local(lastSlotEpoch('2026-10-26', 180, 2, 'Asia/Jerusalem'), 'Asia/Jerusalem'), '26/10/2026, 23:00');
        // Once a day at 08:00.
        assert.equal(local(lastSlotEpoch('2026-10-26', 1440, 8, 'Asia/Jerusalem'), 'Asia/Jerusalem'), '26/10/2026, 08:00');
    });
    test('keeps the local hour on a clock-change day', () => {
        // Israel left summer time on 2026-10-25: 20:00 that day is 18:00 UTC.
        assert.equal(new Date(lastSlotEpoch('2026-10-25', 720, 8, 'Asia/Jerusalem') * 1000).toISOString(), '2026-10-25T18:00:00.000Z');
    });
});
