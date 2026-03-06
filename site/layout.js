/**
 * Route Planner — Shared Layout (header + sidebar injection)
 *
 * Usage: include <script src="../../layout.js"></script> in spike/sprint pages.
 * Set data attributes on <body>:
 *   data-layout="spike|sprint"
 *   data-root="../.."     (relative path to site root)
 *   data-spike="001"      (for spikes)
 *   data-sprint="000"     (for sprints)
 */
(function () {
  const body = document.body;
  const root = body.dataset.root || '../..';
  const layoutType = body.dataset.layout || 'spike';

  /* ── Header ── */
  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `
    <a href="${root}/index.html" class="brand">🚐 Cork GP 2026</a>
    <a href="${root}/index.html">Home</a>
    <a href="/public/campsites.html">Map</a>
  `;

  /* ── Sidebar ── */
  const nav = document.createElement('nav');
  nav.className = 'site-nav';

  // Build nav from sprints.json
  fetch(`${root}/sprints.json`)
    .then(r => r.json())
    .then(entries => {
      const spikes = entries.filter(e => e.type === 'spike');
      const sprints = entries.filter(e => e.type === 'sprint');

      let html = '';

      if (sprints.length) {
        html += `<div class="nav-heading">Sprints</div>`;
        sprints.forEach(s => {
          html += `<a href="${root}/${s.href}">S${s.number.replace('S','')} — ${s.topic}</a>`;
        });
      }

      if (spikes.length) {
        html += `<div class="nav-heading">Spikes</div>`;
        spikes.forEach(s => {
          const active = (layoutType === 'spike' && body.dataset.spike === s.id.replace('spike-','')) ? ' active' : '';
          html += `<a href="${root}/${s.href}" class="${active.trim()}">Spike ${s.id.replace('spike-','')} — ${s.topic}</a>`;
        });
      }

      nav.innerHTML = html;
    })
    .catch(() => {
      nav.innerHTML = `<div class="nav-heading">Navigation</div><a href="${root}/index.html">Home</a>`;
    });

  /* ── Wrap existing <main> in grid ── */
  const main = document.querySelector('main') || document.querySelector('.site-content');

  const wrapper = document.createElement('div');
  wrapper.className = 'site-wrapper';

  body.insertBefore(wrapper, body.firstChild);
  wrapper.appendChild(header);
  wrapper.appendChild(nav);

  if (main) {
    body.removeChild(main);
    wrapper.appendChild(main);
  }
})();
