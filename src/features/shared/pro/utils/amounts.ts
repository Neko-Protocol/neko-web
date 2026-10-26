/**
 * USDC and the vault tokens both use 7 decimals. Contracts count base units;
 * people read whole dollars. Conversions stay in bigint so an amount never
 * goes through a float on its way to the ledger (mirrors `packages/stellar`
 * `amounts.ts` in the tokenization repo).
 */
export const USDC_DECIMALS = 7;

const SCALE = 10n ** BigInt(USDC_DECIMALS);

/** Whole USDC (number or decimal string) to base units; extra decimals are cut. */
export function toUnits(value: number | string): bigint {
  const text = typeof value === "number" ? value.toFixed(USDC_DECIMALS) : value;
  const trimmed = text.trim().replace(/,/g, "");
  if (!/^\d*(\.\d*)?$/.test(trimmed) || trimmed === "" || trimmed === ".") {
    throw new Error(`Not an amount: ${value}`);
  }
  const [whole = "0", fraction = ""] = trimmed.split(".");
  return (
    BigInt(whole || "0") * SCALE +
    BigInt(fraction.slice(0, USDC_DECIMALS).padEnd(USDC_DECIMALS, "0"))
  );
}

/** Base units to whole USDC, as a number for display only. */
export function fromUnits(units: bigint): number {
  const negative = units < 0n;
  const abs = negative ? -units : units;
  const result = Number(abs / SCALE) + Number(abs % SCALE) / Number(SCALE);
  return negative ? -result : result;
}
