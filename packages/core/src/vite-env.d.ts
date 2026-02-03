/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_ENABLE_BILLING: string
  readonly VITE_APP_MODE: string
  readonly VITE_ENABLE_PREMIUM: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
