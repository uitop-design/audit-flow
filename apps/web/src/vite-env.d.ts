/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API origin, e.g. `http://localhost:3000`. Empty (default) means same origin via the dev proxy or nginx. */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
