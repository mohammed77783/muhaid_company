// Every template item answered exactly once: the "all 5 answered" rule the
// database can't express.
export function answerMismatch(answerItemIds: string[], itemIds: string[]) {
  const answered = new Set(answerItemIds);
  const expected = new Set(itemIds);
  const missing = itemIds.filter((id) => !answered.has(id));
  const unknown = answerItemIds.filter((id) => !expected.has(id));
  return missing.length || unknown.length ? { missing, unknown } : null;
}
