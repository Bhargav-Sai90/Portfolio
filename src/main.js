import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const storage = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* Storage is optional. */ } },
};
let motionEnabled = !reducedMotion.matches && storage.get('portfolio-motion') !== 'off';
let motionContext;
let world;
let firstVisit = true;
let sceneMood = 'mint';

$('#year').textContent = new Date().getFullYear();
function updateClock() {
  $('#local-time').textContent = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date()) + ' IST';
}
updateClock();
setInterval(updateClock, 60000);

// Load the WebGL scene separately so navigation and content are immediately usable.
import('./world.js').then(({ createWorld }) => {
  world = createWorld($('#world-canvas'), { motion: motionEnabled, mood: sceneMood });
}).catch(() => { document.documentElement.dataset.webgl = 'unavailable'; });
if (import.meta.hot) import.meta.hot.dispose(() => world?.dispose());

function configureMotion() {
  motionContext?.revert();
  gsap.killTweensOf('.magnetic');
  gsap.set('.magnetic', { clearProps: 'transform' });
  world?.setMotion(motionEnabled);
  document.documentElement.dataset.motion = motionEnabled ? 'on' : 'off';
  $('.motion-toggle').setAttribute('aria-pressed', String(motionEnabled));
  $('#motion-label').textContent = motionEnabled ? 'Motion on' : 'Motion off';
  if (!motionEnabled) { ScrollTrigger.refresh(); return; }
  motionContext = gsap.context(() => {
    if (firstVisit) {
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from('.title-line > span', { yPercent: 110, opacity: 0, duration: 1.15, stagger: .12 }, .08)
        .from('.hero-enter', { y: 20, opacity: 0, duration: .95, stagger: .08 }, .15);
      firstVisit = false;
    }
    gsap.to('.scroll-mouse i', { y: 8, opacity: .15, duration: 1.3, repeat: -1, yoyo: true, ease: 'power1.inOut' });
    gsap.utils.toArray('.reveal').forEach((element) => {
      // Keep elements already passed by the reader visible when motion is toggled.
      if (element.getBoundingClientRect().top < 0) return;
      gsap.from(element, {
        y: 24, opacity: 0, duration: .7, ease: 'power2.out',
        scrollTrigger: { trigger: element, start: 'top 96%', once: true },
      });
    });
    gsap.to('.marquee-track', { xPercent: -50, duration: 28, repeat: -1, ease: 'none' });
    gsap.timeline({ repeat: -1, repeatDelay: 2.4 })
      .to('.role-track', { y: -31, duration: .6, ease: 'power3.inOut', delay: 2.4 })
      .to('.role-track', { y: -62, duration: .6, ease: 'power3.inOut' }, '+=2.4')
      .to('.role-track', { y: -93, duration: .6, ease: 'power3.inOut' }, '+=2.4')
      .set('.role-track', { y: 0 });
    gsap.utils.toArray('.project-preview').forEach(element => {
      gsap.fromTo(element.querySelector('.emoji-board, .wiki-interface, .typing-interface'), { y: 15 }, {
        y: -10, ease: 'none', scrollTrigger: { trigger: element, start: 'top bottom', end: 'bottom top', scrub: 1 },
      });
    });
    gsap.to('.hero-copy', {
      y: -65, opacity: 0, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 25%', scrub: true },
    });
    gsap.to('.scroll-progress', {
      scaleX: 1, ease: 'none',
      scrollTrigger: { trigger: document.documentElement, start: 'top top', end: 'bottom bottom', scrub: .2 },
    });
  });

  ScrollTrigger.refresh();
}
$('.motion-toggle').addEventListener('click', () => {
  motionEnabled = !motionEnabled;
  storage.set('portfolio-motion', motionEnabled ? 'on' : 'off');
  configureMotion();
});
reducedMotion.addEventListener('change', () => {
  motionEnabled = !reducedMotion.matches && storage.get('portfolio-motion') !== 'off';
  configureMotion();
});
configureMotion();

