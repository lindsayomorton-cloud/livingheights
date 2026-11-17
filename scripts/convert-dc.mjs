// Converts the Draper "design component" prototypes (design/*.dc.html) into
// React modules that Astro renders on the server and hydrates in the browser.
// Each page becomes: a JSON element tree + its original logic class + head markup.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { parseDocument } from 'htmlparser2';
import { DRAPER, rewrite } from './routes.mjs';

const OUT = 'src/generated/draper';
mkdirSync(OUT, { recursive: true });

const EVENT_MAP = { onclick: 'onClick', onchange: 'onChange', oninput: 'onInput', onsubmit: 'onSubmit', onkeydown: 'onKeyDown', onkeyup: 'onKeyUp', onmousedown: 'onMouseDown', onmouseup: 'onMouseUp', onmouseenter: 'onMouseEnter', onmouseleave: 'onMouseLeave', onfocus: 'onFocus', onblur: 'onBlur', onmouseover: 'onMouseOver', onmouseout: 'onMouseOut', ontouchstart: 'onTouchStart', ontouchend: 'onTouchEnd', ontouchmove: 'onTouchMove', onanimationend: 'onAnimationEnd', ontransitionend: 'onTransitionEnd', onpointerenter: 'onPointerEnter', onpointerleave: 'onPointerLeave' };
const REACT_ATTR = { class: 'className', for: 'htmlFor', tabindex: 'tabIndex', readonly: 'readOnly', maxlength: 'maxLength', minlength: 'minLength', autocomplete: 'autoComplete', autofocus: 'autoFocus', srcset: 'srcSet', crossorigin: 'crossOrigin', referrerpolicy: 'referrerPolicy', frameborder: 'frameBorder', allowfullscreen: 'allowFullScreen', playsinline: 'playsInline', autoplay: 'autoPlay', novalidate: 'noValidate', inputmode: 'inputMode', enterkeyhint: 'enterKeyHint', datetime: 'dateTime', fetchpriority: 'fetchPriority', colspan: 'colSpan', rowspan: 'rowSpan', 'accept-charset': 'acceptCharset', 'xlink:href': 'xlinkHref', 'xml:space': 'xmlSpace', 'stroke-width': 'strokeWidth', 'stroke-linecap': 'strokeLinecap', 'stroke-linejoin': 'strokeLinejoin', 'stroke-dasharray': 'strokeDasharray', 'stroke-dashoffset': 'strokeDashoffset', 'stroke-miterlimit': 'strokeMiterlimit', 'stroke-opacity': 'strokeOpacity', 'fill-opacity': 'fillOpacity', 'fill-rule': 'fillRule', 'clip-rule': 'clipRule', 'clip-path': 'clipPath', 'font-size': 'fontSize', 'font-family': 'fontFamily', 'font-weight': 'fontWeight', 'font-style': 'fontStyle', 'text-anchor': 'textAnchor', 'dominant-baseline': 'dominantBaseline', 'stop-color': 'stopColor', 'stop-opacity': 'stopOpacity', 'letter-spacing': 'letterSpacing', 'vector-effect': 'vectorEffect' };
const BOOL = new Set(['hidden', 'disabled', 'required', 'checked', 'selected', 'autoPlay', 'muted', 'loop', 'playsInline', 'controls', 'noValidate', 'readOnly', 'multiple', 'open', 'allowFullScreen', 'autoFocus', 'inert']);

// Pseudo-class styles (style-hover="...") become real CSS classes shared across pages.
const pseudo = new Map();
function pseudoClass(kind, css) {
  const k = kind + '|' + css;
  if (!pseudo.has(k)) pseudo.set(k, { cls: 'dcp' + pseudo.size.toString(36), kind, css });
  return pseudo.get(k).cls;
}
const importantify = (css) => css.split(';').map((d) => d.trim()).filter(Boolean).map((d) => (/!important\s*$/.test(d) ? d : d + ' !important')).join(';');

function attrKey(name) {
  if (name.startsWith('on') && name.length > 2) return EVENT_MAP[name.toLowerCase()] || 'on' + name[2].toUpperCase() + name.slice(3);
  return REACT_ATTR[name] || REACT_ATTR[name.toLowerCase()] || name;
}

