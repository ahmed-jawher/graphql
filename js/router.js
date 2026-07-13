import { getToken } from "./state.js";
import { renderLogin, renderNotFound, renderProfile } from "./views.js";

let root = null;

function route() {
  const hash = window.location.hash;

  if (hash === "" || hash === "#") {
    renderLogin(root);
    return;
  }

  if (hash === "#profile") {
    if (!getToken()) {
      window.location.hash = "";
      return;
    }
    renderProfile(root);
    return;
  }

  renderNotFound(root);
}

export function init(rootEl) {
  root = rootEl;
  window.addEventListener("hashchange", route);
  route();
}
