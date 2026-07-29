import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Renders admin-authored JSX inside a sandboxed <iframe>.
 *
 * Why an iframe: the code is written by platform admins, but it still must not
 * run in the app's own JS context — `sandbox="allow-scripts"` (without
 * allow-same-origin) means it can't reach the app's DOM, cookies, or the JWT in
 * localStorage, and a crash inside it can't take the page down. React + Babel
 * are loaded from a CDN inside the frame, so the main bundle stays lean.
 *
 * Author contract (shown in the admin editor): either write a single JSX
 * expression, or define `function App() { ... }` and it will be rendered.
 * React hooks are available as bare names (useState, useEffect, …).
 */
const buildSrcDoc = (code, blockId, dark) => {
  const CODE = JSON.stringify(code || '');
  return `<!doctype html><html><head><meta charset="utf-8">
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 2px;
    font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
    font-size: 15px; line-height: 1.5;
    color: ${dark ? '#f4f2ef' : '#171614'};
    background: transparent;
  }
</style>
<script src="https://unpkg.com/react@18.3.1/umd/react.production.min.js"><\/script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"><\/script>
<script src="https://unpkg.com/@babel/standalone@7.26.4/babel.min.js"><\/script>
</head><body><div id="root"></div>
<script>
(function () {
  var CODE = ${CODE};
  var BLOCK_ID = ${JSON.stringify(blockId)};
  function report() {
    var h = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    parent.postMessage({ type: 'react-block-height', id: BLOCK_ID, height: h }, '*');
  }
  function fail(msg) {
    document.getElementById('root').innerHTML =
      '<div style="color:#b3405a;font:12.5px/1.5 ui-monospace,monospace;padding:12px 14px;border:1px solid rgba(179,64,90,.3);border-radius:10px;background:rgba(179,64,90,.06);white-space:pre-wrap;">Component error: '
      + String(msg).replace(/&/g,'&amp;').replace(/</g,'&lt;') + '</div>';
    setTimeout(report, 30);
  }
  try {
    var HOOKS = 'var useState=React.useState,useEffect=React.useEffect,useRef=React.useRef,useMemo=React.useMemo,useCallback=React.useCallback,useReducer=React.useReducer,useContext=React.useContext,Fragment=React.Fragment;';
    var element = null, Comp = null;
    try {
      // Attempt 1: the whole snippet is a single JSX expression
      var exprSrc = Babel.transform('(' + CODE + ')', { presets: ['react'] }).code;
      var result = new Function('React', HOOKS + 'return ' + exprSrc + ';')(React);
      if (typeof result === 'function') Comp = result; else element = result;
    } catch (_) {
      // Attempt 2: statements — expect a component named App (or exports.default)
      var src = Babel.transform(CODE, { presets: ['react'] }).code;
      var exportsObj = {};
      Comp = new Function('React', 'exports',
        HOOKS + src + '\\n;return (typeof App !== "undefined") ? App : exports.default;'
      )(React, exportsObj);
    }
    if (!element && Comp) element = React.createElement(Comp);
    if (!element || !React.isValidElement(element)) {
      throw new Error('Write a single JSX expression, or define a component named App.');
    }
    ReactDOM.createRoot(document.getElementById('root')).render(element);
    setTimeout(report, 50);
    setTimeout(report, 400);
    setTimeout(report, 1200);
    if (window.ResizeObserver) new ResizeObserver(report).observe(document.body);
  } catch (err) {
    fail(err && err.message ? err.message : err);
  }
})();
<\/script></body></html>`;
};

const ReactBlock = ({ code }) => {
  const blockId = useMemo(() => `rb-${Math.random().toString(36).slice(2)}`, []);
  const [height, setHeight] = useState(80);
  const frameRef = useRef(null);

  const dark = typeof document !== 'undefined'
    && document.documentElement.getAttribute('data-theme') === 'dark';

  const srcDoc = useMemo(() => buildSrcDoc(code, blockId, dark), [code, blockId, dark]);

  useEffect(() => {
    const onMessage = (e) => {
      if (e.data?.type === 'react-block-height' && e.data.id === blockId) {
        setHeight(Math.min(2400, Math.max(40, e.data.height)));
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [blockId]);

  return (
    <iframe
      ref={frameRef}
      title="Interactive content"
      sandbox="allow-scripts"
      srcDoc={srcDoc}
      style={{ width: '100%', height, border: 'none', display: 'block', background: 'transparent' }}
    />
  );
};

export default ReactBlock;
