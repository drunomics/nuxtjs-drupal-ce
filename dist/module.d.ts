import * as _nuxt_schema from '@nuxt/schema';

// Define the type for the runtime-config,.
// see https://nuxt.com/docs/guide/going-further/runtime-config#manually-typing-runtime-config
declare module 'nuxt/schema' {
  interface PublicRuntimeConfig {
    drupalCe: ModuleOptions,
  }
}

type UseFetchOptions<DataT> = {
  key?: string
  method?: string
  query?: SearchParams
  params?: SearchParams
  body?: RequestInit['body'] | Record<string, any>
  headers?: Record<string, string> | [key: string, value: string][] | Headers
  baseURL?: string
  server?: boolean
  lazy?: boolean
  immediate?: boolean
  getCachedData?: (key: string, nuxtApp: NuxtApp) => DataT
  deep?: boolean
  dedupe?: 'cancel' | 'defer'
  default?: () => DataT
  transform?: (input: DataT) => DataT | Promise<DataT>
  pick?: string[]
  watch?: WatchSource[] | false,
  credentials?: string
}

interface ModuleOptions {
    drupalBaseUrl: string;
    serverDrupalBaseUrl?: string;
    ceApiEndpoint: string;
    menuEndpoint: string;
    menuBaseUrl?: string;
    addRequestContentFormat?: string;
    addRequestFormat: boolean;
    customErrorPages: boolean;
    fetchOptions: UseFetchOptions<any>;
    fetchProxyHeaders: string[];
    useLocalizedMenuEndpoint: boolean;
    serverApiProxy: boolean;
    passThroughHeaders?: string[];
    exposeAPIRouteRules?: boolean;
}
declare const _default: _nuxt_schema.NuxtModule<ModuleOptions>;

export { type ModuleOptions, _default as default };
