// Feature: dark-expense-tracker, Property 3: Amount validation rejects non-positive values
import * as fc from "fast-check";
import { validateAmount } from "../lib/validateExpense";

/**
 * Validates: Requirements 2.2, 2.4
 */
describe("validateAmount", () => {
  it("Property 3: Amount validation rejects non-positive values", () => {
    const validArbitrary = fc.float({ min: Math.fround(0.01), noNaN: true });
    const invalidArbitrary = fc.oneof(
      fc.constant(0),
      fc.float({ max: Math.fround(0), noNaN: true }),
      fc.string()
    );

    fc.assert(
      fc.property(validArbitrary, invalidArbitrary, (valid, invalid) => {
        const validResult = validateAmount(String(valid));
        const invalidResult = validateAmount(String(invalid));
        return (
          validResult === undefined &&
          typeof invalidResult === "string" &&
          invalidResult.length > 0
        );
      }),
      { numRuns: 100 }
    );
  });
});
