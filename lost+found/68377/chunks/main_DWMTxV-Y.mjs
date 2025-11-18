globalThis.process ??= {}; globalThis.process.env ??= {};
import { e as createComponent, f as createAstro, h as addAttribute, l as renderHead, n as renderSlot, r as renderTemplate } from './astro/server_EdVLS0R4.mjs';
/* empty css                         */
/* empty css                         */

const $$Astro = createAstro();
const $$Main = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Main;
  const { pageClass = "", lightMode = false } = Astro2.props;
  return renderTemplate`<html lang="de"${addAttribute(pageClass, "class")}> <head><meta charset="utf-8"><link rel="icon" type="image/png" href="/favicon.ico"><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes"><meta name="generator"${addAttribute(Astro2.generator, "content")}><title>Terminbuchung</title>${renderHead()}</head> <body${addAttribute(lightMode ? "" : "dark", "class")}> ${renderSlot($$result, $$slots["default"])} </body></html>`;
}, "/app/src/layouts/main.astro", void 0);

export { $$Main as $ };
