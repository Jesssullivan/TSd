import { r as redirect } from "../../../chunks/index2.js";
const supportedLocales = ["en", "es", "fr", "de", "ja", "zh"];
const load = async ({ params }) => {
  const { locale } = params;
  if (!supportedLocales.includes(locale)) {
    throw redirect(302, "/en");
  }
  return {
    locale
  };
};
export {
  load
};
