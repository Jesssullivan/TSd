import { K as current_component, M as attr_class, N as attr, O as attr_style, E as escape_html, C as pop, z as push, P as stringify, J as bind_props } from "../../../../chunks/index.js";
import "../../../../chunks/Tsd.svelte_svelte_type_style_lang.js";
import "../../../../chunks/client.js";
function onDestroy(fn) {
  var context = (
    /** @type {Component} */
    current_component
  );
  (context.d ??= []).push(fn);
}
function Tsd($$payload, $$props) {
  push();
  let { native = "en", children } = $$props;
  let isLoading = true;
  let textContent = "";
  let connectionInfo = {
    environment: "unknown"
  };
  $$payload.out += `<span${attr_class("tsd-translation svelte-1wyrky8", void 0, {
    "loading": isLoading,
    "translating": textContent
  })}${attr("title", `${stringify("Direct HTTP")} - ${stringify(connectionInfo.environment)}`)}>`;
  {
    $$payload.out += "<!--[-->";
    $$payload.out += `<span class="tsd-original svelte-1wyrky8"${attr_style("", {
      display: "none"
    })}>${escape_html(textContent)}</span> <span class="tsd-slot-content svelte-1wyrky8"${attr_style("", { display: "contents" })}>`;
    children($$payload);
    $$payload.out += `<!----></span>`;
  }
  $$payload.out += `<!--]--></span>`;
  pop();
}
function _page($$payload, $$props) {
  push();
  let data = $$props["data"];
  let currentLocale = data.locale;
  let connectionInfo = {};
  let isNavigating = false;
  onDestroy(() => {
  });
  $$payload.out += `<div class="container svelte-1g7u9i2"><header class="svelte-1g7u9i2"><h1 class="svelte-1g7u9i2">`;
  Tsd($$payload, {
    children: ($$payload2) => {
      $$payload2.out += `<!---->Welcome to TSd Demo`;
    }
  });
  $$payload.out += `<!----></h1> <div class="connection-status svelte-1g7u9i2">`;
  if (connectionInfo.isEnvoy) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<span class="status envoy svelte-1g7u9i2">🚀 Envoy Proxy</span>`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<span class="status http svelte-1g7u9i2">🌐 HTTP/JSON</span>`;
  }
  $$payload.out += `<!--]--> <span class="env svelte-1g7u9i2">${escape_html(connectionInfo.environment || "loading...")}</span></div></header> <nav class="svelte-1g7u9i2"><button${attr("disabled", isNavigating, true)}${attr_class("svelte-1g7u9i2", void 0, { "active": currentLocale === "en" })}>English</button> <button${attr("disabled", isNavigating, true)}${attr_class("svelte-1g7u9i2", void 0, { "active": currentLocale === "es" })}>Español</button> <button${attr("disabled", isNavigating, true)}${attr_class("svelte-1g7u9i2", void 0, { "active": currentLocale === "fr" })}>Français</button> <button${attr("disabled", isNavigating, true)}${attr_class("svelte-1g7u9i2", void 0, { "active": currentLocale === "de" })}>Deutsch</button> <button${attr("disabled", isNavigating, true)}${attr_class("svelte-1g7u9i2", void 0, { "active": currentLocale === "ja" })}>日本語</button> <button${attr("disabled", isNavigating, true)}${attr_class("svelte-1g7u9i2", void 0, { "active": currentLocale === "zh" })}>中文</button></nav> <main${attr_class("svelte-1g7u9i2", void 0, { "loading": isNavigating })}><section class="demo-section svelte-1g7u9i2"><h2>`;
  Tsd($$payload, {
    children: ($$payload2) => {
      $$payload2.out += `<!---->Translation Examples`;
    }
  });
  $$payload.out += `<!----></h2> <div class="example svelte-1g7u9i2"><h3 class="svelte-1g7u9i2">`;
  Tsd($$payload, {
    children: ($$payload2) => {
      $$payload2.out += `<!---->Simple Text`;
    }
  });
  $$payload.out += `<!----></h3> <p>`;
  Tsd($$payload, {
    children: ($$payload2) => {
      $$payload2.out += `<!---->Hello, world!`;
    }
  });
  $$payload.out += `<!----></p> <p>`;
  Tsd($$payload, {
    children: ($$payload2) => {
      $$payload2.out += `<!---->This is a test of the TSd translation system.`;
    }
  });
  $$payload.out += `<!----></p></div> <div class="example svelte-1g7u9i2"><h3 class="svelte-1g7u9i2">`;
  Tsd($$payload, {
    children: ($$payload2) => {
      $$payload2.out += `<!---->Common Phrases`;
    }
  });
  $$payload.out += `<!----></h3> <p>`;
  Tsd($$payload, {
    children: ($$payload2) => {
      $$payload2.out += `<!---->Welcome`;
    }
  });
  $$payload.out += `<!----></p> <p>`;
  Tsd($$payload, {
    children: ($$payload2) => {
      $$payload2.out += `<!---->Thank you`;
    }
  });
  $$payload.out += `<!----></p> <p>`;
  Tsd($$payload, {
    children: ($$payload2) => {
      $$payload2.out += `<!---->Good morning`;
    }
  });
  $$payload.out += `<!----></p> <p>`;
  Tsd($$payload, {
    children: ($$payload2) => {
      $$payload2.out += `<!---->Goodbye`;
    }
  });
  $$payload.out += `<!----></p></div> <div class="example svelte-1g7u9i2"><h3 class="svelte-1g7u9i2">`;
  Tsd($$payload, {
    children: ($$payload2) => {
      $$payload2.out += `<!---->Longer Text`;
    }
  });
  $$payload.out += `<!----></h3> <p>`;
  Tsd($$payload, {
    children: ($$payload2) => {
      $$payload2.out += `<!---->This translation system uses just-in-time translation with caching to provide fast, efficient multilingual support for your application.`;
    }
  });
  $$payload.out += `<!----></p></div></section> <section class="info-section svelte-1g7u9i2"><h2 class="svelte-1g7u9i2">Current Status</h2> <ul class="svelte-1g7u9i2"><li class="svelte-1g7u9i2">Locale: <strong>${escape_html(currentLocale)}</strong></li> <li class="svelte-1g7u9i2">Protocol: <strong>${escape_html(connectionInfo.protocol || "loading...")}</strong></li> <li class="svelte-1g7u9i2">Environment: <strong>${escape_html(connectionInfo.environment || "loading...")}</strong></li> <li class="svelte-1g7u9i2">Envoy: <strong>${escape_html(connectionInfo.isEnvoy ? "Yes" : "No")}</strong></li></ul> <button class="debug-toggle svelte-1g7u9i2">${escape_html("Hide")} Console Logs</button> `;
  {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="debug-info svelte-1g7u9i2"><p>Open your browser console to see detailed translation logs including:</p> <ul class="svelte-1g7u9i2"><li class="svelte-1g7u9i2">🚀 Envoy proxy detection</li> <li class="svelte-1g7u9i2">📤 Translation requests with timing</li> <li class="svelte-1g7u9i2">📥 Translation responses</li> <li class="svelte-1g7u9i2">🔔 Real-time update notifications</li> <li class="svelte-1g7u9i2">⚡ Performance metrics</li></ul></div>`;
  }
  $$payload.out += `<!--]--></section></main></div>`;
  bind_props($$props, { data });
  pop();
}
export {
  _page as default
};
