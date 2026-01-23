// Define the shape that the utility expects
interface KeyValuePair {
  key: string;
  value: string;
}

/**
 * Transforms an array of Key/Value objects into a single JSON object.
 * Filters out items with empty keys.
 * * Example: [{ key: "Color", value: "Red" }] => { "Color": "Red" }
 */
export const arrayToRecord = (fields: KeyValuePair[]): Record<string, string> => {
  return fields.reduce((acc, field) => {
    const cleanKey = field.key.trim();
    if (cleanKey) {
      acc[cleanKey] = field.value;
    }
    return acc;
  }, {} as Record<string, string>);
};

/**
 * Transforms a JSON object back into an array of Key/Value objects.
 * Useful for initializing the form when editing existing data.
 * * Example: { "Color": "Red" } => [{ key: "Color", value: "Red" }]
 */
export const recordToArray = (record: Record<string, string>): KeyValuePair[] => {
  if (!record) return [];
  return Object.entries(record).map(([key, value]) => ({
    key,
    value,
  }));
};