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
    fetchOptions: Object;
    fetchProxyHeaders: string[];
    useLocalizedMenuEndpoint: boolean;
    serverApiProxy: boolean;
    passThroughHeaders?: string[];
    exposeAPIRouteRules?: boolean;
    serverLogLevel?: boolean | 'info' | 'error';
}
declare const _default: _nuxt_schema.NuxtModule<ModuleOptions>;

export { type ModuleOptions, _default as default };
