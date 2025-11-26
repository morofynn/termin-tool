globalThis.process ??= {}; globalThis.process.env ??= {};
import { e as createComponent, k as renderComponent, l as renderScript, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_Cm4GTHGj.mjs';
import { $ as $$Main } from '../chunks/main_Cj7Zgr4X.mjs';
/* empty css                                 */
export { renderers } from '../renderers.mjs';

const $$Embed = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "MainLayout", $$Main, {}, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div id="embed-root" class="bg-transparent"> ${renderComponent($$result2, "AppointmentScheduler", null, { "client:only": "react", "client:component-hydration": "only", "client:component-path": "/app/src/components/AppointmentScheduler", "client:component-export": "default" })} ${renderComponent($$result2, "Toaster", null, { "client:only": "react", "client:component-hydration": "only", "client:component-path": "/app/src/components/ui/sonner", "client:component-export": "Toaster" })} </div> ` })}  ${renderScript($$result, "/app/src/pages/embed.astro?astro&type=script&index=0&lang.ts")}`;
}, "/app/src/pages/embed.astro", void 0);

const $$file = "/app/src/pages/embed.astro";
const $$url = "/embed";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Embed,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
