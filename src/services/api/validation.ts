export function validateMandatory(data: Record<string, any>, requiredFields: string[]): void {
  const missingFields = requiredFields.filter(field => {
    // Check if undefined, null, or empty string (for strings)
    const value = data[field];
    if (value === undefined || value === null) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    return false;
  });

  if (missingFields.length > 0) {
    throw new Error(`Missing mandatory fields: ${missingFields.join(', ')}`);
  }
}