function convert(node, warn) {
  if (node.type === 'text') {
    const t = node.data;
    if (!t.includes('{{') && !t.trim() && !t.includes(' ')) return null;
    return t;
  }
  if (node.type === 'script' || node.type === 'style' || node.type === 'tag') {
    const tag = node.name;
    const kids = () => node.children.map((c) => convert(c, warn)).filter((c) => c != null);
    if (tag === 'sc-for') return { for: node.attribs.list || '', as: node.attribs.as || 'item', c: kids() };
    if (tag === 'sc-if') return { if: node.attribs.value || '', c: kids() };
    if (tag === 'helmet') return null;
    const a = {};
    const cls = [];
    for (const [name, value] of Object.entries(node.attribs)) {
      if (name.startsWith('hint-')) continue;
      if (name.startsWith('style-')) {
        if (value.includes('{{')) warn(`dynamic ${name} ignored`);
        cls.push(pseudoClass(name.slice(6), value));
        continue;
      }
      const key = attrKey(name);
      a[key] = BOOL.has(key) && value === '' ? '{{ true }}' : value;
    }
    if (cls.length) a.className = [a.className, ...cls].filter(Boolean).join(' ');
    if (tag === 'style' || tag === 'script') {
      return { t: tag, a, raw: node.children.map((c) => c.data || '').join('') };
    }
    return { t: tag, a, c: kids() };
  }
  return null; // comments, directives
}

const pages = [];
for (const [name, meta] of Object.entries(DRAPER)) {
  const src = rewrite(readFileSync(`design/${name}.dc.html`, 'utf8'));
  const tplStart = src.indexOf('<x-dc>') + 6;
  const tplEnd = src.lastIndexOf('</x-dc>');
  let tpl = src.slice(tplStart, tplEnd);
  const helmet = (tpl.match(/<helmet>([\s\S]*?)<\/helmet>/) || [, ''])[1];
  tpl = tpl.replace(/<helmet>[\s\S]*?<\/helmet>/, '');
  const head = helmet
    .replace(/<link[^>]*_ds\/[^>]*>/g, '')
    .replace(/<script[^>]*_ds\/[^>]*><\/script>/g, '')
    .trim();
  const scriptMatch = src.match(/<script type="text\/x-dc" data-dc-script([^>]*)>([\s\S]*?)<\/script>/);
  let logic = scriptMatch ? scriptMatch[2] : 'class Component extends DCLogic {}';
  let defaults = {};
  const dp = scriptMatch && scriptMatch[1].match(/data-props="([^"]*)"/);
  if (dp) {
    const json = JSON.parse(dp[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
    for (const [k, v] of Object.entries(json)) if (v && 'default' in v) defaults[k] = v.default;
  }
  // The prototype reads the viewport width while constructing state. On the server
  // (and during hydration) start from a desktop width; the real width is applied on mount.
  logic = logic.replace(/window\.innerWidth/g, '__vw()');
  const warn = (m) => console.warn(`[${name}] ${m}`);
  const doc = parseDocument(tpl, { lowerCaseAttributeNames: false, lowerCaseTags: true, recognizeSelfClosing: true, decodeEntities: true });
  const tree = doc.children.map((c) => convert(c, warn)).filter((c) => c != null);
  writeFileSync(`${OUT}/${meta.slug}.json`, JSON.stringify({ head, tree, defaults }));
  writeFileSync(`${OUT}/${meta.slug}.jsx`, `// GENERATED by scripts/convert-dc.mjs from design/${name}.dc.html. Do not edit.
import React from 'react';
import { DCLogic, mountPage } from '../../dc/runtime.jsx';
import data from './${meta.slug}.json';
const StreamableLogic = DCLogic;
const __vw = () => (typeof window === 'undefined' || !window.__dcMounted ? 1280 : window.innerWidth);
${logic}
export default mountPage(Component, data);
`);
  pages.push(meta.slug);
}
const css = [...pseudo.values()].map(({ cls, kind, css }) => (kind === 'before' || kind === 'after' ? `.${cls}::${kind}{${css}}` : `.${cls}:${kind}{${importantify(css)}}`)).join('\n');
writeFileSync(`${OUT}/pseudo.css`, css + '\n');
console.log(`converted ${pages.length} Draper pages, ${pseudo.size} pseudo-class rules`);
