#include "globals.h"

void calibrateSensor() {
  Serial.println("Starting Calibration Mode (20 Seconds)...");
  
  float maxDetectedDistance = 0;
  unsigned long startTime = millis();
  
  while (millis() - startTime < 20000) {
    long microsec = ultrasonic.timing();
    float currentDist = ultrasonic.convert(microsec, Ultrasonic::CM);
    
    // filter out invalid readings
    if (currentDist > 0 && currentDist < 400) {
      if (currentDist > maxDetectedDistance) {
        maxDetectedDistance = currentDist;
      }
      Serial.print("."); 
    }
    delay(100);
  }
  
  Serial.println("\nCalibration Finished.");
  Serial.print("Max Bin Depth detected: ");
  Serial.print(maxDetectedDistance);
  Serial.println(" cm");

  // prevent zero or negative depth
  if (maxDetectedDistance <= 0) {
    maxDetectedDistance = 100.0; 
  }

  binDepth = (int)maxDetectedDistance; 
  saveBinDepth(binDepth); // Save to preferences
}

int getFillLevel() {
  long microsec = ultrasonic.timing();
  float currentDist = ultrasonic.convert(microsec, Ultrasonic::CM);
  
  if (currentDist <= 0 || currentDist > 400) return fillLevel; 
  
  distance = currentDist; 

  float fullThreshold = binDepth * 0.10; // upper 10% of the bin depth
  float emptyThreshold = binDepth;     // full bin depth
  float effectiveRange = emptyThreshold - fullThreshold; // the range in which we measure (e.g., 90% of the bin)

  // the distance we've traveled from the bottom of the bin upwards (approximately)
  // the smaller currentDist is, the more full the bin is
  float fillAmount = binDepth - currentDist; 

  // normalization to percentage relative to the effective range
  // if fillAmount is 0 (empty bin), the result is 0%.
  // if currentDist reached fullThreshold, then fillAmount equals effectiveRange and the result is 100%.
  int percentage = (int)((fillAmount / effectiveRange) * 100);
  
  // clamp percentage between 0 and 100
  if (percentage > 100) percentage = 100;
  if (percentage < 0) percentage = 0;

  return percentage;
}