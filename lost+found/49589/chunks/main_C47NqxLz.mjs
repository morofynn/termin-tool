globalThis.process ??= {}; globalThis.process.env ??= {};
import { e as createComponent, f as createAstro, h as addAttribute, l as renderHead, n as renderSlot, r as renderTemplate } from './astro/server_EdVLS0R4.mjs';
/* empty css                         */
/* empty css                         */

const $$Astro = createAstro();
const $$Main = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Main;
  const { pageClass = "" } = Astro2.props;
  return renderTemplate`<html lang="en"${addAttribute(pageClass, "class")} data-astro-cid-yu3cdcui> <head><meta charset="utf-8"><link rel="icon" type="image/png" href="/favicon.ico"><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes"><meta name="generator"${addAttribute(Astro2.generator, "content")}><title>Appointment Scheduler</title>${renderHead()}</head> <!-- Dark mode class injection point - will be replaced with \`dark\` class based on your site palette --> <body class="dark" style="background: transparent;" data-astro-cid-yu3cdcui> ${renderSlot($$result, $$slots["default"])} </body></html>`;
}, "/app/src/layouts/main.astro", void 0);

export { $$Main as $ };
