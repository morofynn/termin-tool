globalThis.process ??= {}; globalThis.process.env ??= {};
import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_B7ylXxX9.mjs';
import { manifest } from './manifest_RnXUfs7v.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/api/admin/appointments/cancel.astro.mjs');
const _page2 = () => import('./pages/api/admin/appointments.astro.mjs');
const _page3 = () => import('./pages/api/admin/audit-log.astro.mjs');
const _page4 = () => import('./pages/api/admin/calendar-status.astro.mjs');
const _page5 = () => import('./pages/api/admin/settings.astro.mjs');
const _page6 = () => import('./pages/api/admin/system-status.astro.mjs');
const _page7 = () => import('./pages/api/admin/test-calendar.astro.mjs');
const _page8 = () => import('./pages/api/admin/test-email.astro.mjs');
const _page9 = () => import('./pages/api/appointment/cancel.astro.mjs');
const _page10 = () => import('./pages/api/appointment/_id_.astro.mjs');
const _page11 = () => import('./pages/api/auth/google-authorize.astro.mjs');
const _page12 = () => import('./pages/api/auth/google-callback.astro.mjs');
const _page13 = () => import('./pages/api/availability.astro.mjs');
const _page14 = () => import('./pages/api/book-appointment.astro.mjs');
const _page15 = () => import('./pages/api/debug-google.astro.mjs');
const _page16 = () => import('./pages/api/debug-slots.astro.mjs');
const _page17 = () => import('./pages/api/send-reminders.astro.mjs');
const _page18 = () => import('./pages/embed.astro.mjs');
const _page19 = () => import('./pages/popup.astro.mjs');
const _page20 = () => import('./pages/secure-admin-panel-xyz789.astro.mjs');
const _page21 = () => import('./pages/termin/_id_.astro.mjs');
const _page22 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/@astrojs/cloudflare/dist/entrypoints/image-endpoint.js", _page0],
    ["src/pages/api/admin/appointments/cancel.ts", _page1],
    ["src/pages/api/admin/appointments.ts", _page2],
    ["src/pages/api/admin/audit-log.ts", _page3],
    ["src/pages/api/admin/calendar-status.ts", _page4],
    ["src/pages/api/admin/settings.ts", _page5],
    ["src/pages/api/admin/system-status.ts", _page6],
    ["src/pages/api/admin/test-calendar.ts", _page7],
    ["src/pages/api/admin/test-email.ts", _page8],
    ["src/pages/api/appointment/cancel.ts", _page9],
    ["src/pages/api/appointment/[id].ts", _page10],
    ["src/pages/api/auth/google-authorize.ts", _page11],
    ["src/pages/api/auth/google-callback.ts", _page12],
    ["src/pages/api/availability.ts", _page13],
    ["src/pages/api/book-appointment.ts", _page14],
    ["src/pages/api/debug-google.ts", _page15],
    ["src/pages/api/debug-slots.ts", _page16],
    ["src/pages/api/send-reminders.ts", _page17],
    ["src/pages/embed.astro", _page18],
    ["src/pages/popup.astro", _page19],
    ["src/pages/secure-admin-panel-xyz789.astro", _page20],
    ["src/pages/termin/[id].astro", _page21],
    ["src/pages/index.astro", _page22]
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
