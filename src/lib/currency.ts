export const CURRENCIES = [
  { value: "INR", label: "INR", symbol: "₹", locale: "en-IN" },
  { value: "USD", label: "USD", symbol: "$", locale: "en-US" },
  { value: "EUR", label: "EUR", symbol: "€", locale: "en-DE" },
  { value: "GBP", label: "GBP", symbol: "£", locale: "en-GB" },
  { value: "JPY", label: "JPY", symbol: "¥", locale: "ja-JP" },
];

export function formatCurrency(amount: number, currencyCode: string = "INR"): string {
  const currency = CURRENCIES.find((c) => c.value === currencyCode) || CURRENCIES[0];
  
  const formatter = new Intl.NumberFormat(currency.locale, {
    minimumFractionDigits: currencyCode === "JPY" ? 0 : 2,
    maximumFractionDigits: currencyCode === "JPY" ? 0 : 2,
  });

  return `${currency.symbol}${formatter.format(amount)}`;
}
