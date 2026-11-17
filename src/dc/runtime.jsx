// Small renderer for the converted design-component templates.
// Mirrors the semantics of the prototype runtime (design/support.js):
// {{ path }} holes, sc-if, sc-for, event bindings and style strings,
// but renders on the server too so pages ship real HTML.
import React from 'react';

const IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*/;
const NUM = /^-?\d+(\.\d+)?$/;

function wrapsWhole(e) {
  let d = 0;
  for (let i = 0; i < e.length - 1; i++) {
    if (e[i] === '(') d++;
    else if (e[i] === ')') { d--; if (d === 0) return false; }
  }
  return true;
}
function topEquality(e) {
  let d = 0;
  for (let i = 0; i < e.length; i++) {
    const c = e[i];
    if (c === '[' || c === '(') d++;
    else if (c === ']' || c === ')') d--;
    else if (d === 0 && (c === '=' || c === '!') && e[i + 1] === '=') {
      if (i > 0 && (e[i - 1] === '=' || e[i - 1] === '!')) continue;
      if (!e.slice(0, i).trim()) continue;
      return { index: i, op: e[i + 2] === '=' ? c + '==' : c + '=' };
    }
  }
  return null;
}
function path(vals, e) {
  const head = e.match(IDENT);
  if (!head) return undefined;
  let cur = vals == null ? undefined : vals[head[0]];
  let i = head[0].length;
  while (i < e.length) {
    if (e[i] === '.') {
      const m = e.slice(i + 1).match(IDENT) || e.slice(i + 1).match(/^\d+/);
      if (!m) return undefined;
      cur = cur == null ? undefined : cur[m[0]];
      i += 1 + m[0].length;
    } else if (e[i] === '[') {
      let d = 1, j = i + 1;
      while (j < e.length && d > 0) { if (e[j] === '[') d++; else if (e[j] === ']') { d--; if (d === 0) break; } j++; }
      if (d !== 0) return undefined;
      cur = cur == null ? undefined : cur[resolve(vals, e.slice(i + 1, j))];
      i = j + 1;
    } else return undefined;
  }
  return cur;
}
export function resolve(vals, src) {
  const e = String(src).trim();
  if (!e) return undefined;
  if (e[0] === '(' && e[e.length - 1] === ')' && wrapsWhole(e)) return resolve(vals, e.slice(1, -1));
  const eq = topEquality(e);
  if (eq) {
    const l = resolve(vals, e.slice(0, eq.index)), r = resolve(vals, e.slice(eq.index + eq.op.length));
    return eq.op === '===' ? l === r : eq.op === '!==' ? l !== r : eq.op === '==' ? l == r : l != r;
  }
  if (e[0] === '!') return !resolve(vals, e.slice(1));
  if (e === 'true') return true;
  if (e === 'false') return false;
  if (e === 'null') return null;
  if (e === 'undefined') return undefined;
  if (NUM.test(e)) return Number(e);
  if (e.length >= 2 && (e[0] === '"' || e[0] === "'") && e[e.length - 1] === e[0]) return e.slice(1, -1);
  return path(vals, e);
}

const attrCache = new Map();
function compileAttr(raw) {
  let f = attrCache.get(raw);
  if (f) return f;
  const whole = raw.match(/^\s*\{\{([\s\S]+?)\}\}\s*$/);
  if (whole) f = (v) => resolve(v, whole[1]);
  else if (raw.includes('{{')) {
    const parts = raw.split(/\{\{([\s\S]+?)\}\}/g);
    f = (v) => parts.map((s, i) => (i & 1 ? resolve(v, s) ?? '' : s)).join('');
  } else f = () => raw;
  attrCache.set(raw, f);
  return f;
}

const camel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
export function cssToObj(css) {
  const o = {};
  for (const decl of String(css).split(';')) {
    const i = decl.indexOf(':');
    if (i < 0) continue;
    const p = decl.slice(0, i).trim();
    if (!p) continue;
    o[p.startsWith('--') ? p : camel(p)] = decl.slice(i + 1).trim();
  }
  return o;
}

