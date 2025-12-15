/**
 * Tests for waste unit conversions and data transformations
 */

// Unit conversion definitions (must match HomeScreen.tsx)
const UNIT_CONVERSIONS: Record<string, { labelKey: string; grams: number }[]> = {
  PLASTIC: [
    { labelKey: 'plasticBottle', grams: 25 },
    { labelKey: 'plasticBag', grams: 5 },
    { labelKey: 'plasticCup', grams: 3 },
  ],
  PAPER: [
    { labelKey: 'paperSheet', grams: 5 },
    { labelKey: 'notebook', grams: 80 },
  ],
  GLASS: [
    { labelKey: 'glassBottle', grams: 200 },
    { labelKey: 'glassJar', grams: 150 },
  ],
  METAL: [
    { labelKey: 'aluminumCan', grams: 15 },
    { labelKey: 'metalSpoon', grams: 30 },
  ],
  ELECTRONIC: [
    { labelKey: 'phoneCharger', grams: 100 },
    { labelKey: 'usbCable', grams: 30 },
  ],
  'OIL&FATS': [
    { labelKey: 'cookingOil', grams: 14 },
    { labelKey: 'butterWrapper', grams: 1 },
  ],
  ORGANIC: [
    { labelKey: 'bananaPeel', grams: 25 },
    { labelKey: 'appleCore', grams: 20 },
    { labelKey: 'foodScraps', grams: 50 },
  ],
};

// Helper function to calculate grams from unit
const calculateGramsFromUnit = (
  wasteType: string,
  unitLabelKey: string,
  count: number
): number => {
  const units = UNIT_CONVERSIONS[wasteType];
  if (!units) return 0;
  
  const unit = units.find(u => u.labelKey === unitLabelKey);
  if (!unit) return 0;
  
  return unit.grams * count;
};

// Helper function to convert grams to kg for chart display
const gramsToKg = (grams: number): number => {
  return grams / 1000;
};

