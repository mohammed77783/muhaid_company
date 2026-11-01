// jsdom has no IndexedDB or structuredClone; Dexie (via fake-indexeddb) needs both.
import 'fake-indexeddb/auto';

// Good enough for tests: values are kept by reference, which also keeps jsdom Blobs intact.
globalThis.structuredClone ??= <T>(value: T): T => value;
