// Shared helpers for both page styles. All text is inserted with textContent,
// so content from the editor can never inject HTML.
(function () {
  const assetOverrides = {};

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(key => {
        const value = attrs[key];
        if (value === undefined || value === null || value === false) return;
        if (key === 'class') node.className = value;
        else if (key === 'text') node.textContent = value;
        else if (key === 'style') node.setAttribute('style', value);
        else node.setAttribute(key, value === true ? '' : value);
      });
    }
    append(node, children);
    return node;
  }

  function append(node, children) {
    if (children === undefined || children === null) return node;
    (Array.isArray(children) ? children : [children]).forEach(child => {
      if (child === undefined || child === null || child === false) return;
      if (Array.isArray(child)) { append(node, child); return; }
      node.append(child instanceof Node ? child : document.createTextNode(String(child)));
    });
    return node;
  }

  // Allow http(s), mailto, tel, data images and relative paths. Block javascript: and similar.
  function safeUrl(value) {
    const url = String(value || '').trim();
    if (!url) return '';
    if (/^(https?:|mailto:|tel:)/i.test(url)) return url;
    if (/^data:image\//i.test(url)) return url;
    if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return '';
    return url;
  }

  // Images uploaded in the editor are previewed before they are published.
  function asset(path) {
    const key = String(path || '').trim();
    return assetOverrides[key] || safeUrl(key);
  }

  function setAssetOverrides(map) {
    Object.keys(assetOverrides).forEach(key => delete assetOverrides[key]);
    Object.assign(assetOverrides, map || {});
  }

  function isExternal(url) {
    return /^https?:/i.test(url || '');
  }

  function link(attrs, children) {
    const href = safeUrl(attrs.href);
    const finalAttrs = Object.assign({}, attrs, { href: href || null });
    if (isExternal(href) || /\.pdf($|\?)/i.test(href)) {
      finalAttrs.target = '_blank';
      finalAttrs.rel = 'noopener noreferrer';
    }
    return el(href ? 'a' : 'span', finalAttrs, children);
  }

  // "Hello [world]" -> ["Hello ", <span class=accent>world</span>]
  function headline(text, accentClass) {
    const parts = [];
    String(text || '').split(/(\[[^\]]*\])/).forEach(part => {
      if (!part) return;
      if (part[0] === '[' && part[part.length - 1] === ']') {
        parts.push(el('span', { class: accentClass || 'accent', text: part.slice(1, -1) }));
      } else {
        parts.push(part);
      }
    });
    return parts;
  }

  function plain(text) {
    return String(text || '').replace(/[[\]]/g, '');
  }

  function pad(number) {
    return String(number).padStart(2, '0');
  }

  function list(value) {
    return Array.isArray(value) ? value : [];
  }

  // Fill missing sections so an older or partly edited content file still renders.
  function normalize(raw) {
    const content = raw || {};
    const object = value => (value && typeof value === 'object' && !Array.isArray(value) ? value : {});
    const projects = Array.isArray(content.projects) ? { items: content.projects } : object(content.projects);
    const experience = object(content.experience);
    if (!experience.items && Array.isArray(content.experiences)) experience.items = content.experiences;
    return {
      settings: Object.assign({ style: 'motion', theme: 'light' }, object(content.settings)),
      profile: object(content.profile),
      about: Object.assign({ title: 'About me' }, object(content.about), { paragraphs: list(object(content.about).paragraphs) }),
      projects: Object.assign({ title: 'Projects' }, projects, { items: list(projects.items) }),
      experience: Object.assign({ title: 'Experience' }, experience, { items: list(experience.items) }),
      keywords: list(content.keywords),
      contact: Object.assign({}, object(content.contact), { links: list(object(content.contact).links) }),
      footer: object(content.footer),
    };
  }

  window.Portfolio = {
    el, append, safeUrl, asset, setAssetOverrides, isExternal, link, headline, plain, pad, list, normalize,
    renderers: {},
    reducedMotion: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  };
})();
