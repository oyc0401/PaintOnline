import { c as create_ssr_component } from "../../chunks/ssr.js";
const app = "";
const paint = "";
const styles = "";
const Layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<div class="paint-layout">${slots.default ? slots.default({}) : ``}</div>`;
});
export {
  Layout as default
};
