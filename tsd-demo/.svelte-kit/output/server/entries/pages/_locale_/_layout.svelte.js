import { D as getContext, F as store_get, G as slot, I as unsubscribe_stores, J as bind_props, C as pop, z as push } from "../../../chunks/index.js";
import { s as setLocale } from "../../../chunks/Tsd.svelte_svelte_type_style_lang.js";
import "../../../chunks/client.js";
const getStores = () => {
  const stores$1 = getContext("__svelte__");
  return {
    /** @type {typeof page} */
    page: {
      subscribe: stores$1.page.subscribe
    },
    /** @type {typeof navigating} */
    navigating: {
      subscribe: stores$1.navigating.subscribe
    },
    /** @type {typeof updated} */
    updated: stores$1.updated
  };
};
const page = {
  subscribe(fn) {
    const store = getStores().page;
    return store.subscribe(fn);
  }
};
function _layout($$payload, $$props) {
  push();
  var $$store_subs;
  let data = $$props["data"];
  if (data.locale) {
    setLocale(data.locale);
  }
  if (store_get($$store_subs ??= {}, "$page", page).params.locale) {
    setLocale(store_get($$store_subs ??= {}, "$page", page).params.locale);
  }
  $$payload.out += `<!---->`;
  slot($$payload, $$props, "default", {});
  $$payload.out += `<!---->`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  bind_props($$props, { data });
  pop();
}
export {
  _layout as default
};