// The current section is reflected in the fixed navigation.
const navLinks = $$('.desktop-nav a, .journey-nav a');
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((link) => {
      const active = link.hash === `#${entry.target.id}`;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  });
}, { rootMargin: '-15% 0px -65% 0px' });
$$('main section[id]').forEach((section) => sectionObserver.observe(section));

// Native dialogs keep keyboard focus in the open overlay and restore it on close.
const menu = $('#nav-dialog');
const game = $('#game-dialog');
const projectDialog = $('#project-dialog');
const arcadeDialog = $('#arcade-dialog');
function openDialog(dialog) {
  dialog.showModal();
  document.body.classList.add('modal-open');
  if (motionEnabled) gsap.fromTo(dialog, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: .3, clearProps: 'opacity,transform' });
}
[menu, game, projectDialog, arcadeDialog].forEach((dialog) => {
  dialog.addEventListener('close', () => {
    if (!document.querySelector('dialog[open]')) document.body.classList.remove('modal-open');
  });
  dialog.addEventListener('click', (event) => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
});
$('.menu-toggle').addEventListener('click', () => {
  openDialog(menu);
  if (motionEnabled) gsap.fromTo('.menu-body nav a', { x: -12, opacity: 0 }, { x: 0, opacity: 1, duration: .35, stagger: .045, clearProps: 'opacity,transform' });
});
$('[data-close-menu]').addEventListener('click', () => menu.close());
$$('.menu-body nav a').forEach((link) => link.addEventListener('click', () => {
  menu.close();
  // Move focus to the destination so keyboard navigation follows the new view.
  const target = $(link.hash);
  target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
}));
$('[data-close-game]').addEventListener('click', () => game.close());

const cards = $$('.project-card');
$$('[data-filter]').forEach((button) => button.addEventListener('click', () => {
  $$('[data-filter]').forEach((filter) => {
    const active = filter === button;
    filter.classList.toggle('active', active);
    filter.setAttribute('aria-pressed', String(active));
  });
  let count = 0;
  cards.forEach((card) => {
    card.hidden = button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter;
    if (!card.hidden) {
      count++;
      // Finish pending scroll reveals before laying out the filtered cards.
      ScrollTrigger.getAll().filter((trigger) => trigger.trigger === card).forEach((trigger) => { trigger.animation?.progress(1); });
      if (motionEnabled) gsap.fromTo(card, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .35, overwrite: true });
    }
  });
  $('#filter-status').textContent = `${count} ${count === 1 ? 'project' : 'projects'} displayed.`;
  ScrollTrigger.refresh();
}));

// A self-contained memory demo. The portfolio project remains linked to its source.
const emojis = [
  { icon: '👾', name: 'Alien' }, { icon: '⚡', name: 'Lightning' },
  { icon: '🚀', name: 'Rocket' }, { icon: '💎', name: 'Diamond' },
  { icon: '🎮', name: 'Controller' }, { icon: '🔥', name: 'Fire' },
  { icon: '🌈', name: 'Rainbow' }, { icon: '👻', name: 'Ghost' },
];
let selected = new Set();
let roundOver = false;
let best = Math.min(8, Math.max(0, Number(storage.get('portfolio-memory-best')) || 0));
function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function drawBoard(focusIndex = null) {
  const board = $('#game-board');
  board.replaceChildren(...shuffle(emojis).map((emoji) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = emoji.icon;
    button.setAttribute('aria-label', emoji.name);
    button.disabled = roundOver;
    button.addEventListener('click', () => chooseEmoji(emoji.name, [...board.children].indexOf(button)));
    return button;
  }));
  if (focusIndex !== null && !roundOver) board.children[focusIndex]?.focus({ preventScroll: true });
  $('#game-score').textContent = `${selected.size} / 8`;
  $('#game-best').textContent = best;
  if (motionEnabled && !roundOver) gsap.fromTo('#game-board button', { opacity: .4, scale: .94 }, { opacity: 1, scale: 1, duration: .2, stagger: .015 });
}
function chooseEmoji(name, focusIndex) {
  if (roundOver) return;
  if (selected.has(name)) {
    roundOver = true;
    $('#game-message').textContent = `Already picked! Mission ended at ${selected.size} / 8. Ready for another round?`;
  } else {
    selected.add(name);
    best = Math.max(best, selected.size);
    storage.set('portfolio-memory-best', String(best));
    if (selected.size === emojis.length) {
      roundOver = true;
      $('#game-message').textContent = 'Mission complete! 8 / 8. Flawless memory, player one.';
    } else $('#game-message').textContent = `${selected.size} down, ${8 - selected.size} to go. Stay focused.`;
  }
  drawBoard(focusIndex);
  if (roundOver) $('#game-reset').focus({ preventScroll: true });
}
function resetGame() {
  selected = new Set();
  roundOver = false;
  $('#game-message').textContent = 'Ready, player one? Choose an emoji.';
  drawBoard();
}
$('[data-open-game]').addEventListener('click', () => { resetGame(); openDialog(game); });
$('#game-reset').addEventListener('click', () => { resetGame(); $('#game-board button').focus(); });
window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
document.fonts.ready.then(() => ScrollTrigger.refresh());

