import type { SerialAssignmentItemInput, SerialCandidate } from "../components/AcceptOrderSerialModal";

function normalizeSerialEntries(raw: any): SerialCandidate[] {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.serial_numbers)
      ? raw.serial_numbers
      : [];

  const result: SerialCandidate[] = [];
  for (const entry of list) {
    if (!entry) continue;
    if (typeof entry === "string") {
      const val = entry.trim();
      if (val) result.push({ id: val, name: val, status: "AVAILABLE" });
      continue;
    }
    const id = String(entry.id || entry.name || "").trim();
    const name = String(entry.name || entry.serial || entry.serial_no || entry.id || "").trim();
    const status = entry.status ? String(entry.status).toUpperCase() : "AVAILABLE";
    if (!id || !name) continue;
    if (status === "AVAILABLE") {
      result.push({ id, name, status });
    }
  }
  return result;
}

function dedupeSerials(list: SerialCandidate[]): SerialCandidate[] {
  const seen = new Set<string>();
  const out: SerialCandidate[] = [];
  for (const s of list) {
    const key = `${s.id}::${s.name}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(s);
    }
  }
  return out;
}

export function extractAvailableSerials(
  product: any,
  variantId?: string | null,
  batchId?: string | null
): SerialCandidate[] {
  if (!product) return [];

  const variants: any[] = product.variants || product.variant_infos || [];
  const productBatches: any[] = product.batches || product.batch_infos || [];

  if (variantId) {
    const matchedVariant = variants.find((v) => String(v.id) === String(variantId));
    if (matchedVariant) {
      const variantBatches: any[] = matchedVariant.batches || matchedVariant.batch_infos || [];
      if (batchId) {
        const matchedBatch = variantBatches.find((b) => String(b.id) === String(batchId));
        if (matchedBatch) {
          return dedupeSerials([
            ...normalizeSerialEntries(matchedBatch.serialno_infos),
            ...normalizeSerialEntries(matchedBatch.serial_numbers),
          ]);
        }
      }
      const fromVariantBatches = variantBatches.flatMap((b) => [
        ...normalizeSerialEntries(b.serialno_infos),
        ...normalizeSerialEntries(b.serial_numbers),
      ]);
      return dedupeSerials([
        ...normalizeSerialEntries(matchedVariant.serialno_infos),
        ...normalizeSerialEntries(matchedVariant.serial_numbers),
        ...fromVariantBatches,
      ]);
    }
  }

  if (batchId) {
    const matchedBatch = productBatches.find((b) => String(b.id) === String(batchId));
    if (matchedBatch) {
      return dedupeSerials([
        ...normalizeSerialEntries(matchedBatch.serialno_infos),
        ...normalizeSerialEntries(matchedBatch.serial_numbers),
      ]);
    }
  }

  const fromProductBatches = productBatches.flatMap((b) => [
    ...normalizeSerialEntries(b.serialno_infos),
    ...normalizeSerialEntries(b.serial_numbers),
  ]);

  return dedupeSerials([
    ...normalizeSerialEntries(product.serialno_infos),
    ...normalizeSerialEntries(product.serial_numbers),
    ...fromProductBatches,
  ]);
}

export function buildSerialAssignmentItems(
  orderItems: any[],
  productsById: Record<string, any>
): SerialAssignmentItemInput[] {
  const result: SerialAssignmentItemInput[] = [];

  (orderItems || []).forEach((item, idx) => {
    const existingSerials = item.serialno_infos || item.serial_numbers || [];
    if (Array.isArray(existingSerials) && existingSerials.length > 0) {
      return;
    }

    const productId = String(item.product_id || "");
    if (!productId) return;

    const product = productsById[productId];
    const isSerialProduct = Boolean(
      product?.type_infos?.has_serialno || item.has_serialno
    );
    if (!isSerialProduct) return;

    const qty = Math.max(1, Math.round(Number(item.quantity ?? item.qty ?? 1)));
    const variantId = item.variant_id || undefined;
    const batchId = item.batch_id || undefined;
    const availableSerials = extractAvailableSerials(product, variantId, batchId);

    const variantLabel =
      item.variant_name ||
      item.variant ||
      (typeof item.additional_infos?.variant_name === "string"
        ? item.additional_infos.variant_name
        : undefined);

    result.push({
      key: String(item.id || `${productId}-${variantId || ""}-${batchId || ""}-${idx}`),
      orderItemId: item.id ? String(item.id) : undefined,
      productId,
      variantId,
      batchId,
      name: String(item.name || product?.name || "Item"),
      variantLabel,
      quantity: qty,
      availableSerials,
    });
  });

  return result;
}

