globalThis.process ??= {}; globalThis.process.env ??= {};
import './chunks/astro-designed-error-pages_CsqBicbm.mjs';
import './chunks/astro/server_Cm4GTHGj.mjs';
import { s as sequence } from './chunks/index_BLGW0Hb8.mjs';

const onRequest$2 = async (ctx, next) => {
  const { request } = ctx;
  new URL(request.url);
  return next();
};

const onRequest$1 = (context, next) => {
  if (context.isPrerendered) {
    context.locals.runtime ??= {
      env: process.env
    };
  }
  return next();
};

const onRequest = sequence(
	onRequest$1,
	onRequest$2
	
);

export { onRequest };
