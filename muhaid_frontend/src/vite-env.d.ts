/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Muhaid API base URL, e.g. http://localhost:3000. No /api prefix. */
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
