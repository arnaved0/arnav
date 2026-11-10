// Classic style: the original single-page layout with Light / Dark / Blue themes.
(function () {
  const { el, link, asset, plain, pad } = window.Portfolio;
  const THEMES = ['light', 'dark', 'blue'];

  function mount(app, content, options) {
    const { profile, about, projects, experience, keywords, contact, footer } = content;
    const root = document.documentElement;

    if (!THEMES.includes(root.dataset.theme)) root.dataset.theme = 'light';

    const themeButtons = THEMES.map(theme => {
      const button = el('button', {
        type: 'button',
        'data-theme-choice': theme,
        'aria-pressed': String(root.dataset.theme === theme),
        text: theme[0].toUpperCase() + theme.slice(1),
      });
      button.addEventListener('click', () => {
        root.dataset.theme = theme;
        themeButtons.forEach(b => b.setAttribute('aria-pressed', String(b === button)));
        options.onThemeChange(theme);
      });
      return button;
    });

    const header = el('header', null, [
      el('div', { class: 'identity' }, [
        el('div', { class: 'brand' }, [
          profile.name,
          el('span', { text: profile.tagline }),
          profile.status ? el('span', { class: 'status', text: profile.status }) : null,
        ]),
        profile.resumeUrl ? link({ class: 'resume-button', href: profile.resumeUrl }, [
          profile.resumeLabel || 'View resume', ' ', el('span', { 'aria-hidden': 'true', text: '↗' }),
        ]) : null,
      ]),
      el('div', { class: 'header-tools' }, [
        el('nav', { 'aria-label': 'Page sections' }, [
          el('a', { href: '#about', text: plain(about.title) }),
          el('a', { href: '#projects', text: plain(projects.title) }),
          el('a', { href: '#experience', text: plain(experience.title) }),
        ]),
        el('div', { class: 'theme-switch', role: 'group', 'aria-label': 'Color theme' }, themeButtons),
      ]),
    ]);

    const aboutSection = el('section', { class: 'panel about', id: 'about' }, [
      el('h1', { text: plain(about.title) }),
      about.paragraphs.map(text => el('p', { text })),
    ]);

    const projectCards = projects.items.map((project, index) => {
      const card = link({ class: 'project', href: project.link }, [
        project.image ? el('img', {
          class: 'cover', src: asset(project.image), alt: project.imageAlt || '',
          width: 640, height: 420, loading: 'lazy',
        }) : el('div', { class: 'cover' }),
        el('div', null, [
          el('div', { class: 'meta', text: `${pad(index + 1)} / ${project.category || ''}` }),
          el('h3', null, [project.title, el('span', { class: 'arrow', 'aria-hidden': 'true', text: '↗' })]),
          el('p', { text: project.description }),
          project.link ? el('div', { class: 'view', text: 'View project' }) : null,
        ]),
      ]);
      return card;
    });

    const jobs = experience.items.map(job => {
      const logo = job.logo ? el('img', {
        class: 'company-logo', src: asset(job.logo), alt: '', width: 108, height: 44,
      }) : null;
      if (logo) logo.addEventListener('error', () => logo.remove(), { once: true });
      return el('article', { class: 'job' }, [
        el('h3', null, [logo, el('span', { class: 'company-name', text: job.company })]),
        el('div', { class: 'role', text: job.role }),
        el('ul', null, (job.bullets || []).map(text => el('li', { text }))),
      ]);
    });

    const footerLinks = [];
    if (contact.email) footerLinks.push(link({ href: `mailto:${contact.email}`, text: contact.email }));
    contact.links.forEach(item => footerLinks.push(link({ href: item.url, text: item.label })));

    const shell = el('div', { class: 'shell' }, [
      header,
      el('main', null, [
        aboutSection,
        el('section', { class: 'panel text-panel projects', id: 'projects' }, [
          el('h2', { class: 'section-heading', text: plain(projects.title) }),
          el('div', { class: 'grid', id: 'project-list' }, projectCards),
        ]),
        el('section', { class: 'panel text-panel', id: 'experience' }, [
          el('h2', { class: 'section-heading', text: plain(experience.title) }),
          el('div', { class: 'experience', id: 'experience-list' }, jobs),
        ]),
      ]),
      el('footer', null, [
        el('span', { class: 'footer-main' }, [
          el('span', { text: footer.text || profile.name }),
          footerLinks.length ? el('span', { class: 'footer-links' }, footerLinks) : null,
        ]),
        el('span', { text: keywords.join(' · ') }),
      ]),
    ]);

    app.replaceChildren(shell);
    return () => {};
  }

  window.Portfolio.renderers.classic = { mount, themes: THEMES };
})();
