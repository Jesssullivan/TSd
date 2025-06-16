import { r as redirect } from "./index2.js";
const handle = async ({ event, resolve }) => {
  if (event.url.pathname === "/") {
    throw redirect(302, "/en/tsd-demo");
  }
  const localeOnlyMatch = event.url.pathname.match(/^\/([a-z]{2})\/?$/);
  if (localeOnlyMatch) {
    const locale = localeOnlyMatch[1];
    throw redirect(302, `/${locale}/tsd-demo`);
  }
  const response = await resolve(event, {
    transformPageChunk: ({ html }) => {
      const locale = event.params.locale || "en";
      return html.replace(/%tsd\.lang%/g, locale);
    }
  });
  return response;
};
export {
  handle
};