const moodColors = { mint: '#65f5ce', violet: '#b7a0ff', amber: '#ffc783' };
$$('[data-mood]').forEach(button => button.addEventListener('click', () => {
  sceneMood = button.dataset.mood;
  $$('[data-mood]').forEach(option => {
    const active = option === button;
    option.classList.toggle('active', active);
    option.setAttribute('aria-pressed', String(active));
  });
  document.documentElement.style.setProperty('--scene-glow', moodColors[sceneMood]);
  world?.setMood(sceneMood);
}));

// Small pointer responses are restricted to mice and disabled with reduced motion.
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
$$('.magnetic').forEach(button => {
  button.addEventListener('pointermove', event => {
    if (!motionEnabled || !finePointer.matches) return;
    const rect = button.getBoundingClientRect();
    gsap.to(button, { x: (event.clientX - rect.left - rect.width / 2) * .08, y: (event.clientY - rect.top - rect.height / 2) * .15, duration: .35, overwrite: true });
  });
  button.addEventListener('pointerleave', () => {
    gsap.to(button, { x: 0, y: 0, duration: motionEnabled ? .5 : 0, ease: 'power3.out', overwrite: true });
  });
});

const projectDetails = {
  memory: {
    title: 'Emoji Memory', category: '01 / GAME DEVELOPMENT',
    description: 'A playful memory challenge with a simple rule: never choose the same emoji twice. A shuffled board makes every move a fresh test of attention.',
    experience: 'Pick an emoji, remember your choice, and find a new one after the board changes. The mini demo here lets you try an eight-emoji round and keeps your personal best on this device.',
    focus: 'Interactive React interfaces, game state, and clear feedback. The portfolio demo is a standalone adaptation; the original project is available on GitHub.',
    tags: ['React', 'JavaScript', 'CSS'], source: 'https://github.com/Bhargav-Sai90/emoji-game', preview: '.emoji-preview',
  },
  wiki: {
    title: 'Wikipedia Search', category: '02 / WEB APPLICATION',
    description: 'A focused entry point into a world of knowledge. Search Wikipedia through a responsive interface and follow the results to keep exploring.',
    experience: 'Enter a topic to retrieve live search results from the API, then continue reading on Wikipedia. The project pairs a simple search flow with a layout that adapts to different screens.',
    focus: 'Working with REST APIs, presenting dynamic results, and building responsive interfaces with JavaScript and Bootstrap. Explore the source for the implementation.',
    tags: ['JavaScript', 'REST API', 'Bootstrap'], source: 'https://github.com/Bhargav-Sai90/Wikipedia_application', preview: '.wiki-preview',
  },
  typing: {
    title: 'Typing Speed Test', category: '03 / INTERACTIVE TOOL',
    description: 'A typing challenge built around focus, pace, and precision. Fresh paragraphs and a live timer turn a familiar skill into a small daily challenge.',
    experience: 'Type the displayed paragraph while the timer runs, then check the feedback on your accuracy. Start again to practice with another paragraph.',
    focus: 'Keyboard input, timing, and clear progress feedback using JavaScript, HTML, CSS, and Bootstrap. Explore the source for the implementation.',
    tags: ['JavaScript', 'HTML & CSS', 'Bootstrap'], source: 'https://github.com/Bhargav-Sai90/typing-speed-test', preview: '.typing-preview',
  },
};
$$('[data-project]').forEach(button => button.addEventListener('click', () => {
  const project = projectDetails[button.dataset.project];
  $('#project-dialog-title').textContent = project.title;
  $('#project-dialog-category').textContent = project.category;
  $('#project-dialog-description').textContent = project.description;
  $('#project-dialog-experience').textContent = project.experience;
  $('#project-dialog-focus').textContent = project.focus;
  $('#project-dialog-source').href = project.source;
  $('#project-dialog-play').hidden = button.dataset.project !== 'memory';
  $('#project-dialog-tags').replaceChildren(...project.tags.map(tag => {
    const element = document.createElement('span'); element.textContent = tag; return element;
  }));
  const artwork = $(project.preview).cloneNode(true);
  artwork.querySelector('.preview-play')?.remove();
  // The dialog preview is decorative and does not inherit the card's scroll transforms.
  artwork.querySelectorAll('[style]').forEach(element => element.removeAttribute('style'));
  $('#project-dialog-art').replaceChildren(artwork);
  openDialog(projectDialog);
  projectDialog.scrollTop = 0;
}));
$('[data-close-project]').addEventListener('click', () => projectDialog.close());
$('#project-dialog-play').addEventListener('click', () => {
  projectDialog.close();
  resetGame();
  openDialog(game);
});

