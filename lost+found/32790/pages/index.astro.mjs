globalThis.process ??= {}; globalThis.process.env ??= {};
import { e as createComponent, k as renderComponent, l as renderScript, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_Cm4GTHGj.mjs';
import { $ as $$Main } from '../chunks/main_Cj7Zgr4X.mjs';
/* empty css                                 */
export { renderers } from '../renderers.mjs';

const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "MainLayout", $$Main, { "data-astro-cid-j7pv25f6": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div id="app-container" style="background: transparent;" data-astro-cid-j7pv25f6> <!-- Fallback für wenn React nicht lädt --> <noscript> <div style="padding: 2rem; text-align: center; background: #fee2e2; color: #991b1b; border-radius: 0.5rem; margin: 2rem auto; max-width: 600px;" data-astro-cid-j7pv25f6> <h2 style="font-size: 1.5rem; margin-bottom: 1rem;" data-astro-cid-j7pv25f6>JavaScript erforderlich</h2> <p data-astro-cid-j7pv25f6>Bitte aktivieren Sie JavaScript, um das Terminbuchungstool zu nutzen.</p> </div> </noscript> ${renderComponent($$result2, "AppointmentScheduler", null, { "client:only": "react", "client:component-hydration": "only", "data-astro-cid-j7pv25f6": true, "client:component-path": "/app/src/components/AppointmentScheduler", "client:component-export": "default" })} ${renderComponent($$result2, "Toaster", null, { "client:only": "react", "client:component-hydration": "only", "data-astro-cid-j7pv25f6": true, "client:component-path": "/app/src/components/ui/sonner", "client:component-export": "Toaster" })} </div> ` })}  ${renderScript($$result, "/app/src/pages/index.astro?astro&type=script&index=0&lang.ts")}`;
}, "/app/src/pages/index.astro", void 0);

const $$file = "/app/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
