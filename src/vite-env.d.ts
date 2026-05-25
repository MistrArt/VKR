/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_YANDEX_MAPS_API_KEY: string;
  readonly VITE_YANDEX_SUGGEST_API_KEY?: string;
  readonly VITE_YANDEX_GEOCODER_API_KEY?: string;
  /** true — HTTP к гео-API через /api/geo/* (прокси на бэкенде, см. docs/geo-proxy-spring.md) */
  readonly VITE_YANDEX_GEO_PROXY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