describe('Waste Unit Conversions', () => {
  describe('UNIT_CONVERSIONS structure', () => {
    it('should have all 7 waste types defined', () => {
      const expectedTypes = ['PLASTIC', 'PAPER', 'GLASS', 'METAL', 'ELECTRONIC', 'OIL&FATS', 'ORGANIC'];
      
      expectedTypes.forEach(type => {
        expect(UNIT_CONVERSIONS[type]).toBeDefined();
        expect(Array.isArray(UNIT_CONVERSIONS[type])).toBe(true);
        expect(UNIT_CONVERSIONS[type].length).toBeGreaterThan(0);
      });
    });

    it('should have valid gram values for all units', () => {
      Object.values(UNIT_CONVERSIONS).forEach(units => {
        units.forEach(unit => {
          expect(unit.grams).toBeGreaterThan(0);
          expect(typeof unit.labelKey).toBe('string');
          expect(unit.labelKey.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('calculateGramsFromUnit', () => {
    it('should calculate plastic bottle grams correctly', () => {
      expect(calculateGramsFromUnit('PLASTIC', 'plasticBottle', 1)).toBe(25);
      expect(calculateGramsFromUnit('PLASTIC', 'plasticBottle', 4)).toBe(100);
      expect(calculateGramsFromUnit('PLASTIC', 'plasticBottle', 10)).toBe(250);
    });

    it('should calculate plastic bag grams correctly', () => {
      expect(calculateGramsFromUnit('PLASTIC', 'plasticBag', 1)).toBe(5);
      expect(calculateGramsFromUnit('PLASTIC', 'plasticBag', 20)).toBe(100);
    });

    it('should calculate glass bottle grams correctly', () => {
      expect(calculateGramsFromUnit('GLASS', 'glassBottle', 1)).toBe(200);
      expect(calculateGramsFromUnit('GLASS', 'glassBottle', 5)).toBe(1000);
    });

    it('should calculate glass jar grams correctly', () => {
      expect(calculateGramsFromUnit('GLASS', 'glassJar', 2)).toBe(300);
    });

    it('should calculate paper items correctly', () => {
      expect(calculateGramsFromUnit('PAPER', 'paperSheet', 100)).toBe(500);
      expect(calculateGramsFromUnit('PAPER', 'notebook', 1)).toBe(80);
    });

    it('should calculate metal items correctly', () => {
      expect(calculateGramsFromUnit('METAL', 'aluminumCan', 10)).toBe(150);
      expect(calculateGramsFromUnit('METAL', 'metalSpoon', 3)).toBe(90);
    });

    it('should calculate electronic items correctly', () => {
      expect(calculateGramsFromUnit('ELECTRONIC', 'phoneCharger', 2)).toBe(200);
      expect(calculateGramsFromUnit('ELECTRONIC', 'usbCable', 5)).toBe(150);
    });

    it('should calculate oil & fats items correctly', () => {
      expect(calculateGramsFromUnit('OIL&FATS', 'cookingOil', 10)).toBe(140);
      expect(calculateGramsFromUnit('OIL&FATS', 'butterWrapper', 50)).toBe(50);
    });

    it('should calculate organic items correctly', () => {
      expect(calculateGramsFromUnit('ORGANIC', 'bananaPeel', 4)).toBe(100);
      expect(calculateGramsFromUnit('ORGANIC', 'appleCore', 5)).toBe(100);
      expect(calculateGramsFromUnit('ORGANIC', 'foodScraps', 2)).toBe(100);
    });

    it('should return 0 for invalid waste type', () => {
      expect(calculateGramsFromUnit('INVALID', 'plasticBottle', 5)).toBe(0);
    });

    it('should return 0 for invalid unit labelKey', () => {
      expect(calculateGramsFromUnit('PLASTIC', 'invalidUnit', 5)).toBe(0);
    });

    it('should handle zero count', () => {
      expect(calculateGramsFromUnit('PLASTIC', 'plasticBottle', 0)).toBe(0);
    });
  });

  describe('gramsToKg (Chart Display Conversion)', () => {
    it('should convert grams to kg correctly', () => {
      expect(gramsToKg(1000)).toBe(1);
      expect(gramsToKg(500)).toBe(0.5);
      expect(gramsToKg(100)).toBe(0.1);
      expect(gramsToKg(2500)).toBe(2.5);
    });

    it('should handle small amounts', () => {
      expect(gramsToKg(25)).toBe(0.025);
      expect(gramsToKg(5)).toBe(0.005);
      expect(gramsToKg(1)).toBe(0.001);
    });

    it('should handle zero', () => {
      expect(gramsToKg(0)).toBe(0);
    });

    it('should handle large amounts', () => {
      expect(gramsToKg(10000)).toBe(10);
      expect(gramsToKg(50000)).toBe(50);
    });
  });

  describe('Warning Thresholds', () => {
    const WARNING_THRESHOLD = 500;
    const MAX_LIMIT = 5000;

    it('should identify amounts needing warning (>500g)', () => {
      expect(600 > WARNING_THRESHOLD).toBe(true);
      expect(1000 > WARNING_THRESHOLD).toBe(true);
      expect(500 > WARNING_THRESHOLD).toBe(false);
      expect(499 > WARNING_THRESHOLD).toBe(false);
    });

    it('should identify amounts exceeding max limit (>5000g)', () => {
      expect(5001 > MAX_LIMIT).toBe(true);
      expect(6000 > MAX_LIMIT).toBe(true);
      expect(5000 > MAX_LIMIT).toBe(false);
      expect(4999 > MAX_LIMIT).toBe(false);
    });

    it('should calculate when unit selections exceed warning', () => {
      // 21 plastic bottles = 21 * 25g = 525g (warning)
      expect(calculateGramsFromUnit('PLASTIC', 'plasticBottle', 21)).toBe(525);
      expect(525 > WARNING_THRESHOLD).toBe(true);

      // 3 glass bottles = 3 * 200g = 600g (warning)
      expect(calculateGramsFromUnit('GLASS', 'glassBottle', 3)).toBe(600);
      expect(600 > WARNING_THRESHOLD).toBe(true);
    });

    it('should calculate when unit selections exceed max limit', () => {
      // 201 plastic bottles = 201 * 25g = 5025g (max exceeded)
      expect(calculateGramsFromUnit('PLASTIC', 'plasticBottle', 201)).toBe(5025);
      expect(5025 > MAX_LIMIT).toBe(true);

      // 26 glass bottles = 26 * 200g = 5200g (max exceeded)
      expect(calculateGramsFromUnit('GLASS', 'glassBottle', 26)).toBe(5200);
      expect(5200 > MAX_LIMIT).toBe(true);
    });
  });
});

describe('Chart Data Transformation', () => {
  // Simulate what HomeScreen does with filteredData
  const transformWasteDataForChart = (wasteData: { waste_type: string; total_amount: number }[]) => {
    return wasteData.map(item => ({
      label: item.waste_type,
      value: gramsToKg(item.total_amount), // Convert to kg
    }));
  };

  it('should transform backend data correctly for chart', () => {
    const backendData = [
      { waste_type: 'PLASTIC', total_amount: 1000 },
      { waste_type: 'PAPER', total_amount: 500 },
      { waste_type: 'GLASS', total_amount: 2500 },
    ];

    const chartData = transformWasteDataForChart(backendData);

    expect(chartData).toEqual([
      { label: 'PLASTIC', value: 1 },    // 1000g = 1kg
      { label: 'PAPER', value: 0.5 },    // 500g = 0.5kg
      { label: 'GLASS', value: 2.5 },    // 2500g = 2.5kg
    ]);
  });

  it('should handle empty data', () => {
    const chartData = transformWasteDataForChart([]);
    expect(chartData).toEqual([]);
  });

  it('should handle zero amounts', () => {
    const backendData = [
      { waste_type: 'PLASTIC', total_amount: 0 },
    ];

    const chartData = transformWasteDataForChart(backendData);
    expect(chartData[0].value).toBe(0);
  });
});

