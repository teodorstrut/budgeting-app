/**
 * Builds a parameterized "col = ?, col2 = ?" SET clause + matching values array
 * from a partial patch object, skipping undefined fields. Used by repository
 * `update()` methods that support partial updates.
 */
export const buildSetClause = (patch: Record<string, unknown>): { clause: string; values: unknown[] } => {
  const fields: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    fields.push(`${key} = ?`);
    values.push(value);
  }

  return { clause: fields.join(', '), values };
};
