import { FormErrors } from "@/types/expense";

/**
 * Validates an expense amount string.
 * Req 2.2, 2.4: must be non-empty, numeric, and greater than zero.
 */
export function validateAmount(value: string): string | undefined {
  if (!value || value.trim() === "") {
    return "Amount is required.";
  }
  const num = Number(value);
  if (isNaN(num)) {
    return "Amount must be a valid number.";
  }
  if (num <= 0) {
    return "Amount must be greater than zero.";
  }
  return undefined;
}

/**
 * Validates an expense date string.
 * Req 2.3, 2.5: must be non-empty and a valid calendar date.
 */
export function validateDate(value: string): string | undefined {
  if (!value || value.trim() === "") {
    return "Date is required.";
  }
  // Ensure the string is a valid calendar date (rejects e.g. Feb 30)
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return "Date must be a valid calendar date.";
  }
  // Cross-check parsed date against input to catch out-of-range dates
  // Input is expected as YYYY-MM-DD
  const [year, month, day] = value.split("-").map(Number);
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    return "Date must be a valid calendar date.";
  }
  return undefined;
}

/**
 * Runs both validations and returns a FormErrors object.
 * Req 2.2 – 2.5
 */
export function validateExpense(amount: string, date: string): FormErrors {
  const errors: FormErrors = {};
  const amountError = validateAmount(amount);
  if (amountError) errors.amount = amountError;
  const dateError = validateDate(date);
  if (dateError) errors.date = dateError;
  return errors;
}
