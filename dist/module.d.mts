import * as _nuxt_schema from '@nuxt/schema';

interface ModuleOptions {
    drupalBaseUrl: string;
    serverDrupalBaseUrl?: string;
    ceApiEndpoint: string;
    menuEndpoint: string;
    menuBaseUrl?: string;
    addRequestContentFormat?: string;
    addRequestFormat: boolean;
    customErrorPages: boolean;
    customElementJsonFormat: 'explicit' | 'legacy';
    fetchOptions: object;
    fetchProxyHeaders: string[];
    useLocalizedMenuEndpoint: boolean;
    serverApiProxy: boolean;
    passThroughHeaders?: string[];
    exposeAPIRouteRules?: boolean;
    serverLogLevel?: boolean | 'info' | 'error';
    disableFormHandler?: boolean | string[];
    enableComponentPreview?: boolean;
}
declare const _default: _nuxt_schema.NuxtModule<ModuleOptions, ModuleOptions, false>;

export { _default as default };
export type { ModuleOptions };
