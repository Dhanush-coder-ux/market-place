const d = { "has_variant": false };
const opt = { "has_variant": false, "has_batch": false, "has_serialno": false, "datas": d };

const get = (key, fallback = "") => opt[key] ?? d[key] ?? fallback;
const hasVariants = !!(get("has_variants", get("has_variant")) || opt.variants?.length > 0 || opt.is_variant);
const hasBatchTracking = !!(get("batch_tracking") || get("has_batch_tracking") || get("has_batch"));

console.log("hasVariants:", hasVariants);
console.log("hasBatchTracking:", hasBatchTracking);

const opt2 = { "has_variant": true, "has_batch": true, "datas": {} };
const d2 = {};
const get2 = (key, fallback = "") => opt2[key] ?? d2[key] ?? fallback;
console.log("hasBatchTracking 2:", !!(get2("batch_tracking") || get2("has_batch_tracking") || get2("has_batch")));
