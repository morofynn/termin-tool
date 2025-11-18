globalThis.process ??= {}; globalThis.process.env ??= {};
import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_CGl8DrLI.mjs';
import { $ as $$Main } from '../chunks/main_DeqvBy9H.mjs';
export { renderers } from '../renderers.mjs';

const $$TestPreview = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "MainLayout", $$Main, {}, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div style="padding: 2rem; max-width: 800px; margin: 0 auto; background: white; min-height: 100vh;"> <h1 style="color: #111; font-size: 2rem; margin-bottom: 1rem;">Preview Test</h1> <p style="color: #666; margin-bottom: 2rem;">
Wenn Sie diesen Text sehen, funktioniert die Preview grundsätzlich.
</p> <div style="background: #f3f4f6; padding: 1.5rem; border-radius: 0.5rem; margin-bottom: 2rem;"> <h2 style="color: #111; font-size: 1.5rem; margin-bottom: 1rem;">Debug Info</h2> <pre style="background: #1f2937; color: #10b981; padding: 1rem; border-radius: 0.25rem; overflow-x: auto; font-size: 0.875rem;">Base URL: ${"/"}
Mode: ${"production"}
Prod: ${true}
Dev: ${false}
      </pre> </div> <div style="background: #dbeafe; padding: 1.5rem; border-radius: 0.5rem;"> <h3 style="color: #1e40af; font-size: 1.25rem; margin-bottom: 0.5rem;">
Nächster Schritt
</h3> <p style="color: #1e40af;">
Wenn dieser Test funktioniert, liegt das Problem bei der React-Komponente oder den API-Aufrufen.
</p> </div> </div> ` })}`;
}, "/app/src/pages/test-preview.astro", void 0);
const $$file = "/app/src/pages/test-preview.astro";
const $$url = "/test-preview";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$TestPreview,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
