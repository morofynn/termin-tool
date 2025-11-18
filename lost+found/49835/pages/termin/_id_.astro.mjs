globalThis.process ??= {}; globalThis.process.env ??= {};
import { e as createComponent, f as createAstro, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_EdVLS0R4.mjs';
import { $ as $$Main } from '../../chunks/main_D_JMgI2k.mjs';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro();
const $$id = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$id;
  const { id } = Astro2.params;
  if (!id) {
    return Astro2.redirect("/");
  }
  return renderTemplate`${renderComponent($$result, "MainLayout", $$Main, {}, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="min-h-screen" style="background: transparent;"> ${renderComponent($$result2, "AppointmentDetail", null, { "client:only": "react", "appointmentId": id, "client:component-hydration": "only", "client:component-path": "/app/src/components/AppointmentDetail", "client:component-export": "default" })} ${renderComponent($$result2, "Toaster", null, { "client:only": "react", "client:component-hydration": "only", "client:component-path": "/app/src/components/ui/sonner", "client:component-export": "Toaster" })} </div> ` })}`;
}, "/app/src/pages/termin/[id].astro", void 0);

const $$file = "/app/src/pages/termin/[id].astro";
const $$url = "/termin/[id]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$id,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
