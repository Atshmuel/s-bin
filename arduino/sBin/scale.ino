#include "globals.h"

// הגדרת הפינים של ה-HX711 
const int HX711_dout = 19;
const int HX711_sck = 18;

HX711_ADC LoadCell(HX711_dout, HX711_sck);

//Factor for kilogram conversion.
const float CALIBRATION_FACTOR = 1.0; 
const float WEIGHT_THRESHOLD = 10.0; 


unsigned long t = 0;

void scaleSetup() {
  Serial.begin(115200); 
  delay(10);
  Serial.println();
  Serial.println("Starting sBin scale...");

  LoadCell.begin();
  
  unsigned long stabilizingtime = 2000; 
  
  // ביצוע Tare אוטומטי - המערכת מניחה שהפח ריק כרגע
  boolean _tare = true; 
  
  LoadCell.start(stabilizingtime, _tare);
  
  if (LoadCell.getTareTimeoutFlag() || LoadCell.getSignalTimeoutFlag()) {
    Serial.println("Timeout, check MCU>HX711 wiring and pin designations");

  }
  else {
    // טעינת פקטור הכיול הקבוע מראש
    LoadCell.setCalFactor(CALIBRATION_FACTOR); 
    Serial.println("Startup is complete. Ready to measure.");
  }
}

void scaleLoop() {
  static boolean newDataReady = 0;
  const int serialPrintInterval = 1000; // מדפיס נתונים כל שנייה (1000 אלפיות השנייה). שנה לפי הצורך.

  // בודק אם הומרה קריאה חדשה מהחיישן
  if (LoadCell.update()) {
    newDataReady = true;
  }

  // שולף ומדפיס את הערך הנקי בקצב שקבענו
  if (newDataReady) {
    if (millis() > t + serialPrintInterval) {
      currentWeight = LoadCell.getData();
      
      // 1. בדיקה האם יש עלייה של מעל 10 ק"ג מהמשקל האחרון שדווח
      if (currentWeight - lastReportedWeight >= WEIGHT_THRESHOLD) {
        Serial.print("Update: Weight increased! Current Weight: ");
        Serial.println(currentWeight);
        
        // מעדכנים את נקודת הייחוס למשקל החדש
        lastReportedWeight = currentWeight; 
      }
      // 2. זיהוי ירידה במשקל (ריקון הפח)
      // אם המשקל צנח ביותר מ-2 קילו, נאפס את נקודת הייחוס שלנו כלפי מטה
      // כדי שהמערכת תהיה מוכנה לזהות את 10 הק"ג הבאים שייזרקו פנימה.
      else if (currentWeight < lastReportedWeight - 2.0) {
        Serial.print("Notice: Weight dropped. New baseline: ");
        Serial.println(currentWeight);
        
        lastReportedWeight = currentWeight;
      }
      
      newDataReady = 0;
      t = millis();
    }
  }
}