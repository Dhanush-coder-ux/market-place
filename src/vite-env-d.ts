/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SYNCFUSION_LICENSE_KEY: string;
}

export interface ImportMeta {
  readonly env: ImportMetaEnv;
}
