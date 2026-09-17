import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
document.querySelector('#year').textContent = new Date().getFullYear();

const motion = gsap.matchMedia();
motion.add('(prefers-reduced-motion: no-preference)', () => {
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .from('.hero h1 .line > span', { yPercent: 115, duration: 1.1, stagger: .14 }, .1)
    .from('.hero-enter', { y: 24, opacity: 0, duration: .9, stagger: .1 }, .25);

  gsap.utils.toArray('.reveal').forEach((element) => {
    gsap.from(element, {
      y: 30, opacity: 0, duration: .8, ease: 'power2.out',
      scrollTrigger: { trigger: element, start: 'top 94%', once: true },
    });
  });
  gsap.to('.specialties-track', {
    x: -150, ease: 'none',
    scrollTrigger: { trigger: '.specialties', start: 'top bottom', end: 'bottom top', scrub: 1 },
  });
  gsap.to('.scroll-progress', {
    scaleX: 1, ease: 'none',
    scrollTrigger: { trigger: document.documentElement, start: 'top top', end: 'bottom bottom', scrub: .2 },
  });
});

motion.add('(min-width: 801px) and (hover: hover) and (prefers-reduced-motion: no-preference)', () => {
  const portrait = document.querySelector('.portrait-composition');
  const tiltX = gsap.quickTo(portrait, 'rotationY', { duration: .7, ease: 'power2.out' });
  const tiltY = gsap.quickTo(portrait, 'rotationX', { duration: .7, ease: 'power2.out' });
  gsap.set(portrait, { transformPerspective: 1000 });
  const move = (event) => {
    const box = portrait.getBoundingClientRect();
    tiltX(((event.clientX - box.left) / box.width - .5) * 8);
    tiltY(-((event.clientY - box.top) / box.height - .5) * 8);
  };
  const reset = () => { tiltX(0); tiltY(0); };
  portrait.addEventListener('pointermove', move);
  portrait.addEventListener('pointerleave', reset);
  return () => {
    portrait.removeEventListener('pointermove', move);
    portrait.removeEventListener('pointerleave', reset);
  };
});

window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
document.fonts.ready.then(() => ScrollTrigger.refresh());
