// Boots the page: chooses the style, renders it, and listens for live
// previews from editor.html when opened with ?preview=1.
(function () {
  const P = window.Portfolio;
  const root = document.documentElement;
  const app = document.getElementById('app');
  const params = new URLSearchParams(location.search);
  const isPreview = params.has('preview');
  let unmount = null;
  let renderedOnce = false;

  function render(rawContent, { styleOverride } = {}) {
    const content = P.normalize(rawContent);
    const urlStyle = params.get('style');
    const style = styleOverride || (urlStyle === 'classic' || urlStyle === 'motion' ? urlStyle : content.settings.style);
    const renderer = P.renderers[style] || P.renderers.motion;
    const finalStyle = P.renderers[style] ? style : 'motion';

    const sheet = document.getElementById('style-sheet');
    const href = `css/${finalStyle}.css`;
    if (!sheet.getAttribute('href').endsWith(href)) sheet.setAttribute('href', href);

    const styleChanged = root.dataset.style !== finalStyle;
    root.dataset.style = finalStyle;
    if (!renderedOnce || styleChanged || isPreview) {
      if (!renderer.themes.includes(root.dataset.theme) || isPreview) root.dataset.theme = content.settings.theme;
    }

    const scroll = window.scrollY;
    if (unmount) unmount();
    unmount = renderer.mount(app, content, {
      // In the editor preview, skip entrance animations after the first render
      // so the page does not replay them on every keystroke.
      skipIntro: isPreview && renderedOnce,
      onThemeChange: () => {},
    });
    if (renderedOnce) window.scrollTo(0, scroll);
    renderedOnce = true;

    // Jump to the #section in the URL once content exists.
    if (!isPreview && location.hash && !render.jumped) {
      render.jumped = true;
      const target = document.getElementById(location.hash.slice(1));
      if (target) target.scrollIntoView();
    }
  }

  if (isPreview && window.parent !== window) {
    window.addEventListener('message', event => {
      if (event.source !== window.parent) return;
      if (location.origin !== 'null' && event.origin !== location.origin) return;
      const data = event.data || {};
      if (data.type !== 'portfolio:update') return;
      P.setAssetOverrides(data.assets);
      render(data.content);
    });
    window.parent.postMessage({ type: 'portfolio:ready' }, location.origin === 'null' ? '*' : location.origin);
  }

  render(window.portfolioContent || {});
})();
