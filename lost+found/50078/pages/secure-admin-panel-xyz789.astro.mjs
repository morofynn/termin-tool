globalThis.process ??= {}; globalThis.process.env ??= {};
import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_EdVLS0R4.mjs';
import { $ as $$Main } from '../chunks/main_DWMTxV-Y.mjs';
export { renderers } from '../renderers.mjs';

const $$SecureAdminPanelXyz789 = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "MainLayout", $$Main, { "lightMode": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="min-h-screen bg-gray-50"> ${renderComponent($$result2, "AdminAppointments", null, { "client:only": "react", "client:component-hydration": "only", "client:component-path": "/app/src/components/AdminAppointments", "client:component-export": "default" })} ${renderComponent($$result2, "Toaster", null, { "client:only": "react", "client:component-hydration": "only", "client:component-path": "/app/src/components/ui/sonner", "client:component-export": "Toaster" })} </div> ` })}`;
}, "/app/src/pages/secure-admin-panel-xyz789.astro", void 0);

const $$file = "/app/src/pages/secure-admin-panel-xyz789.astro";
const $$url = "/secure-admin-panel-xyz789";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$SecureAdminPanelXyz789,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
