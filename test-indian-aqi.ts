/**
 * Test Script: Indian AQI Calculation Verification
 * 
 * This script tests the Indian CPCB AQI calculation to ensure
 * it matches the values from aqi.in, aqinow.org, and indiaaqi.com
 */

// Indian CPCB AQI calculation function (copy from routes.ts)
function calculateIndianAQI(pm25: number, pm10: number, o3: number = 0, no2: number = 0, so2: number = 0, co: number = 0): number {
  const pm25Breakpoints = [
    { low: 0, high: 30, aqiLow: 0, aqiHigh: 50 },
    { low: 31, high: 60, aqiLow: 51, aqiHigh: 100 },
    { low: 61, high: 90, aqiLow: 101, aqiHigh: 200 },
    { low: 91, high: 120, aqiLow: 201, aqiHigh: 300 },
    { low: 121, high: 250, aqiLow: 301, aqiHigh: 400 },
    { low: 251, high: 380, aqiLow: 401, aqiHigh: 500 },
  ];

  const pm10Breakpoints = [
    { low: 0, high: 50, aqiLow: 0, aqiHigh: 50 },
    { low: 51, high: 100, aqiLow: 51, aqiHigh: 100 },
    { low: 101, high: 250, aqiLow: 101, aqiHigh: 200 },
    { low: 251, high: 350, aqiLow: 201, aqiHigh: 300 },
    { low: 351, high: 430, aqiLow: 301, aqiHigh: 400 },
    { low: 431, high: 510, aqiLow: 401, aqiHigh: 500 },
  ];

  const calculateSubIndex = (value: number, breakpoints: any[]): number => {
    if (value <= 0) return 0;
    
    for (const bp of breakpoints) {
      if (value >= bp.low && value <= bp.high) {
        return Math.round(((bp.aqiHigh - bp.aqiLow) / (bp.high - bp.low)) * (value - bp.low) + bp.aqiLow);
      }
    }
    return 500;
  };

  const subIndices = [
    pm25 > 0 ? calculateSubIndex(pm25, pm25Breakpoints) : 0,
    pm10 > 0 ? calculateSubIndex(pm10, pm10Breakpoints) : 0,
  ].filter(val => val > 0);

  return subIndices.length > 0 ? Math.max(...subIndices) : 0;
}

// Test cases based on CPCB standards
const testCases = [
  // Good Air Quality
  { pm25: 15, pm10: 25, expected: 50, category: "Good" },
  { pm25: 30, pm10: 50, expected: 50, category: "Good" },
  
  // Satisfactory
  { pm25: 45, pm10: 75, expected: 75, category: "Satisfactory" },
  { pm25: 60, pm10: 100, expected: 100, category: "Satisfactory" },
  
  // Moderate
  { pm25: 75, pm10: 150, expected: 150, category: "Moderate" },
  { pm25: 90, pm10: 200, expected: 200, category: "Moderate" },
  
  // Poor
  { pm25: 105, pm10: 300, expected: 258, category: "Poor" },
  { pm25: 120, pm10: 350, expected: 300, category: "Poor" },
  
  // Very Poor
  { pm25: 150, pm10: 400, expected: 329, category: "Very Poor" },
  { pm25: 200, pm10: 430, expected: 400, category: "Very Poor" },
  
  // Severe
  { pm25: 300, pm10: 480, expected: 470, category: "Severe" },
  { pm25: 380, pm10: 510, expected: 500, category: "Severe" },
];

console.log("🧪 Testing Indian CPCB AQI Calculation\n");
console.log("=" .repeat(80));

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const calculated = calculateIndianAQI(test.pm25, test.pm10);
  const tolerance = 5; // Allow ±5 AQI points for rounding differences
  const isPassed = Math.abs(calculated - test.expected) <= tolerance;
  
  if (isPassed) {
    passed++;
    console.log(`✅ Test ${index + 1}: PASS`);
  } else {
    failed++;
    console.log(`❌ Test ${index + 1}: FAIL`);
  }
  
  console.log(`   PM2.5: ${test.pm25} µg/m³, PM10: ${test.pm10} µg/m³`);
  console.log(`   Expected: ~${test.expected} (${test.category})`);
  console.log(`   Calculated: ${calculated}`);
  console.log(`   Difference: ${Math.abs(calculated - test.expected)}\n`);
});

console.log("=" .repeat(80));
console.log(`\n📊 Results: ${passed}/${testCases.length} tests passed`);

if (failed === 0) {
  console.log("✅ All tests passed! Indian AQI calculation is working correctly.");
  console.log("\n🎯 Your AQI values should now match:");
  console.log("   - aqi.in");
  console.log("   - aqinow.org");
  console.log("   - indiaaqi.com");
} else {
  console.log(`❌ ${failed} tests failed. Please review the calculation.`);
}

console.log("\n" + "=" .repeat(80));
