const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The API answers 400 to anything else, so a hand-edited URL value is dropped first. */
export function isUuid(value: string | null): value is string {
  return value !== null && UUID.test(value);
}
