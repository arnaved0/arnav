// Motion style: an animated layout inspired by getartcraft.com.
// Animations are short, trigger once, and switch off for prefers-reduced-motion.
(function () {
  const { el, link, asset, headline, plain, pad } = window.Portfolio;
  const THEMES = ['light', 'dark'];
  const CHIP_COLORS = ['#2257d6', '#e0452b', '#7a4fe0', '#e8902a', '#1f9d55', '#0e8fa8'];

  // Inline SVG so the arrow renders even when a font lacks the ↗ glyph.
  function arrowIcon() {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 12 12');
    svg.setAttribute('class', 'arr');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', 'M3 9 9 3M4 3h5v5');
    svg.append(path);
    return svg;
  }
  const arrow = text => [text, ' ', arrowIcon()];

  // Wrap each word in a mask so headings can slide up word by word.
  function splitWords(nodes) {
    const out = [];
    let index = 0;
    const wrap = (word, accent) => {
      const inner = el('span', { class: accent ? 'w-in accent' : 'w-in', style: `--w:${index++}`, text: word });
      return el('span', { class: 'w' }, inner);
    };
    nodes.forEach(node => {
      const isAccent = node instanceof Node;
      const text = isAccent ? node.textContent : node;
      text.split(/(\s+)/).forEach(piece => {
        if (!piece) return;
        out.push(/^\s+$/.test(piece) ? ' ' : wrap(piece, isAccent));
      });
    });
    return out;
  }

  function wordmark(name) {
    let i = 0;
    const parts = [];
    String(name || '').trim().split(/\s+/).forEach((word, wordIndex) => {
      if (wordIndex) parts.push(' ');
      parts.push(el('span', { class: 'wm-word' }, [...word].map(ch => el('span', { class: 'ch', style: `--i:${i++}`, text: ch }))));
    });
    return parts;
  }

  function ringsSvg() {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '-700 -700 1400 1400');
    svg.setAttribute('class', 'rings-svg');
    const group = cls => { const g = document.createElementNS(ns, 'g'); g.setAttribute('class', cls); svg.append(g); return g; };
    const circle = (g, r, cls) => {
      const c = document.createElementNS(ns, 'circle');
      c.setAttribute('r', r);
      c.setAttribute('class', cls);
      if (cls.includes('arc')) c.setAttribute('pathLength', '100');
      g.append(c);
    };
    const a = group('ring ring-a');
    circle(a, 140, 'line');
    circle(a, 230, 'ticks');
    circle(a, 230, 'arc arc-1');
    const b = group('ring ring-b');
    circle(b, 330, 'line dashed');
    circle(b, 430, 'line');
    circle(b, 430, 'arc arc-2');
    const c = group('ring ring-c');
    circle(c, 540, 'ticks');
    circle(c, 640, 'line');
    circle(c, 640, 'arc arc-3');
    return svg;
  }

  function sectionBar(number, label, right) {
    return el('div', { class: 'block-bar hud' }, [
      el('span', null, [el('span', { class: 'faint', text: `${pad(number)} / ` }), label]),
      right ? el('span', { class: 'faint', text: right }) : null,
    ]);
  }

  function mount(app, content, options) {
    const { profile, about, projects, experience, keywords, contact, footer } = content;
    const root = document.documentElement;
    const cleanups = [];
    const reduced = window.Portfolio.reducedMotion();

    if (!THEMES.includes(root.dataset.theme)) root.dataset.theme = root.dataset.theme === 'blue' ? 'dark' : 'light';
    root.classList.toggle('no-anim', Boolean(options.skipIntro) || reduced);

    const nav = [
      { id: 'about', label: plain(about.title) },
      { id: 'projects', label: plain(projects.title) },
      { id: 'experience', label: plain(experience.title) },
      { id: 'contact', label: 'Contact' },
    ];

    // TOP BAR
    const themeButton = el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Toggle dark mode' }, [
      el('span', { class: 'moon', 'aria-hidden': 'true' }),
    ]);
    themeButton.addEventListener('click', () => {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      options.onThemeChange(next);
    });
    const navLinks = nav.map(item => el('a', { href: `#${item.id}`, 'data-nav': item.id, text: item.label }));
    const topbar = el('header', { class: 'topbar' }, [
      el('a', { class: 'mark', href: '#top', 'aria-label': `${profile.name || 'Home'}, back to top` }, [
        el('span', { class: 'mark-box', text: initials(profile.name) }),
        el('span', { class: 'mark-name hud', text: profile.name }),
      ]),
      el('nav', { class: 'topnav hud', 'aria-label': 'Page sections' }, navLinks),
      el('div', { class: 'top-actions' }, [
        themeButton,
        profile.resumeUrl ? link({ class: 'top-cta hud', href: profile.resumeUrl }, profile.resumeLabel || 'Resume') : null,
      ]),
      el('div', { class: 'progress', 'aria-hidden': 'true' }, el('span')),
    ]);

    // HERO
    const floaters = projects.items.filter(p => p.image).slice(0, 4).map((project, index) =>
      el('a', { class: `floater f${index + 1}`, href: '#projects', tabindex: '-1', 'aria-hidden': 'true' },
        el('span', { class: 'floater-in' }, el('img', { src: asset(project.image), alt: '' }))));

    const hero = el('section', { class: 'hero', id: 'top' }, [
      el('div', { class: 'rings', 'aria-hidden': 'true' }, ringsSvg()),
      el('div', { class: 'floaters' }, floaters),
      el('div', { class: 'hero-inner' }, [
        el('p', { class: 'hud hero-kicker intro-up', style: '--d:0' }, profile.tagline),
        el('h1', { class: 'wordmark', 'aria-label': profile.name }, wordmark(profile.name)),
        profile.headline ? el('p', { class: 'hero-headline intro-up', style: '--d:5' }, headline(profile.headline)) : null,
        profile.intro ? el('p', { class: 'hero-intro intro-up', style: '--d:6' }, profile.intro) : null,
        el('div', { class: 'cta-row intro-up', style: '--d:7' }, [
          el('a', { class: 'btn btn-solid hud', href: '#projects' }, ['See projects ', el('span', { 'aria-hidden': 'true', text: '↓' })]),
          profile.resumeUrl ? link({ class: 'btn btn-line hud', href: profile.resumeUrl }, arrow(profile.resumeLabel || 'View resume')) : null,
        ]),
        el('p', { class: 'hud hero-meta intro-up', style: '--d:8' }, [
          profile.status ? el('span', { class: 'status' }, [el('span', { class: 'pulse', 'aria-hidden': 'true' }), profile.status]) : null,
          keywords.length ? el('span', { class: 'faint', text: keywords.join(' · ') }) : null,
        ]),
      ]),
      el('a', { class: 'scroll-cue hud', href: '#about', 'aria-label': 'Scroll to about' }, [el('span', { text: 'Scroll' }), el('span', { class: 'cue-line', 'aria-hidden': 'true' })]),
    ]);

    // MARQUEE
    const marqueeItems = [...keywords, ...projects.items.map(p => p.title), ...experience.items.map(e => e.company)].filter(Boolean);
    const marqueeGroup = () => el('div', { class: 'marquee-group', 'aria-hidden': 'true' },
      marqueeItems.map(text => el('span', { class: 'marquee-item' }, [el('span', { class: 'star', text: '✳' }), text])));
    const marquee = marqueeItems.length ? el('div', { class: 'marquee hud' }, el('div', { class: 'marquee-track' }, [marqueeGroup(), marqueeGroup()])) : null;

    // ABOUT
    const aboutSection = el('section', { class: 'block', id: 'about' }, [
      sectionBar(1, plain(about.title), profile.tagline),
      el('div', { class: 'about-grid' }, [
        el('h2', { class: 'display split' }, splitWords(headline(about.headline || about.title))),
        el('div', { class: 'about-body' }, [
          ...about.paragraphs.map((text, i) => el('p', { class: 'reveal', style: `--d:${i}`, text })),
          keywords.length ? el('ul', { class: 'chips reveal', style: `--d:${about.paragraphs.length}`, 'aria-label': 'Focus areas' },
            keywords.map(k => el('li', { class: 'hud', text: k }))) : null,
        ]),
      ]),
    ]);

    // PROJECTS
    const cards = projects.items.map((project, index) => {
      const color = CHIP_COLORS[index % CHIP_COLORS.length];
      return link({ class: 'card reveal', href: project.link, style: `--d:${index % 3};--chip:${color}` }, [
        el('div', { class: 'card-top hud' }, [
          el('span', { class: 'chip', text: pad(index + 1) }),
          el('span', { class: 'faint card-cat', text: project.category }),
        ]),
        el('div', { class: 'card-media' }, project.image
          ? el('img', { src: asset(project.image), alt: project.imageAlt || '', loading: 'lazy', width: 640, height: 400 })
          : null),
        el('div', { class: 'card-body' }, [
          el('h3', { text: project.title }),
          el('p', { text: project.description }),
          project.link ? el('span', { class: 'card-link hud' }, arrow('View project')) : null,
        ]),
      ]);
    });
    const projectsSection = el('section', { class: 'block', id: 'projects' }, [
      sectionBar(2, plain(projects.title), `${pad(projects.items.length)} ${projects.items.length === 1 ? 'project' : 'projects'}`),
      el('div', { class: 'block-head' }, [
        el('h2', { class: 'display split' }, splitWords(headline(projects.title))),
        projects.intro ? el('p', { class: 'lead reveal', text: projects.intro }) : null,
      ]),
      el('div', { class: 'cards' }, cards),
    ]);

    // EXPERIENCE
    const counter = el('span', { class: 'exp-current', text: '01' });
    const jobs = experience.items.map((job, index) => {
      const logo = job.logo ? el('img', { class: 'job-logo', src: asset(job.logo), alt: '', width: 96, height: 48 }) : null;
      if (logo) logo.addEventListener('error', () => logo.remove(), { once: true });
      return el('article', { class: 'job reveal', 'data-job': index }, [
        el('span', { class: 'job-dot', 'aria-hidden': 'true' }),
        el('div', { class: 'job-head' }, [
          logo,
          el('div', null, [
            el('h3', { text: job.company }),
            el('p', { class: 'job-role hud', text: job.role }),
          ]),
        ]),
        el('ul', null, (job.bullets || []).map(text => el('li', { text }))),
      ]);
    });
    const timelineFill = el('span');
    const experienceSection = el('section', { class: 'block', id: 'experience' }, [
      sectionBar(3, plain(experience.title), `${pad(experience.items.length)} ${experience.items.length === 1 ? 'role' : 'roles'}`),
      el('div', { class: 'exp-grid' }, [
        el('div', { class: 'exp-side' }, [
          el('h2', { class: 'display split' }, splitWords(headline(experience.title))),
          experience.intro ? el('p', { class: 'lead reveal', text: experience.intro }) : null,
          experience.items.length ? el('p', { class: 'exp-count hud', 'aria-hidden': 'true' }, [counter, el('span', { class: 'faint', text: ` / ${pad(experience.items.length)}` })]) : null,
        ]),
        el('div', { class: 'exp-list' }, [el('div', { class: 'timeline', 'aria-hidden': 'true' }, timelineFill), ...jobs]),
      ]),
    ]);

    // CONTACT
    const contactButtons = [
      profile.resumeUrl ? link({ class: 'btn btn-solid hud', href: profile.resumeUrl }, arrow(profile.resumeLabel || 'View resume')) : null,
      contact.email ? link({ class: 'btn btn-line hud', href: `mailto:${contact.email}` }, 'Email me') : null,
      ...contact.links.map(item => link({ class: 'btn btn-line hud', href: item.url }, arrow(item.label))),
    ];
    const contactSection = el('section', { class: 'block contact', id: 'contact' }, [
      sectionBar(4, 'Contact', contact.email || null),
      el('div', { class: 'contact-inner' }, [
        keywords.length ? el('p', { class: 'hud faint reveal', text: keywords.join(' · ') }) : null,
        el('h2', { class: 'display display-xl split' }, splitWords(headline(contact.title || "Let's [talk]."))),
        contact.text ? el('p', { class: 'lead reveal', text: contact.text }) : null,
        el('div', { class: 'cta-row reveal' }, contactButtons),
      ]),
    ]);

    // FOOTER
    const footerEl = el('footer', { class: 'site-footer' }, el('div', { class: 'footer-inner' }, [
      el('div', { class: 'footer-brand' }, [
        el('span', { class: 'mark-box', text: initials(profile.name) }),
        el('p', { text: footer.text || profile.name }),
        el('p', { class: 'hud faint', text: profile.tagline }),
      ]),
      el('div', { class: 'footer-col' }, [
        el('p', { class: 'hud faint', text: 'On this page' }),
        ...nav.map(item => el('a', { href: `#${item.id}`, text: item.label })),
      ]),
      el('div', { class: 'footer-col' }, [
        el('p', { class: 'hud faint', text: 'Elsewhere' }),
        profile.resumeUrl ? link({ href: profile.resumeUrl, text: 'Resume' }) : null,
        contact.email ? link({ href: `mailto:${contact.email}`, text: 'Email' }) : null,
        ...contact.links.map(item => link({ href: item.url, text: item.label })),
      ]),
      el('a', { class: 'to-top hud', href: '#top' }, ['Back to top ', el('span', { 'aria-hidden': 'true', text: '↑' })]),
    ]));

    // SCROLL RULER (wide screens only)
    const rulerLabel = el('span', { class: 'ruler-label', text: '000%' });
    const rulerMarker = el('div', { class: 'ruler-marker' }, rulerLabel);
    const ruler = el('aside', { class: 'ruler hud', 'aria-hidden': 'true' }, [
      ...Array.from({ length: 21 }, (_, i) => el('span', { class: i % 5 === 0 ? 'tick major' : 'tick', 'data-n': i % 5 === 0 ? String(i * 5) : null })),
      rulerMarker,
    ]);

    app.replaceChildren(el('div', { class: 'motion-site' }, [
      topbar, ruler,
      el('main', null, [hero, marquee, el('div', { class: 'frame' }, [aboutSection, projectsSection, experienceSection, contactSection])]),
      footerEl,
    ]));

    // REVEAL ON SCROLL
    const revealTargets = app.querySelectorAll('.reveal, .split');
    if ('IntersectionObserver' in window && !root.classList.contains('no-anim')) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
      revealTargets.forEach(node => observer.observe(node));
      cleanups.push(() => observer.disconnect());
    } else {
      revealTargets.forEach(node => node.classList.add('in'));
    }
    requestAnimationFrame(() => root.classList.add('intro-ready'));

    // SCROLL-LINKED EFFECTS
    const progressBar = topbar.querySelector('.progress span');
    const rings = hero.querySelector('.rings');
    const heroInner = hero.querySelector('.hero-inner');
    const expList = experienceSection.querySelector('.exp-list');
    const sections = nav.map(item => app.querySelector(`#${item.id}`));
    let mouseX = 0;
    let mouseY = 0;
    let frame = 0;

    function update() {
      frame = 0;
      const vh = window.innerHeight;
      const max = Math.max(1, document.documentElement.scrollHeight - vh);
      const y = window.scrollY;
      const progress = Math.min(1, Math.max(0, y / max));

      progressBar.style.transform = `scaleX(${progress})`;
      rulerMarker.style.top = `${progress * 100}%`;
      rulerLabel.textContent = `${String(Math.round(progress * 100)).padStart(3, '0')}%`;
      topbar.classList.toggle('scrolled', y > 8);

      if (!reduced) {
        const heroProgress = Math.min(1, y / Math.max(1, hero.offsetHeight));
        rings.style.transform = `translate(-50%, -50%) scale(${1 + heroProgress * 0.35}) rotate(${heroProgress * 25}deg)`;
        rings.style.opacity = String(1 - heroProgress * 0.8);
        heroInner.style.transform = `translateY(${heroProgress * 90}px)`;
        heroInner.style.opacity = String(1 - heroProgress * 1.1);
        floaters.forEach((node, i) => {
          const speed = [0.35, 0.6, 0.45, 0.75][i];
          node.style.transform = `translate(${mouseX * (8 + i * 4)}px, ${-y * speed + mouseY * (8 + i * 4)}px)`;
        });
        app.querySelectorAll('.card-media img').forEach(img => {
          const rect = img.parentElement.getBoundingClientRect();
          if (rect.bottom < 0 || rect.top > vh) return;
          const offset = (rect.top + rect.height / 2 - vh / 2) / vh;
          img.style.setProperty('--py', `${(offset * -18).toFixed(1)}px`);
        });
      }

      // Timeline fill and current-job counter.
      const listRect = expList.getBoundingClientRect();
      const fill = Math.min(1, Math.max(0, (vh * 0.6 - listRect.top) / Math.max(1, listRect.height)));
      timelineFill.style.transform = `scaleY(${fill})`;
      let current = 0;
      jobs.forEach((job, i) => {
        const active = job.getBoundingClientRect().top < vh * 0.6;
        job.classList.toggle('active', active);
        if (active) current = i;
      });
      counter.textContent = pad(current + 1);

      // Highlight the section in view.
      let activeId = null;
      sections.forEach((section, i) => {
        if (section && section.getBoundingClientRect().top < vh * 0.4) activeId = nav[i].id;
      });
      if (y + vh >= document.documentElement.scrollHeight - 4) activeId = 'contact';
      navLinks.forEach(a => a.classList.toggle('active', a.dataset.nav === activeId));
    }

    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const onMouse = event => {
      mouseX = event.clientX / window.innerWidth - 0.5;
      mouseY = event.clientY / window.innerHeight - 0.5;
      schedule();
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    hero.addEventListener('pointermove', onMouse);
    cleanups.push(() => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) cancelAnimationFrame(frame);
    });
    update();

    return () => {
      cleanups.forEach(fn => fn());
      root.classList.remove('intro-ready', 'no-anim');
    };
  }

  function initials(name) {
    return String(name || '').trim().split(/\s+/).map(word => word[0] || '').join('').slice(0, 2).toUpperCase() || '•';
  }

  window.Portfolio.renderers.motion = { mount, themes: THEMES };
})();
