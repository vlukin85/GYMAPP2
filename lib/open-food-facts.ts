export type OpenFoodFactsProduct = {
  name: string;
  barcode: string;
  kcalPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
};

type OpenFoodFactsResponse = {
  status?: number;
  product?: {
    product_name?: unknown;
    product_name_ru?: unknown;
    nutriments?: Record<string, unknown>;
  };
};

function nonNegativeNumber(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 10) / 10 : 0;
}

export function mapOpenFoodFactsProduct(barcode: string, payload: OpenFoodFactsResponse): OpenFoodFactsProduct | null {
  const product = payload.product;
  const name = typeof product?.product_name_ru === "string" && product.product_name_ru.trim() ? product.product_name_ru.trim() : typeof product?.product_name === "string" ? product.product_name.trim() : "";
  if (payload.status !== 1 || !name) return null;
  const nutriments = product?.nutriments ?? {};
  return {
    name,
    barcode,
    kcalPer100g: nonNegativeNumber(nutriments["energy-kcal_100g"]),
    proteinPer100g: nonNegativeNumber(nutriments.proteins_100g),
    fatPer100g: nonNegativeNumber(nutriments.fat_100g),
    carbsPer100g: nonNegativeNumber(nutriments.carbohydrates_100g),
  };
}

export async function lookupOpenFoodFactsProduct(barcode: string) {
  const normalizedBarcode = barcode.replace(/\s/g, "");
  const fields = "product_name,product_name_ru,nutriments";
  const response = await fetch(`https://world.openfoodfacts.net/api/v2/product/${encodeURIComponent(normalizedBarcode)}?fields=${fields}`);
  if (!response.ok) throw new Error(`Open Food Facts returned ${response.status}`);
  return mapOpenFoodFactsProduct(normalizedBarcode, await response.json() as OpenFoodFactsResponse);
}
