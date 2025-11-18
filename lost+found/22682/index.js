globalThis.process ??= {}; globalThis.process.env ??= {};
import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_CVi96VF9.mjs';
import { manifest } from './manifest_lx6DwPDq.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/api/admin/appointments.astro.mjs');
const _page2 = () => import('./pages/api/availability.astro.mjs');
const _page3 = () => import('./pages/api/book-appointment.astro.mjs');
const _page4 = () => import('./pages/embed.astro.mjs');
const _page5 = () => import('./pages/popup.astro.mjs');
const _page6 = () => import('./pages/secure-admin-panel-xyz789.astro.mjs');
const _page7 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/@astrojs/cloudflare/dist/entrypoints/image-endpoint.js", _page0],
    ["src/pages/api/admin/appointments.ts", _page1],
    ["src/pages/api/availability.ts", _page2],
    ["src/pages/api/book-appointment.ts", _page3],
    ["src/pages/embed.astro", _page4],
    ["src/pages/popup.astro", _page5],
    ["src/pages/secure-admin-panel-xyz789.astro", _page6],
    ["src/pages/index.astro", _page7]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./_noop-actions.mjs'),
    middleware: () => import('./_astro-internal_middleware.mjs')
});
const _args = undefined;
const _exports = createExports(_manifest);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) {
	serverEntrypointModule[_start](_manifest, _args);
}

export { __astrojsSsrVirtualEntry as default, pageMap };