// The arcade module loads on first play so the initial page stays light.
let arcade;
const arcadeCanvas = $('#arcade-canvas');
const arcadeBest = (id) => Number(storage.get(`arcade-best-${id}`)) || 0;
$$('[data-arcade-best]').forEach(element => { element.textContent = arcadeBest(element.dataset.arcadeBest); });
const arcadeControls = {};
function updateArcade({ id, title, index, score, best, state, muted }) {
  $('#arcade-label').textContent = `THE ARCADE / 0${index + 1}`;
  $('#arcade-title').textContent = title;
  $('#arcade-score').textContent = score;
  $('#arcade-best').textContent = best;
  $('#arcade-controls').textContent = arcadeControls[id];
  $$('[data-arcade-tab]').forEach(tab => tab.setAttribute('aria-pressed', String(tab.dataset.arcadeTab === id)));
  $('#arcade-pause').disabled = state !== 'playing' && state !== 'paused';
  $('#arcade-pause').textContent = state === 'paused' ? 'Resume' : 'Pause';
  $('#arcade-sound').setAttribute('aria-pressed', String(!muted));
  $('#arcade-sound').textContent = muted ? 'Sound off' : 'Sound on';
  $(`[data-arcade-best="${id}"]`).textContent = best;
  if (state === 'over') $('#arcade-status').textContent = `Game over. You scored ${score}.`;
}
async function openArcade(id) {
  if (!arcade) {
    try {
      const { createArcade, GAMES } = await import('./arcade.js');
      GAMES.forEach(item => { arcadeControls[item.id] = item.controls.join(' · '); });
      arcade = createArcade(arcadeCanvas, { storage, motion: () => motionEnabled, onChange: updateArcade });
    } catch { return; }
  }
  arcade.select(id);
  if (!arcadeDialog.open) openDialog(arcadeDialog);
  arcade.open();
  arcadeCanvas.focus({ preventScroll: true });
}
$$('[data-arcade]').forEach(button => button.addEventListener('click', () => openArcade(button.dataset.arcade)));
$$('[data-arcade-tab]').forEach(tab => tab.addEventListener('click', () => {
  arcade.select(tab.dataset.arcadeTab);
  arcadeCanvas.focus({ preventScroll: true });
}));
$('#arcade-pause').addEventListener('click', () => { arcade.togglePause(); arcadeCanvas.focus({ preventScroll: true }); });
$('#arcade-sound').addEventListener('click', () => arcade.toggleSound());
$('[data-close-arcade]').addEventListener('click', () => arcadeDialog.close());
arcadeDialog.addEventListener('close', () => arcade?.close());
