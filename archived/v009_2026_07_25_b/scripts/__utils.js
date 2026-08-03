// v009/site/scripts/__utils.js
// Shared utilities. No dependencies. Consumed by all _*.js files via merged.js.

export function esc(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

export function el(id) {
    return document.getElementById(id);
}

export function qsa(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
}

export function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
}
