// Portfolio editor: edits content.js through a form, previews live, and
// publishes to GitHub with a personal access token.
(function () {
  const P = window.Portfolio;
  const { el } = P;

  const DRAFT_KEY = 'portfolio-editor:draft';
  const REPO_KEY = 'portfolio-editor:repo';
  const TOKEN_KEY = 'portfolio-editor:token';
  const MAX_IMAGE_SIDE = 1600;

  const published = P.normalize(window.portfolioContent || {});
  let publishedJson = JSON.stringify(published);
  let content = clone(published);
  let pending = {};          // { "assets/uploads/x.jpg": { base64, dataUrl, bytes } }
  const openState = new Set(['style']);

  const form = document.getElementById('form');
  const frame = document.getElementById('preview');
  const saveState = document.getElementById('save-state');

  /* ---------- helpers ---------- */

  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  function getPath(obj, path) {
    return path.split('.').reduce((value, key) => (value == null ? undefined : value[key]), obj);
  }

  function setPath(obj, path, value) {
    const keys = path.split('.');
    let target = obj;
    keys.slice(0, -1).forEach(key => {
      if (typeof target[key] !== 'object' || target[key] === null) target[key] = {};
      target = target[key];
    });
    target[keys[keys.length - 1]] = value;
  }

  function slug(text) {
    return String(text || 'file').toLowerCase().replace(/\.[a-z0-9]+$/, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'file';
  }

  function debounce(fn, ms) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
  }

  function bytesLabel(bytes) {
    return bytes > 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1e3))} KB`;
  }

  function utf8ToBase64(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(binary);
  }

  /* ---------- draft and preview ---------- */

  function isDirty() {
    return JSON.stringify(content) !== publishedJson || Object.keys(pending).length > 0;
  }

  function updateState(text) {
    saveState.textContent = text || (isDirty() ? 'Unpublished changes (saved in this browser)' : 'Up to date with content.js');
    saveState.classList.toggle('dirty', isDirty());
  }

  function saveDraft() {
    if (!isDirty()) {
      localStorage.removeItem(DRAFT_KEY);
      updateState();
      return;
    }
    const draft = { content, savedAt: Date.now(), base: publishedJson };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(Object.assign({ pending }, draft)));
      updateState();
    } catch (error) {
      // Uploaded files can exceed browser storage. Keep text edits at least.
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch (ignored) { /* storage full */ }
      updateState('Unpublished changes. Uploaded files are too large to keep after closing this tab, so publish before leaving.');
    }
  }

  function assetMap() {
    const map = {};
    Object.keys(pending).forEach(path => { map[path] = pending[path].dataUrl; });
    return map;
  }

  function sendPreview() {
    if (!frame.contentWindow) return;
    const target = location.origin === 'null' ? '*' : location.origin;
    frame.contentWindow.postMessage({ type: 'portfolio:update', content: clone(content), assets: assetMap() }, target);
  }

  const schedulePreview = debounce(sendPreview, 120);
  const scheduleSave = debounce(saveDraft, 300);

  function changed({ rerender } = {}) {
    if (rerender) renderForm();
    schedulePreview();
    scheduleSave();
    updateState();
    syncStyleButtons();
  }

  window.addEventListener('message', event => {
    if (event.source !== frame.contentWindow) return;
    if (event.data && event.data.type === 'portfolio:ready') sendPreview();
  });

  /* ---------- schema ---------- */

  const MOTION = 'Motion style only.';
  const ACCENT = 'Wrap words in [brackets] to highlight them.';

  const SECTIONS = [
    {
      id: 'style', title: 'Style and theme', fields: [
        { path: 'settings.style', label: 'Site style', type: 'radio', options: [['motion', 'Motion: animated, scroll transitions'], ['classic', 'Classic: the original layout']] },
        { path: 'settings.theme', label: 'Default color theme', type: 'select', options: [['light', 'Light'], ['dark', 'Dark'], ['blue', 'Blue (Classic only, Motion shows Dark)']] },
      ],
    },
    {
      id: 'profile', title: 'Profile and hero', fields: [
        { path: 'profile.name', label: 'Name' },
        { path: 'profile.tagline', label: 'Tagline', placeholder: 'Electrical Engineering · Waterloo' },
        { path: 'profile.status', label: 'Current status' },
        { path: 'profile.headline', label: 'Hero headline', hint: `${MOTION} ${ACCENT}` },
        { path: 'profile.intro', label: 'Hero intro', type: 'textarea', hint: MOTION },
        { path: 'profile.resumeLabel', label: 'Resume button text' },
        { path: 'profile.resumeUrl', label: 'Resume link', type: 'file', accept: 'application/pdf', hint: 'Paste a link, or upload a PDF.' },
      ],
    },
    {
      id: 'about', title: 'About', fields: [
        { path: 'about.title', label: 'Section title' },
        { path: 'about.headline', label: 'Big headline', hint: `${MOTION} ${ACCENT}` },
        { path: 'about.paragraphs', label: 'Paragraphs', type: 'strings', multiline: true, addLabel: 'Add paragraph' },
      ],
    },
    {
      id: 'projects', title: 'Projects', fields: [
        { path: 'projects.title', label: 'Section title' },
        { path: 'projects.intro', label: 'Intro line', hint: MOTION },
        {
          path: 'projects.items', label: 'Projects', type: 'list', itemTitle: item => item.title || 'Untitled project', addLabel: 'Add project',
          newItem: () => ({ title: 'New project', category: '', image: '', imageAlt: '', link: '', description: '' }),
          fields: [
            { path: 'title', label: 'Title' },
            { path: 'category', label: 'Category' },
            { path: 'image', label: 'Cover image', type: 'image' },
            { path: 'imageAlt', label: 'Image description', hint: 'Short description for screen readers.' },
            { path: 'link', label: 'Project link', type: 'url' },
            { path: 'description', label: 'Description', type: 'textarea' },
          ],
        },
      ],
    },
    {
      id: 'experience', title: 'Experience', fields: [
        { path: 'experience.title', label: 'Section title' },
        { path: 'experience.intro', label: 'Intro line', hint: MOTION },
        {
          path: 'experience.items', label: 'Jobs', type: 'list', itemTitle: item => item.company || 'Untitled job', addLabel: 'Add job',
          newItem: () => ({ company: 'New company', logo: '', role: '', bullets: [''] }),
          fields: [
            { path: 'company', label: 'Company' },
            { path: 'logo', label: 'Company logo', type: 'image' },
            { path: 'role', label: 'Role and dates' },
            { path: 'bullets', label: 'Bullet points', type: 'strings', multiline: true, addLabel: 'Add bullet' },
          ],
        },
      ],
    },
    {
      id: 'keywords', title: 'Focus areas', fields: [
        { path: 'keywords', label: 'Keywords', type: 'strings', addLabel: 'Add keyword', hint: 'Shown in the scrolling banner, the about chips and the footer.' },
      ],
    },
    {
      id: 'contact', title: 'Contact and links', fields: [
        { path: 'contact.title', label: 'Headline', hint: `${MOTION} ${ACCENT}` },
        { path: 'contact.text', label: 'Text', type: 'textarea', hint: MOTION },
        { path: 'contact.email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
        {
          path: 'contact.links', label: 'Links', type: 'list', itemTitle: item => item.label || 'New link', addLabel: 'Add link',
          newItem: () => ({ label: 'LinkedIn', url: 'https://' }),
          fields: [
            { path: 'label', label: 'Label' },
            { path: 'url', label: 'URL', type: 'url' },
          ],
        },
      ],
    },
    {
      id: 'footer', title: 'Footer', fields: [
        { path: 'footer.text', label: 'Footer text' },
      ],
    },
  ];

  /* ---------- form rendering ---------- */

  let fieldId = 0;

  function renderForm() {
    const scroll = form.scrollTop;
    form.replaceChildren(...SECTIONS.map(section => {
      const details = el('details', { class: 'ed-section', open: openState.has(section.id) }, [
        el('summary', { text: section.title }),
        el('div', { class: 'ed-section-body' }, section.fields.map(field => renderField(field, content, section.id))),
      ]);
      details.addEventListener('toggle', () => {
        if (details.open) openState.add(section.id); else openState.delete(section.id);
      });
      return details;
    }));
    form.scrollTop = scroll;
  }

  function wrap(field, control, id) {
    return el('div', { class: 'ed-field' }, [
      el('label', { class: 'ed-label', for: id, text: field.label }),
      control,
      field.hint ? el('p', { class: 'ed-hint', text: field.hint }) : null,
    ]);
  }

  function renderField(field, obj, key) {
    const id = `f${fieldId++}`;
    const value = getPath(obj, field.path);
    const type = field.type || 'text';

    if (type === 'list') return renderList(field, obj, `${key}.${field.path}`);
    if (type === 'strings') return renderStrings(field, obj, id);

    if (type === 'radio') {
      return el('fieldset', { class: 'ed-field ed-radios' }, [
        el('legend', { class: 'ed-label', text: field.label }),
        ...field.options.map(([optionValue, label]) => {
          const input = el('input', { type: 'radio', name: id, value: optionValue, checked: value === optionValue });
          input.addEventListener('change', () => { setPath(obj, field.path, optionValue); changed(); });
          return el('label', { class: 'ed-check' }, [input, ' ', label]);
        }),
      ]);
    }

    if (type === 'select') {
      const select = el('select', { id }, field.options.map(([optionValue, label]) =>
        el('option', { value: optionValue, selected: value === optionValue, text: label })));
      select.addEventListener('change', () => { setPath(obj, field.path, select.value); changed(); });
      return wrap(field, select, id);
    }

    const input = type === 'textarea'
      ? el('textarea', { id, rows: 3 })
      : el('input', { id, type: type === 'image' || type === 'file' ? 'text' : type, placeholder: field.placeholder || (type === 'url' ? 'https://' : null) });
    input.value = value || '';
    if (type === 'textarea') autoGrow(input);

    if (type === 'image' || type === 'file') return renderUpload(field, obj, input, id);

    input.addEventListener('input', () => {
      setPath(obj, field.path, input.value);
      if (type === 'textarea') autoGrow(input);
      changed();
      refreshListTitles();
    });
    return wrap(field, input, id);
  }

  function autoGrow(textarea) {
    requestAnimationFrame(() => {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight + 2}px`;
    });
  }

  function renderUpload(field, obj, input, id) {
    const isImage = field.type === 'image';
    const thumb = isImage ? el('img', { class: 'ed-thumb', alt: '' }) : null;
    const updateThumb = () => {
      if (!thumb) return;
      const path = input.value.trim();
      thumb.hidden = !path;
      if (path) thumb.src = pending[path] ? pending[path].dataUrl : P.safeUrl(path);
    };
    updateThumb();

    input.addEventListener('input', () => { setPath(obj, field.path, input.value.trim()); updateThumb(); changed(); });

    const picker = el('input', { type: 'file', accept: field.accept || 'image/*', hidden: true });
    const uploadBtn = el('button', { type: 'button', class: 'ed-btn ed-btn-small', text: isImage ? 'Upload image' : 'Upload file' });
    uploadBtn.addEventListener('click', () => picker.click());
    picker.addEventListener('change', async () => {
      const file = picker.files && picker.files[0];
      if (!file) return;
      uploadBtn.disabled = true;
      uploadBtn.textContent = 'Processing…';
      try {
        const stored = isImage ? await prepareImage(file) : await prepareFile(file);
        pending[stored.path] = stored;
        input.value = stored.path;
        setPath(obj, field.path, stored.path);
        updateThumb();
        changed();
      } catch (error) {
        alert(`Could not read that file: ${error.message}`);
      } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = isImage ? 'Upload image' : 'Upload file';
        picker.value = '';
      }
    });

    return el('div', { class: 'ed-field' }, [
      el('label', { class: 'ed-label', for: id, text: field.label }),
      el('div', { class: 'ed-upload' }, [thumb, el('div', { class: 'ed-upload-controls' }, [input, el('div', { class: 'ed-upload-row' }, [uploadBtn, picker])])]),
      el('p', { class: 'ed-hint', text: field.hint || 'Paste an image URL or a path such as assets/photo.jpg, or upload a new image.' }),
    ]);
  }

  function readAsDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error('read failed'));
      reader.readAsDataURL(blob);
    });
  }

  function toStored(path, dataUrl) {
    const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
    return { path, dataUrl, base64, bytes: Math.round(base64.length * 0.75) };
  }

  // Scale large photos down so the site stays fast. SVG and GIF are kept as-is.
  async function prepareImage(file) {
    if (!/^image\//.test(file.type)) throw new Error('please choose an image file');
    const stamp = Date.now().toString(36);
    const original = await readAsDataUrl(file);
    if (/svg|gif/.test(file.type)) {
      const ext = file.type.includes('svg') ? 'svg' : 'gif';
      return toStored(`assets/uploads/${slug(file.name)}-${stamp}.${ext}`, original);
    }
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('unsupported image'));
      img.src = original;
    });
    const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
    const keepPng = file.type === 'image/png';
    if (scale === 1 && (keepPng || file.type === 'image/jpeg' || file.type === 'image/webp')) {
      const ext = keepPng ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
      return toStored(`assets/uploads/${slug(file.name)}-${stamp}.${ext}`, original);
    }
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL(keepPng ? 'image/png' : 'image/jpeg', 0.86);
    return toStored(`assets/uploads/${slug(file.name)}-${stamp}.${keepPng ? 'png' : 'jpg'}`, dataUrl);
  }

  async function prepareFile(file) {
    if (file.size > 50e6) throw new Error('file is larger than 50 MB');
    const ext = (file.name.match(/\.([a-z0-9]+)$/i) || [, 'pdf'])[1].toLowerCase();
    return toStored(`assets/${slug(file.name)}.${ext}`, await readAsDataUrl(file));
  }

  function renderStrings(field, obj, id) {
    const values = getPath(obj, field.path) || [];
    if (!Array.isArray(getPath(obj, field.path))) setPath(obj, field.path, values);
    const rows = values.map((text, index) => {
      const input = field.multiline ? el('textarea', { rows: 2, 'aria-label': `${field.label} ${index + 1}` }) : el('input', { type: 'text', 'aria-label': `${field.label} ${index + 1}` });
      input.value = text;
      if (field.multiline) autoGrow(input);
      input.addEventListener('input', () => {
        values[index] = input.value;
        if (field.multiline) autoGrow(input);
        changed();
      });
      return el('div', { class: 'ed-string' }, [input, itemTools(values, index, () => changed({ rerender: true }))]);
    });
    const add = el('button', { type: 'button', class: 'ed-btn ed-btn-small', text: `+ ${field.addLabel || 'Add'}` });
    add.addEventListener('click', () => { values.push(''); changed({ rerender: true }); });
    return el('div', { class: 'ed-field' }, [
      el('span', { class: 'ed-label', id, text: field.label }),
      el('div', { class: 'ed-strings', role: 'group', 'aria-labelledby': id }, rows),
      add,
      field.hint ? el('p', { class: 'ed-hint', text: field.hint }) : null,
    ]);
  }

  function itemTools(array, index, after, confirmText) {
    const button = (label, title, action, disabled) => {
      const b = el('button', { type: 'button', class: 'ed-icon', title, 'aria-label': title, text: label, disabled });
      b.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        if (title === 'Delete' && confirmText && !confirm(confirmText)) return;
        action();
        after();
      });
      return b;
    };
    return el('div', { class: 'ed-tools' }, [
      button('↑', 'Move up', () => { [array[index - 1], array[index]] = [array[index], array[index - 1]]; }, index === 0),
      button('↓', 'Move down', () => { [array[index + 1], array[index]] = [array[index], array[index + 1]]; }, index === array.length - 1),
      button('×', 'Delete', () => array.splice(index, 1)),
    ]);
  }

  function renderList(field, obj, key) {
    let items = getPath(obj, field.path);
    if (!Array.isArray(items)) { items = []; setPath(obj, field.path, items); }
    const cards = items.map((item, index) => {
      const itemKey = `${key}.${index}`;
      const tools = itemTools(items, index, () => changed({ rerender: true }), `Delete "${field.itemTitle(item)}"?`);
      const details = el('details', { class: 'ed-item', open: openState.has(itemKey) }, [
        el('summary', null, [
          el('span', { class: 'ed-item-title', 'data-list-title': '', text: `${P.pad(index + 1)}  ${field.itemTitle(item)}` }),
          tools,
        ]),
        el('div', { class: 'ed-item-body' }, field.fields.map(sub => renderField(sub, item, itemKey))),
      ]);
      details._title = () => `${P.pad(index + 1)}  ${field.itemTitle(item)}`;
      details.addEventListener('toggle', () => {
        if (details.open) openState.add(itemKey); else openState.delete(itemKey);
      });
      return details;
    });
    const add = el('button', { type: 'button', class: 'ed-btn ed-btn-small', text: `+ ${field.addLabel || 'Add'}` });
    add.addEventListener('click', () => {
      items.push(field.newItem());
      openState.add(`${key}.${items.length - 1}`);
      changed({ rerender: true });
    });
    return el('div', { class: 'ed-field' }, [el('span', { class: 'ed-label', text: field.label }), el('div', { class: 'ed-list' }, cards), add]);
  }

  function refreshListTitles() {
    form.querySelectorAll('.ed-item').forEach(details => {
      const title = details.querySelector('[data-list-title]');
      if (title && details._title) title.textContent = details._title();
    });
  }

  /* ---------- top bar ---------- */

  const styleButtons = [...document.querySelectorAll('[data-style-choice]')];
  function syncStyleButtons() {
    styleButtons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.styleChoice === content.settings.style)));
  }
  styleButtons.forEach(button => button.addEventListener('click', () => {
    content.settings.style = button.dataset.styleChoice;
    changed({ rerender: true });
  }));

  const deviceButtons = [...document.querySelectorAll('[data-device]')];
  deviceButtons.forEach(button => button.addEventListener('click', () => {
    document.getElementById('frame-wrap').dataset.device = button.dataset.device;
    deviceButtons.forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  }));

  function serialize() {
    return [
      '/* PORTFOLIO CONTENT',
      ' * The easiest way to change this file is the editor: open editor.html.',
      ' * The editor rewrites this file when you click "Publish".',
      ' * You can still edit it by hand. Keep the JSON-style structure intact.',
      ' *',
      ' * Headlines: wrap words in [square brackets] to highlight them in the',
      ' * Motion style, for example "Let\'s [build] something."',
      ' */',
      `window.portfolioContent = ${JSON.stringify(content, null, 2)};`,
      '',
    ].join('\n');
  }

  document.getElementById('download-btn').addEventListener('click', () => {
    const blob = new Blob([serialize()], { type: 'text/javascript' });
    const a = el('a', { href: URL.createObjectURL(blob), download: 'content.js' });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    const uploads = Object.keys(pending);
    if (uploads.length) {
      alert(`content.js downloaded. It refers to ${uploads.length} uploaded file(s) that only exist in this editor:\n\n${uploads.join('\n')}\n\nUse Publish to upload them, or add those files to the repository yourself.`);
    }
  });

  /* ---------- draft restore ---------- */

  const banner = document.getElementById('draft-banner');
  function restoreDraft() {
    let draft = null;
    try { draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch (error) { draft = null; }
    if (!draft || !draft.content) return;
    const draftContent = P.normalize(draft.content);
    const sameAsPublished = JSON.stringify(draftContent) === publishedJson && !Object.keys(draft.pending || {}).length;
    // The draft was published and the site now serves it: nothing to restore.
    if (sameAsPublished) { localStorage.removeItem(DRAFT_KEY); return; }
    content = draftContent;
    pending = draft.pending || {};
    if (draft.publishedAt) publishedJson = JSON.stringify(draftContent);
    const when = new Date(draft.savedAt).toLocaleString();
    document.getElementById('draft-text').textContent = draft.publishedAt
      ? `Showing changes you published ${new Date(draft.publishedAt).toLocaleString()}. The live site may take a minute to catch up.`
      : `Restored unpublished changes from ${when}.`;
    banner.hidden = false;
  }

  document.getElementById('discard-btn').addEventListener('click', () => {
    if (!confirm('Discard all unpublished changes and reload content.js?')) return;
    localStorage.removeItem(DRAFT_KEY);
    content = clone(published);
    publishedJson = JSON.stringify(published);
    pending = {};
    banner.hidden = true;
    changed({ rerender: true });
  });

  window.addEventListener('beforeunload', event => {
    if (Object.keys(pending).length) { event.preventDefault(); event.returnValue = ''; }
  });

  /* ---------- publish to GitHub ---------- */

  const dialog = document.getElementById('publish-dialog');
  const publishForm = document.getElementById('publish-form');
  const publishStatus = document.getElementById('publish-status');

  function defaultRepo() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(REPO_KEY) || '{}'); } catch (error) { saved = {}; }
    const host = location.hostname.match(/^([a-z0-9-]+)\.github\.io$/i);
    const firstPath = location.pathname.split('/').filter(Boolean)[0];
    const guess = host
      ? { owner: host[1], repo: firstPath && !/\.html$/.test(firstPath) ? firstPath : `${host[1]}.github.io` }
      : { owner: 'arnaved0', repo: 'arnav' };
    return Object.assign({ branch: 'main' }, guess, saved);
  }

  function storedToken() {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || '';
  }

  document.getElementById('publish-btn').addEventListener('click', () => {
    const repo = defaultRepo();
    publishForm.owner.value = repo.owner;
    publishForm.repo.value = repo.repo;
    publishForm.branch.value = repo.branch;
    publishForm.token.value = storedToken();
    publishForm.remember.checked = Boolean(localStorage.getItem(TOKEN_KEY));
    publishForm.message.value = 'Update portfolio content';
    const files = [['content.js', new Blob([serialize()]).size], ...Object.keys(pending).map(path => [path, pending[path].bytes])];
    document.getElementById('publish-files').replaceChildren(
      el('li', { class: 'ed-hint', text: 'Files in this commit:' }),
      ...files.map(([path, size]) => el('li', null, [el('code', { text: path }), ` ${bytesLabel(size)}`])));
    publishStatus.textContent = isDirty() ? '' : 'No changes since content.js was loaded. Publishing will still write the current content.';
    publishStatus.className = 'ed-publish-status';
    dialog.showModal();
  });

  document.getElementById('publish-cancel').addEventListener('click', () => dialog.close());
  document.getElementById('forget-token').addEventListener('click', () => {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    publishForm.token.value = '';
    publishForm.remember.checked = false;
    publishStatus.textContent = 'Token removed from this browser.';
  });

  async function github(token, method, path, body) {
    const response = await fetch(`https://api.github.com${path}`, {
      method,
      headers: Object.assign({
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      }, body ? { 'Content-Type': 'application/json' } : {}),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      const hints = {
        401: 'The token is invalid or expired.',
        403: 'The token does not have Contents write access to this repository.',
        404: 'Repository or branch not found, or the token cannot see it.',
        409: 'The repository is empty or the branch changed. Try again.',
        422: 'GitHub rejected the update. The branch may have moved; try again.',
      };
      throw new Error(`${hints[response.status] || 'GitHub request failed.'} (${response.status} ${detail.message || response.statusText})`);
    }
    return response.json();
  }

  publishForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (!publishForm.reportValidity()) return;
    const owner = publishForm.owner.value.trim();
    const repo = publishForm.repo.value.trim();
    const branch = publishForm.branch.value.trim();
    const token = publishForm.token.value.trim();
    const message = publishForm.message.value.trim() || 'Update portfolio content';

    localStorage.setItem(REPO_KEY, JSON.stringify({ owner, repo, branch }));
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    (publishForm.remember.checked ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);

    const go = document.getElementById('publish-go');
    go.disabled = true;
    const step = text => { publishStatus.textContent = text; publishStatus.className = 'ed-publish-status'; };

    try {
      const base = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
      const refPath = branch.split('/').map(encodeURIComponent).join('/');
      step('Reading branch…');
      const ref = await github(token, 'GET', `${base}/git/ref/heads/${refPath}`);
      const parent = await github(token, 'GET', `${base}/git/commits/${ref.object.sha}`);

      const files = [{ path: 'content.js', base64: utf8ToBase64(serialize()) }]
        .concat(Object.keys(pending).map(path => ({ path, base64: pending[path].base64 })));
      const tree = [];
      for (let i = 0; i < files.length; i++) {
        step(`Uploading ${files[i].path} (${i + 1} of ${files.length})…`);
        const blob = await github(token, 'POST', `${base}/git/blobs`, { content: files[i].base64, encoding: 'base64' });
        tree.push({ path: files[i].path, mode: '100644', type: 'blob', sha: blob.sha });
      }

      step('Creating commit…');
      const newTree = await github(token, 'POST', `${base}/git/trees`, { base_tree: parent.tree.sha, tree });
      const commit = await github(token, 'POST', `${base}/git/commits`, { message, tree: newTree.sha, parents: [ref.object.sha] });
      await github(token, 'PATCH', `${base}/git/refs/heads/${refPath}`, { sha: commit.sha });

      // Keep the published content as a draft until the live content.js catches up.
      pending = {};
      publishedJson = JSON.stringify(content);
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ content, savedAt: Date.now(), publishedAt: Date.now() }));
      updateState('Published. The live site updates in about a minute.');

      publishStatus.replaceChildren('Published. ', el('a', { href: commit.html_url || `https://github.com/${owner}/${repo}/commit/${commit.sha}`, target: '_blank', rel: 'noopener', text: 'View commit →' }));
      publishStatus.className = 'ed-publish-status ok';
    } catch (error) {
      publishStatus.textContent = error.message;
      publishStatus.className = 'ed-publish-status error';
    } finally {
      go.disabled = false;
    }
  });

  /* ---------- start ---------- */

  restoreDraft();
  renderForm();
  syncStyleButtons();
  updateState();
  if (frame.contentDocument && frame.contentDocument.readyState === 'complete') sendPreview();
})();
