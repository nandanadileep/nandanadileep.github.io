/* Every route works without JavaScript. This file only enhances the controls. */
(() => {
 const $ = selector => document.querySelector(selector);
 const themeToggle = $('#theme-toggle');
 const syncTheme = () => {
  const dark = document.documentElement.dataset.theme === 'dark';
  themeToggle.setAttribute('aria-pressed', String(dark));
  themeToggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  themeToggle.title = themeToggle.getAttribute('aria-label');
 };
 syncTheme();
 themeToggle.addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = theme;
  try {localStorage.setItem('portfolio-canvas-theme', theme);} catch {}
  syncTheme();
 });
 window.addEventListener('storage', event => {
  if(event.key !== 'portfolio-canvas-theme') return;
  document.documentElement.dataset.theme = event.newValue === 'dark' ? 'dark' : 'light';
  syncTheme();
 });
 const intro = $('#intro');
 function fitHome() {
  if(!intro) return;
  if(matchMedia('(max-width:700px)').matches) {intro.style.transform = ''; return;}
  const available = Math.max(1, $('#viewport').clientHeight - (matchMedia('(max-width:700px)').matches ? 100 : 48));
  intro.style.transform = `scale(${Math.min(1, available / intro.offsetHeight)})`;
  $('#canvas').style.setProperty('--portrait-top', `${intro.offsetTop + 6}px`);
 }
 fitHome();
 window.addEventListener('resize', fitHome);
 document.fonts.ready.then(fitHome);
 const phone = matchMedia('(max-width:700px)');
 const syncProjectNavigation = () => {
  document.querySelectorAll('[data-mobile-href]').forEach(link => {
   link.href = phone.matches ? link.dataset.mobileHref : link.dataset.desktopHref;
  });
 };
 syncProjectNavigation();
 phone.addEventListener('change', syncProjectNavigation);
 const picker = $('#work-project-select');
 picker?.addEventListener('change', () => location.assign(picker.value));
 const sayHi = $('#say-hi'), contacts = $('#contact-panel');
 const setContact = (open, focus = false) => {
  contacts.hidden = !open;
  sayHi.setAttribute('aria-expanded', String(open));
  if(open && focus) contacts.querySelector('a').focus();
 };
 sayHi.addEventListener('click', () => setContact(contacts.hidden));
 sayHi.addEventListener('keydown', event => {
  if(['ArrowRight','ArrowUp'].includes(event.key)) {event.preventDefault(); setContact(true, true);}
 });
 for(const type of ['pointerdown','focusin']) document.addEventListener(type, event => {
  if(!event.target.closest('.contact-tool')) setContact(false);
 });
 document.addEventListener('keydown', event => {
  if(event.key === 'Escape' && !contacts.hidden) {setContact(false); sayHi.focus();}
 });
 contacts.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setContact(false)));
 // Preserve links shared from the earlier single-page canvas and old homepage.
 const legacy = JSON.parse(document.querySelector('#legacy-routes').textContent);
 const fragment = location.hash.slice(1).replace(/\/\d+$/, '');
 if(location.pathname === '/' && fragment && legacy[fragment]) location.replace(legacy[fragment]);
})();
