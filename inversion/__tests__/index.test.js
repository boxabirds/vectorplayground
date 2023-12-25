const MatrixComponent = require('../matrix-component.js'); // Update with the actual path

describe('convertDecimalToFraction', () => {
  let component;

  beforeEach(() => {
    // Initialize the MatrixComponent before each test
    component = new MatrixComponent();
  });

  test('converts 1.0 to 1', () => {
    expect(component.convertDecimalToFraction(1.0)).toEqual([1, 1]);
  });

  test('converts 0.1 to 1/10', () => {
    expect(component.convertDecimalToFraction(0.1)).toEqual([1, 10]);
  });

  test('converts -9 to -9', () => {
    expect(component.convertDecimalToFraction(-9)).toEqual([-9, 1]);
  });

  test('converts -0.4 to -2/5', () => {
    expect(component.convertDecimalToFraction(-0.4)).toEqual([-2, 5]);
  });

  test('converts 0.333333333 approximately to 1/3', () => {
    const result = component.convertDecimalToFraction(0.333333333);
    expect(result[0] / result[1]).toBeCloseTo(1 / 3);
  });

  test('converts 0.125 to 1/8', () => {
    expect(component.convertDecimalToFraction(0.125)).toEqual([1, 8]);
  });

  // Add additional tests as needed
});
