/*!
 * dc-lite.js – runtime tối giản để chạy các màn thiết kế (định dạng .dc.html) ngoài trình biên tập.
 * Hỗ trợ: {{biến}}, <sc-for list as>, <sc-if value>, onClick/onChange, class Component extends DCLogic
 * (props, state, setState, forceUpdate, componentDidMount). Không phụ thuộc thư viện ngoài.
 */
(function () {
  'use strict';
  var inst = null, tplRoot = null, mount = null, pending = false;

  function DCLogic(props) { this.props = props || {}; this.state = {}; }
  DCLogic.prototype.setState = function (u) {
    var p = typeof u === 'function' ? u(this.state, this.props) : u;
    this.state = Object.assign({}, this.state, p || {});
    schedule();
  };
  DCLogic.prototype.forceUpdate = function () { schedule(); };
  window.DCLogic = DCLogic;

  function schedule() {
    if (pending) return;
    pending = true;
    Promise.resolve().then(function () { pending = false; render(); });
  }

  var FULL = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/;
  var ANY = /\{\{\s*([^}]+?)\s*\}\}/g;
  function lookup(path, scope) {
    path = path.trim();
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (path === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    if (/^(['"]).*\1$/.test(path)) return path.slice(1, -1);
    var parts = path.split('.'), v = scope;
    for (var i = 0; i < parts.length; i++) { if (v == null) return undefined; v = v[parts[i]]; }
    return v;
  }
  function interp(str, scope) {
    return str.replace(ANY, function (m, p) { var v = lookup(p, scope); return v == null ? '' : String(v); });
  }
  function value(str, scope) { var m = str.match(FULL); return m ? lookup(m[1], scope) : interp(str, scope); }
  function child(scope, extra) { var s = Object.create(scope); for (var k in extra) s[k] = extra[k]; return s; }

  var PROPS = { checked: 1, value: 1, selected: 1 };
  function renderChildren(node, scope, parent) {
    for (var c = node.firstChild; c; c = c.nextSibling) renderNode(c, scope, parent);
  }
  function renderNode(node, scope, parent) {
    if (node.nodeType === 3) { parent.appendChild(document.createTextNode(node.data.indexOf('{{') < 0 ? node.data : interp(node.data, scope))); return; }
    if (node.nodeType !== 1) return;
    var tag = node.localName;
    if (tag === 'sc-for') {
      var list = value(node.getAttribute('list') || '', scope) || [];
      var as = node.getAttribute('as') || 'item';
      for (var i = 0; i < list.length; i++) { var e = {}; e[as] = list[i]; e.$index = i; renderChildren(node, child(scope, e), parent); }
      return;
    }
    if (tag === 'sc-if') { if (value(node.getAttribute('value') || '', scope)) renderChildren(node, scope, parent); return; }
    var el = document.createElementNS(node.namespaceURI, tag);
    for (var a = 0; a < node.attributes.length; a++) {
      var at = node.attributes[a], name = at.name, raw = at.value;
      if (name.indexOf('hint-') === 0) continue;
      if (name.length > 2 && name.indexOf('on') === 0 && raw.indexOf('{{') >= 0) {
        var fn = value(raw, scope);
        if (typeof fn === 'function') {
          var ev = name.slice(2);
          if (ev === 'change' && (tag === 'textarea' || (tag === 'input' && !/checkbox|radio/.test(node.getAttribute('type') || '')))) ev = 'input';
          el.addEventListener(ev, fn);
        }
        continue;
      }
      var v = raw.indexOf('{{') >= 0 ? value(raw, scope) : raw;
      if (PROPS[name] && (tag === 'input' || tag === 'textarea' || tag === 'option' || tag === 'select')) {
        if (name === 'value') el.value = v == null ? '' : String(v);
        else el[name] = !(v === false || v == null || v === 'false');
        if (name !== 'value' && el[name]) el.setAttribute(name, '');
        continue;
      }
      if (v === false || v == null) continue;
      el.setAttribute(name, v === true ? '' : String(v));
    }
    var src = node.localName === 'template' ? node.content : node;
    renderChildren(src, scope, el);
    if (tag === 'textarea' && node.hasAttribute('value')) el.value = String(value(node.getAttribute('value'), scope) || '');
    parent.appendChild(el);
  }

  function pathOf(el) {
    var p = [];
    while (el && el !== mount) { var i = 0, s = el; while ((s = s.previousElementSibling)) i++; p.unshift(i); el = el.parentElement; }
    return el === mount ? p : null;
  }
  function byPath(p) {
    var el = mount;
    for (var i = 0; i < p.length && el; i++) el = el.children[p[i]];
    return el;
  }

  function render() {
    var vals = inst.renderVals() || {};
    var active = document.activeElement, keep = null;
    if (active && mount.contains(active)) {
      keep = { path: pathOf(active) };
      try { keep.s = active.selectionStart; keep.e = active.selectionEnd; } catch (err) { /* không hỗ trợ */ }
    }
    var frag = document.createDocumentFragment();
    renderChildren(tplRoot, vals, frag);
    mount.replaceChildren(frag);
    if (keep && keep.path) {
      var el = byPath(keep.path);
      if (el && el.focus) { el.focus({ preventScroll: true }); try { if (keep.s != null) el.setSelectionRange(keep.s, keep.e); } catch (err) { /* bỏ qua */ } }
    }
  }

  function readProps(script) {
    var props = {}, defs = {};
    try { defs = JSON.parse(script.getAttribute('data-props') || '{}'); } catch (e) { console.warn('data-props không hợp lệ', e); }
    Object.keys(defs).forEach(function (k) { if (k.charAt(0) !== '$' && defs[k] && 'default' in defs[k]) props[k] = defs[k].default; });
    // Cho phép đổi trạng thái demo qua URL, ví dụ: BaiCuaToi.dc.html?stage=Kết quả
    new URLSearchParams(location.search).forEach(function (v, k) {
      if (!(k in defs)) return;
      props[k] = v === 'true' ? true : v === 'false' ? false : (v !== '' && !isNaN(v) && defs[k].editor !== 'enum' ? Number(v) : v);
    });
    return props;
  }

  function boot() {
    var tpl = document.getElementById('dc-template');
    var script = document.querySelector('script[type="text/x-dc"]');
    mount = document.getElementById('dc-root');
    if (!tpl || !script || !mount) return;
    tplRoot = tpl.content;
    var Component = new Function('DCLogic', script.textContent + '\nreturn Component;')(DCLogic);
    inst = new Component(readProps(script));
    if (!inst.state) inst.state = {};
    render();
    if (typeof inst.componentDidMount === 'function') inst.componentDidMount();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
