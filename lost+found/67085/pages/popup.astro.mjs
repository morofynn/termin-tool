globalThis.process ??= {}; globalThis.process.env ??= {};
import { e as createComponent, l as renderHead, k as renderComponent, r as renderTemplate } from '../chunks/astro/server_EdVLS0R4.mjs';
/* empty css                                 */
/* empty css                                 */
export { renderers } from '../renderers.mjs';

const $$Popup = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`<html lang="de" class="dark" data-astro-cid-6agljibu> <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes"><title>Termin buchen</title>${renderHead()}</head> <body data-astro-cid-6agljibu> <div class="popup-container" data-astro-cid-6agljibu> ${renderComponent($$result, "AppointmentScheduler", null, { "client:only": "react", "client:component-hydration": "only", "data-astro-cid-6agljibu": true, "client:component-path": "/app/src/components/AppointmentScheduler", "client:component-export": "default" })} ${renderComponent($$result, "Toaster", null, { "client:only": "react", "client:component-hydration": "only", "data-astro-cid-6agljibu": true, "client:component-path": "/app/src/components/ui/sonner", "client:component-export": "Toaster" })} </div> </body></html>`;
}, "/app/src/pages/popup.astro", void 0);

const $$file = "/app/src/pages/popup.astro";
const $$url = "/popup";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Popup,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
