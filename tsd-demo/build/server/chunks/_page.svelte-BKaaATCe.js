import { u as push, R as escape_html, X as attr, Y as attr_class, W as bind_props, w as pop, Z as current_component, _ as stringify } from './exports-WrHD56vS.js';
import './client-CjLkGJl1.js';

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
  $$payload.out += `<span${attr_class("tsd-translation svelte-kqb54u", void 0, {
    "loading": isLoading,
    "translating": textContent
  })}${attr("title", `${stringify("Direct HTTP")} - ${stringify(connectionInfo.environment)}`)}>`;
  if (children) {
    $$payload.out += "<!--[-->";
    children($$payload);
    $$payload.out += `<!---->`;
  } else if (children) {
    $$payload.out += "<!--[3-->";
    children($$payload);
    $$payload.out += `<!---->`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<span class="loading-text svelte-kqb54u">...</span>`;
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
  $$payload.out += `<div class="container svelte-1b3dai5"><header class="svelte-1b3dai5"><h1 class="svelte-1b3dai5">`;
  Tsd($$payload, {
    children: ($$payload2) => {
      $$payload2.out += `<!---->Welcome to TSd Demo`;
    }
  });
  $$payload.out += `<!----></h1> <div class="connection-status svelte-1b3dai5">`;
  if (connectionInfo.isEnvoy) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<span class="status envoy svelte-1b3dai5">🚀 gRPC-Web via Envoy</span>`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<span class="status http svelte-1b3dai5">🌐 gRPC-Web over HTTP/JSON</span>`;
  }
  $$payload.out += `<!--]--> <span class="env svelte-1b3dai5">${escape_html(connectionInfo.environment || "loading...")}</span></div></header> <nav class="svelte-1b3dai5"><button${attr("disabled", isNavigating, true)}${attr_class("svelte-1b3dai5", void 0, { "active": currentLocale === "en" })}>English</button> <button${attr("disabled", isNavigating, true)}${attr_class("svelte-1b3dai5", void 0, { "active": currentLocale === "es" })}>Español</button> <button${attr("disabled", isNavigating, true)}${attr_class("svelte-1b3dai5", void 0, { "active": currentLocale === "fr" })}>Français</button> <button${attr("disabled", isNavigating, true)}${attr_class("svelte-1b3dai5", void 0, { "active": currentLocale === "de" })}>Deutsch</button> <button${attr("disabled", isNavigating, true)}${attr_class("svelte-1b3dai5", void 0, { "active": currentLocale === "ja" })}>日本語</button> <button${attr("disabled", isNavigating, true)}${attr_class("svelte-1b3dai5", void 0, { "active": currentLocale === "zh" })}>中文</button></nav> <main${attr_class("svelte-1b3dai5", void 0, { "loading": isNavigating })}><section class="demo-section svelte-1b3dai5"><h2>`;
  Tsd($$payload, {
    children: ($$payload2) => {
      $$payload2.out += `<!---->Translation Examples`;
    }
  });
  $$payload.out += `<!----></h2> <div class="example svelte-1b3dai5"><h3 class="svelte-1b3dai5">`;
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
  $$payload.out += `<!----></p></div> <div class="example svelte-1b3dai5"><h3 class="svelte-1b3dai5">`;
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
  $$payload.out += `<!----></p></div> <div class="example svelte-1b3dai5"><h3 class="svelte-1b3dai5">`;
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
  $$payload.out += `<!----></p></div></section> <section class="info-section svelte-1b3dai5"><h2 class="svelte-1b3dai5">Current Status</h2> <ul class="svelte-1b3dai5"><li class="svelte-1b3dai5">Locale: <strong>${escape_html(currentLocale)}</strong></li> <li class="svelte-1b3dai5">API: <strong>gRPC-Web Translation Service</strong></li> <li class="svelte-1b3dai5">Transport: <strong>${escape_html(connectionInfo.protocol || "loading...")}</strong></li> <li class="svelte-1b3dai5">Environment: <strong>${escape_html(connectionInfo.environment || "loading...")}</strong></li> <li class="svelte-1b3dai5">Proxy: <strong>${escape_html(connectionInfo.isEnvoy ? "Envoy" : "Direct HTTP")}</strong></li></ul> <button class="debug-toggle svelte-1b3dai5">${escape_html("Hide")} Console Logs</button> `;
  {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="debug-info svelte-1b3dai5"><p>Open your browser console to see detailed translation logs including:</p> <ul class="svelte-1b3dai5"><li class="svelte-1b3dai5">🚀 Envoy proxy detection</li> <li class="svelte-1b3dai5">📤 Translation requests with timing</li> <li class="svelte-1b3dai5">📥 Translation responses</li> <li class="svelte-1b3dai5">🔔 Real-time update notifications</li> <li class="svelte-1b3dai5">⚡ Performance metrics</li></ul></div>`;
  }
  $$payload.out += `<!--]--></section> <section class="info-section svelte-1b3dai5"><h2 class="svelte-1b3dai5">Architecture</h2> <div class="architecture-info svelte-1b3dai5"><p><strong>TSd uses gRPC-Web API</strong> for all translation operations:</p> <ul class="svelte-1b3dai5"><li class="svelte-1b3dai5"><code class="svelte-1b3dai5">TranslationService.Translate</code> - Get translations</li> <li class="svelte-1b3dai5"><code class="svelte-1b3dai5">TranslationService.SubscribeTranslations</code> - Real-time updates via SSE</li> <li class="svelte-1b3dai5"><code class="svelte-1b3dai5">TranslationService.GetTranslations</code> - Batch operations</li></ul> <p>In development, the gRPC-Web API is served over HTTP/JSON for easy debugging. In production with Envoy, it uses native gRPC-Web binary protocol for better performance.</p></div></section></main></div>`;
  bind_props($$props, { data });
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-BKaaATCe.js.map
