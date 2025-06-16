var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
function transformHtml(html, config) {
  const langPattern = /%(paraglide|tsd)\.lang%/g;
  const locale = config.defaultLocale;
  let transformed = html.replace(langPattern, locale);
  if (!transformed.includes("/__tsd/runtime.js")) {
    transformed = transformed.replace(
      "</head>",
      `<script type="module" src="/__tsd/runtime.js"></script>
</head>`
    );
  }
  return transformed;
}
__name(transformHtml, "transformHtml");
export {
  transformHtml
};
//# sourceMappingURL=html-transformer.js.map
