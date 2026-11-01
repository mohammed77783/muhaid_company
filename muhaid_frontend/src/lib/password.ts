const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

/** A random password an admin can pass on, without characters that read alike (l, 1, O, 0). */
export function generatePassword(length = 14): string {
  // Whole multiples of the alphabet only, so no character is more likely than another.
  const limit = 256 - (256 % ALPHABET.length);
  let out = '';
  while (out.length < length) {
    for (const byte of crypto.getRandomValues(new Uint8Array(length))) {
      if (byte < limit && out.length < length) {
        out += ALPHABET[byte % ALPHABET.length];
      }
    }
  }
  return out;
}
