#include "globals.h"
#include <algorithm>
#include <driver/gpio.h>

// HX711 load-cell amplifier (four cells under the bin). It is powered from DC1,
// which stays on in deep sleep, so it is kept in power-down (SCK high) except
// while measuring: awake it draws about 1.5 mA, far more than the sleeping board.
//
// weight (g) = (raw - zero) / factor. The zero is the empty bin's reading (set
// with the empty-bin calibration); the factor is counts per gram (set with a
// known weight). Both are kept in flash.

namespace {
constexpr uint8_t SCALE_SAMPLES = 7;
// At 10 samples per second a reading takes 100 ms; the first after power-up
// takes about 400 ms to settle.
constexpr uint32_t SCALE_READY_TIMEOUT_MS = 600;
// Samples further apart than this (counts) mean the bin moved or a loose wire.
constexpr int32_t MAX_STABLE_SPREAD_COUNTS = 4000;
// A known weight must move the reading at least this much (counts).
constexpr int32_t MIN_CALIBRATION_DELTA_COUNTS = 2000;
constexpr uint32_t MIN_CALIBRATION_GRAMS = 100;
constexpr uint32_t MAX_CALIBRATION_GRAMS = 200000;

const gpio_num_t SCALE_SCK_GPIO = static_cast<gpio_num_t>(SCALE_SCK_PIN);

void wakeScale() {
    gpio_hold_dis(SCALE_SCK_GPIO);
    pinMode(SCALE_SCK_PIN, OUTPUT);
    digitalWrite(SCALE_SCK_PIN, LOW);  // SCK low powers the HX711 up
}

// One 24-bit conversion, channel A at gain 128 (the 25th pulse selects it).
bool readRawOnce(int32_t& raw) {
    const uint32_t startedAt = millis();
    while (digitalRead(SCALE_DOUT_PIN) == HIGH) {
        if (millis() - startedAt > SCALE_READY_TIMEOUT_MS) {
            return false;
        }
        delay(1);
    }
    uint32_t value = 0;
    // SCK high for more than 60 us powers the HX711 down mid-read.
    noInterrupts();
    for (uint8_t i = 0; i < 25; i++) {
        digitalWrite(SCALE_SCK_PIN, HIGH);
        delayMicroseconds(1);
        if (i < 24) {
            value = (value << 1) | static_cast<uint32_t>(digitalRead(SCALE_DOUT_PIN));
        }
        digitalWrite(SCALE_SCK_PIN, LOW);
        delayMicroseconds(1);
    }
    interrupts();
    // Two's complement, sign-extended from 24 bits.
    raw = static_cast<int32_t>(value << 8) >> 8;
    return true;
}
}

void initializeScale() {
    pinMode(SCALE_DOUT_PIN, INPUT);
    powerDownScale();
}

// SCK held high keeps the HX711 powered down, through deep sleep too.
void powerDownScale() {
    gpio_hold_dis(SCALE_SCK_GPIO);
    pinMode(SCALE_SCK_PIN, OUTPUT);
    digitalWrite(SCALE_SCK_PIN, HIGH);
    delayMicroseconds(100);
    gpio_hold_en(SCALE_SCK_GPIO);
    gpio_deep_sleep_hold_en();
}

bool isScaleCalibrated() {
    return scaleZeroSet && scaleCountsPerGram != 0.0f;
}

// The median of a few samples; false when the HX711 does not answer or the
// samples spread too far to trust.
ScaleResult readScaleRaw(int32_t& raw) {
    wakeScale();
    int32_t samples[SCALE_SAMPLES];
    uint8_t count = 0;
    for (; count < SCALE_SAMPLES; count++) {
        if (!readRawOnce(samples[count])) {
            break;
        }
    }
    powerDownScale();
    if (count < SCALE_SAMPLES) {
        return SCALE_NOT_RESPONDING;
    }
    std::sort(samples, samples + SCALE_SAMPLES);
    // The spread without the lowest and highest sample, which may be spikes;
    // kept for the diagnostics with the median, even when it is too wide.
    const int32_t spread = samples[SCALE_SAMPLES - 2] - samples[1];
    lastScaleSampled = true;
    lastScaleRawCounts = samples[SCALE_SAMPLES / 2];
    lastScaleSpreadCounts = spread;
    if (spread > MAX_STABLE_SPREAD_COUNTS) {
        return SCALE_UNSTABLE;
    }
    raw = samples[SCALE_SAMPLES / 2];
    return SCALE_OK;
}

// The bin's weight in grams; a little below zero (noise) reads as 0.
ScaleResult readWeightGrams(int32_t& grams) {
    int32_t raw = 0;
    const ScaleResult result = readScaleRaw(raw);
    if (result != SCALE_OK) {
        return result;
    }
    const float value = (raw - scaleZero) / scaleCountsPerGram;
    grams = value < 0 ? 0 : static_cast<int32_t>(lroundf(value));
    return SCALE_OK;
}

// The empty bin's reading becomes the zero; the factor stays valid.
ScaleResult zeroScale() {
    int32_t raw = 0;
    const ScaleResult result = readScaleRaw(raw);
    if (result != SCALE_OK) {
        return result;
    }
    scaleZero = raw;
    scaleZeroSet = true;
    preferences.begin("credentials", false);
    preferences.putInt("scaleZero", scaleZero);
    preferences.end();
    Serial.printf("⚖️ Scale zeroed at %ld counts.\n", static_cast<long>(scaleZero));
    return SCALE_OK;
}

// With a known weight in the bin, sets the factor from scratch (replacing the
// old one), then weighs again with it; measuredGrams is that check.
ScaleResult calibrateScale(uint32_t knownGrams, int32_t& measuredGrams) {
    if (knownGrams < MIN_CALIBRATION_GRAMS || knownGrams > MAX_CALIBRATION_GRAMS) {
        return SCALE_INVALID_WEIGHT;
    }
    if (!scaleZeroSet) {
        return SCALE_NOT_ZEROED;
    }
    int32_t raw = 0;
    const ScaleResult result = readScaleRaw(raw);
    if (result != SCALE_OK) {
        return result;
    }
    const int32_t delta = raw - scaleZero;
    if (abs(delta) < MIN_CALIBRATION_DELTA_COUNTS) {
        return SCALE_NO_LOAD_CHANGE;
    }
    const float factor = static_cast<float>(delta) / static_cast<float>(knownGrams);
    // A second, separate reading weighs the known weight with the new factor;
    // only then is the factor saved.
    int32_t checkRaw = 0;
    const ScaleResult check = readScaleRaw(checkRaw);
    if (check != SCALE_OK) {
        return check;
    }
    measuredGrams = static_cast<int32_t>(lroundf((checkRaw - scaleZero) / factor));
    scaleCountsPerGram = factor;
    preferences.begin("credentials", false);
    preferences.putFloat("scaleFactor", scaleCountsPerGram);
    preferences.end();
    Serial.printf("⚖️ Scale factor set to %.3f counts per gram; %lu g reads as %ld g.\n",
                  scaleCountsPerGram, static_cast<unsigned long>(knownGrams), static_cast<long>(measuredGrams));
    return SCALE_OK;
}

const char* scaleResultCode(ScaleResult result) {
    switch (result) {
        case SCALE_NOT_RESPONDING: return "scale_not_responding";
        case SCALE_UNSTABLE: return "scale_unstable";
        case SCALE_NOT_ZEROED: return "scale_not_zeroed";
        case SCALE_NO_LOAD_CHANGE: return "scale_no_load_change";
        case SCALE_INVALID_WEIGHT: return "scale_invalid_weight";
        default: return "scale_ok";
    }
}
