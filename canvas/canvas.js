(() => {
const themeToggle = document.querySelector('#theme-toggle');
function syncThemeToggle() {
 const dark = document.documentElement.dataset.theme === 'dark';
 themeToggle.setAttribute('aria-pressed',String(dark));
 themeToggle.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
}
syncThemeToggle();
themeToggle.addEventListener('click',()=>{
 const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
 document.documentElement.dataset.theme = next;
 try {localStorage.setItem('portfolio-canvas-theme',next);}catch{}
 syncThemeToggle();
});
window.addEventListener('storage',event=>{
 if(event.key === 'portfolio-canvas-theme') {
  document.documentElement.dataset.theme = event.newValue === 'dark' ? 'dark' : 'light';
  syncThemeToggle();
 }
});
const viewport = document.querySelector('#viewport');
const canvas = document.querySelector('#canvas');
const sizer = document.querySelector('#canvas-sizer');
const zoomValue = document.querySelector('#zoom-value');
let boardHeight = 900;
const sections = [...canvas.querySelectorAll(':scope > section')];
const mobile = window.matchMedia('(max-width:700px)');
let zoom = 1, preferredSection = null;
let workProject = 'jlr-1';
const workPanels = [...document.querySelectorAll('.work-reader-content > article')];
const workTabs = [...document.querySelectorAll('[data-work-project]')];
function renderWork(updateHash = true) {
 const panel = workPanels.find(item => item.id === workProject) || workPanels[0];
 workProject = panel.id;
 workPanels.forEach(item => {item.hidden = item !== panel;});
 panel.querySelectorAll('.work-slide').forEach(item=>{item.hidden=false;});
 document.querySelector('.work-reader-content').scrollTop = 0;
 const resources = document.querySelector('#work-project-links');
 const links = [...panel.querySelectorAll('.work-text-links a')];
 resources.replaceChildren(...links.map(link => link.cloneNode(true)));
 resources.hidden = links.length === 0;
 workTabs.forEach(tab => {
  const selected = tab.dataset.workProject === workProject;
  tab.setAttribute('aria-selected',String(selected));
  tab.tabIndex = selected ? 0 : -1;
 });
 document.querySelector('#work-project-select').value = workProject;
 if(updateHash && preferredSection === 'work')history.replaceState(null,'',`#work/${workProject}`);
}
workPanels.forEach(panel => {
 panel.setAttribute('role','tabpanel');
 panel.setAttribute('aria-labelledby',`tab-${panel.id}`);
 panel.tabIndex = 0;
});
workTabs.forEach((tab,index) => {
 tab.addEventListener('click',()=>{workProject=tab.dataset.workProject;renderWork();});
 tab.addEventListener('keydown',e=>{
  let next=index;
  if(e.key==='ArrowDown')next=(index+1)%workTabs.length;
  else if(e.key==='ArrowUp')next=(index+workTabs.length-1)%workTabs.length;
  else if(e.key==='Home')next=0;
  else if(e.key==='End')next=workTabs.length-1;
  else return;
  e.preventDefault();workTabs[next].click();workTabs[next].focus();
 });
});
document.querySelector('#work-project-select').addEventListener('change',e=>{workProject=e.target.value;renderWork();});
renderWork(false);
const fit = () => Math.min(1, Math.max(.45, (viewport.clientWidth - 115) / 1500));
function fitHome() {
 if (preferredSection !== 'intro') return;
 const intro = document.querySelector('#intro');
 if (mobile.matches) {intro.style.transform = ''; return;}
 const available = Math.max(1, viewport.clientHeight - (mobile.matches ? 100 : 48));
 intro.style.transform = `scale(${Math.min(1, available / intro.offsetHeight)})`;
 canvas.style.setProperty('--portrait-top',`${intro.offsetTop + 6}px`);
}
function setZoom(value, center = true) {
 if (preferredSection === 'intro') {fitHome(); return;}
 if (['work','experience','stack','writing','about','miscellaneous'].includes(preferredSection)) return;
 const old = zoom;
 zoom = Math.max(.4, Math.min(1.5, value));
 if (mobile.matches) {canvas.style.transform = ''; return;}
 const x = (viewport.scrollLeft + viewport.clientWidth / 2) / old;
 const y = (viewport.scrollTop + viewport.clientHeight / 2) / old;
 canvas.style.transform = `scale(${zoom})`;
 sizer.style.width = `${1500 * zoom + 30}px`;
 sizer.style.height = `${boardHeight * zoom + 35}px`;
 zoomValue.textContent = `${Math.round(zoom * 100)}%`;
 if (center) {viewport.scrollLeft = x * zoom - viewport.clientWidth / 2; viewport.scrollTop = y * zoom - viewport.clientHeight / 2;}
 document.querySelector('#zoom-out').disabled = zoom <= .4;
 document.querySelector('#zoom-in').disabled = zoom >= 1.5;
}
function jump(id, updateHash = true) {
 const section = document.getElementById(id);
 if (!section) return;
 preferredSection = id;
 const isHome = id === 'intro';
 const isWork = id === 'work';
 const isExperience = id === 'experience';
 viewport.classList.toggle('is-experience',isExperience);
 document.body.classList.toggle('experience-view',isExperience);
 const isStack = id === 'stack';
 const isWriting = id === 'writing';
 const isPersonal = ['about','miscellaneous'].includes(id);
 viewport.classList.toggle('is-personal',isPersonal);
 document.body.classList.toggle('personal-view',isPersonal);
 viewport.classList.toggle('is-writing',isWriting);
 document.body.classList.toggle('writing-view',isWriting);
 viewport.classList.toggle('is-stack', isStack);
 document.body.classList.toggle('stack-view', isStack);
 viewport.classList.toggle('is-work',isWork);
 document.body.classList.toggle('work-view',isWork);
 viewport.classList.toggle('is-home', isHome);
 document.body.classList.toggle('home-view', isHome);
 document.body.classList.toggle('portrait-visible', isHome);
 sections.forEach(item => {item.hidden = item !== section;});
 if(isWork)renderWork(false);
 boardHeight = Math.max(850, section.offsetTop + section.scrollHeight + 100);
 canvas.style.height = mobile.matches ? 'auto' : `${boardHeight}px`;
 setZoom(zoom, false);
 const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
 viewport.scrollTo({top: 0, left: 0, behavior: reduced ? 'instant' : 'smooth'});
 document.querySelectorAll('.tools [data-jump]').forEach(a => {const active = a.dataset.jump === (id === 'miscellaneous' ? 'about' : id); a.classList.toggle('active', active); active ? a.setAttribute('aria-current','location') : a.removeAttribute('aria-current');});
 if (updateHash) history.replaceState(null, '', id === 'work' ? `#work/${workProject}` : `#${id}`);
}
document.querySelectorAll('[data-jump]').forEach(link => link.addEventListener('click', e => {e.preventDefault(); jump(link.dataset.jump);}));
document.querySelector('#zoom-in').onclick = () => setZoom(zoom + .1);
document.querySelector('#zoom-out').onclick = () => setZoom(zoom - .1);
document.querySelector('#zoom-fit').onclick = () => setZoom(fit());
const sayHi = document.querySelector('#say-hi');
const contactPanel = document.querySelector('#contact-panel');
function setContact(open, focus = false) {
 contactPanel.hidden = !open;
 sayHi.setAttribute('aria-expanded',String(open));
 if(open && focus)contactPanel.querySelector('a').focus();
}
sayHi.addEventListener('click',()=>setContact(contactPanel.hidden));
sayHi.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowUp'){e.preventDefault();setContact(true,true);}});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('.contact-tool'))setContact(false);});
document.addEventListener('focusin',e=>{if(!e.target.closest('.contact-tool'))setContact(false);});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!contactPanel.hidden){setContact(false);sayHi.focus();}});
contactPanel.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>setContact(false)));
const help=document.querySelector('#help-dialog');
document.querySelector('#help').onclick=()=>help.showModal();document.querySelector('#help-close').onclick=()=>help.close();
[help].forEach(d=>d.addEventListener('click',e=>{if(e.target!==d)return;const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}));
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||document.querySelector('dialog[open]')||e.target.matches('input,textarea,select,[contenteditable]'))return;const key=e.key.toLowerCase();if(!mobile.matches && ['+','=','-','0'].includes(key)){e.preventDefault();setZoom(key==='0'?fit():zoom+(key==='-'?-.1:.1));}});
setZoom(fit(),false);
window.addEventListener('resize',()=>{setZoom(fit(),false);jump(preferredSection || 'intro',false);});
document.fonts.ready.then(fitHome);
const [requestedSection, initialProject] = location.hash.slice(1).split('/');
const initialSection = requestedSection === 'projects' ? 'stack' : requestedSection;
if(workPanels.some(panel=>panel.id===initialProject)) {workProject=initialProject;renderWork(false);}
requestAnimationFrame(()=>jump(document.getElementById(initialSection)?.matches('section') ? initialSection : 'intro',false));
})();