const SHAPE_RADIUS = { circle: '50%', pill: '999px', rounded: '24px', rect: '0' };
function ImageSlot({ src, shape = 'rect', placeholder, style, id }) {
  const radius = SHAPE_RADIUS[shape] ?? '0';
  const inner = src
    ? <img src={src} alt={(placeholder || '').replace(/^Photo:\s*/, '')} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: radius }} />
    : <div role="img" aria-label={placeholder} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', textAlign: 'center', padding: '12px', boxSizing: 'border-box', borderRadius: radius, color: 'rgba(255,255,255,.85)', font: '400 13px/1.4 Jost, system-ui, sans-serif' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
        <span>{(placeholder || '').replace(/^Photo:\s*/, '')}</span>
      </div>;
  return <div id={id} data-image-slot={shape} style={style}>{inner}</div>;
}

function renderNodes(nodes, vals, keyBase, out) {
  for (let n = 0; n < nodes.length; n++) {
    const node = nodes[n];
    const key = keyBase + '.' + n;
    if (typeof node === 'string') {
      if (!node.includes('{{')) { out.push(node); continue; }
      const parts = node.split(/\{\{([\s\S]+?)\}\}/g);
      parts.forEach((p, i) => {
        if (!(i & 1)) { if (p) out.push(p); return; }
        const v = resolve(vals, p);
        if (v === undefined || v === null || typeof v === 'boolean') return;
        if (React.isValidElement(v)) out.push(React.cloneElement(v, { key: key + ':' + i }));
        else if (Array.isArray(v)) out.push(React.createElement(React.Fragment, { key: key + ':' + i }, ...v));
        else out.push(String(v));
      });
      continue;
    }
    if ('for' in node) {
      let list = compileAttr(node.for)(vals);
      if (!Array.isArray(list)) list = [];
      list.forEach((item, i) => renderNodes(node.c, { ...vals, [node.as]: item, $index: i }, key + '[' + i + ']', out));
      continue;
    }
    if ('if' in node) {
      if (compileAttr(node.if)(vals)) renderNodes(node.c, vals, key + '?', out);
      continue;
    }
    const props = { key };
    for (const [k, raw] of Object.entries(node.a)) {
      let v = compileAttr(raw)(vals);
      if (k === 'style') {
        if (typeof v === 'string') v = cssToObj(v);
      } else if ((k === 'value' || k === 'checked') && v === undefined) {
        v = k === 'checked' ? false : '';
      }
      if (v === undefined) continue;
      if (k.startsWith('on') && typeof v !== 'function') continue;
      props[k] = v;
    }
    if (node.t === 'style' || node.t === 'script') {
      props.dangerouslySetInnerHTML = { __html: node.raw };
      out.push(React.createElement(node.t, props));
      continue;
    }
    if (node.t === 'image-slot') { out.push(React.createElement(ImageSlot, props)); continue; }
    // Inputs with a bound value but no handler are intentionally read-only in the prototypes.
    if ((props.value !== undefined || props.checked !== undefined) && !props.onChange && !props.onInput && (node.t === 'input' || node.t === 'textarea' || node.t === 'select')) {
      if ('value' in props) { props.defaultValue = props.value; delete props.value; }
      if ('checked' in props) { props.defaultChecked = props.checked; delete props.checked; }
    }
    if ((props.onInput && !props.onChange) && 'value' in props) props.onChange = () => {};
    const kids = [];
    renderNodes(node.c, vals, key, kids);
    out.push(kids.length ? React.createElement(node.t, props, ...kids) : React.createElement(node.t, props));
  }
  return out;
}

export function renderTree(tree, vals) {
  return renderNodes(tree, vals || {}, 'r', []);
}

// Base class for the prototype logic classes (`class Component extends DCLogic`).
export class DCLogic extends React.Component {
  renderVals() { return {}; }
  render() {
    const { __tree, ...props } = this.props;
    const vals = { ...props, ...(this.renderVals() || {}) };
    return React.createElement(React.Fragment, null, ...renderTree(__tree, vals));
  }
}

export function mountPage(Component, data) {
  function Page(props) {
    const ref = React.useRef(null);
    React.useEffect(() => {
      window.__dcMounted = true;
      const inst = ref.current;
      if (inst && inst.state && 'w' in inst.state && inst.state.w !== window.innerWidth) inst.setState({ w: window.innerWidth });
    }, []);
    return React.createElement(Component, { ...data.defaults, ...props, __tree: data.tree, ref });
  }
  return Page;
}
