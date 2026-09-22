(() => {
    const root = document.documentElement;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    
    // Sound state and files
    let soundsEnabled = false;
    const sounds = {
        tap: null,
        flip: null,
        hover: null
    };
    
    // Initialize sounds (data URIs for simple UI sounds)
    function initSounds() {
        // Create simple beep sounds using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        sounds.tap = () => {
            if (!soundsEnabled) return;
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.value = 800;
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        };
        
        sounds.flip = () => {
            if (!soundsEnabled) return;
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.15);
            gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.15);
        };
        
        sounds.hover = () => {
            if (!soundsEnabled) return;
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.value = 1000;
            gainNode.gain.setValueAtTime(0.03, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.05);
        };
    }
    
    // Sound toggle
    const soundToggle = document.getElementById('sound-toggle');
    if (soundToggle) {
        soundToggle.classList.add('muted');
        soundToggle.addEventListener('click', () => {
            soundsEnabled = !soundsEnabled;
            soundToggle.classList.toggle('muted');
            if (soundsEnabled) {
                initSounds();
                sounds.tap();
            }
        });
    }
    
    // Blob canvas animation
    const blobCanvas = document.getElementById('blob-canvas');
    if (blobCanvas && !reduceMotion) {
        const ctx = blobCanvas.getContext('2d');
        let width = window.innerWidth;
        let height = window.innerHeight;
        let mouseX = width / 2;
        let mouseY = height / 2;
        
        blobCanvas.width = width;
        blobCanvas.height = height;
        
        window.addEventListener('resize', () => {
            width = window.innerWidth;
            height = window.innerHeight;
            blobCanvas.width = width;
            blobCanvas.height = height;
        });
        
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });
        
        class Blob {
            constructor() {
                this.x = width / 2;
                this.y = height / 3;
                this.radius = Math.min(width, height) * 0.15;
                this.points = 8;
                this.angleStep = (Math.PI * 2) / this.points;
                this.time = 0;
            }
            
            update() {
                this.time += 0.01;
                this.x += (mouseX - this.x) * 0.02;
                this.y += (mouseY - this.y) * 0.02;
            }
            
            draw() {
                ctx.beginPath();
                
                for (let i = 0; i <= this.points; i++) {
                    const angle = i * this.angleStep;
                    const offset = Math.sin(this.time + i) * 20;
                    const x = this.x + Math.cos(angle) * (this.radius + offset);
                    const y = this.y + Math.sin(angle) * (this.radius + offset);
                    
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        const prevAngle = (i - 1) * this.angleStep;
                        const prevOffset = Math.sin(this.time + i - 1) * 20;
                        const prevX = this.x + Math.cos(prevAngle) * (this.radius + prevOffset);
                        const prevY = this.y + Math.sin(prevAngle) * (this.radius + prevOffset);
                        
                        const cpX = (prevX + x) / 2;
                        const cpY = (prevY + y) / 2;
                        
                        ctx.quadraticCurveTo(prevX, prevY, cpX, cpY);
                    }
                }
                
                ctx.closePath();
                
                const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
                gradient.addColorStop(0, 'rgba(125, 29, 63, 0.15)');
                gradient.addColorStop(0.5, 'rgba(107, 76, 94, 0.1)');
                gradient.addColorStop(1, 'rgba(61, 90, 61, 0.05)');
                
                ctx.fillStyle = gradient;
                ctx.fill();
            }
        }
        
        const blob = new Blob();
        
        function animate() {
            ctx.clearRect(0, 0, width, height);
            blob.update();
            blob.draw();
            requestAnimationFrame(animate);
        }
        
        animate();
    }
    
    // Page ready animation
    requestAnimationFrame(() => root.classList.add("page-ready"));
    
    // Chat widget
    const chatToggle = document.getElementById('chat-toggle');
    const chatPanel = document.getElementById('chat-panel');
    const chatClose = document.getElementById('chat-close');
    const chatContent = document.getElementById('chat-content');
    
    // Chat FAQ configuration - editable Q&A
    const chatFAQ = [
        {
            question: "What do you do?",
            answer: "I'm an AI engineer working on software-defined vehicles and AI infrastructure. I built Mycelium, an open-source agent runtime."
        },
        {
            question: "Where did you study?",
            answer: "I graduated from IIT Madras in 2024 with a degree in Civil Engineering, but I've always been passionate about software and AI."
        },
        {
            question: "What's Mycelium?",
            answer: "Mycelium is a reliability runtime for AI agent tool calls. It prevents duplicate actions when agents retry, and it's available on PyPI with 30k downloads."
        },
        {
            question: "What tech do you use?",
            answer: "Python, TypeScript, PyTorch, LangGraph, MLX, FastAPI, React, Neo4j, Redis, PostgreSQL, and AWS. I work across the full stack."
        },
        {
            question: "Can I hire you?",
            answer: "I'm currently working full-time, but I'm always interested in consulting or collaboration opportunities. Email me at nandanadileep29@gmail.com"
        },
        {
            question: "Do you write?",
            answer: "Yes! I write technical essays on Medium about agent reliability, LLM serving, and implementation details. Check out my writing section."
        }
    ];
    
    function renderChatQuestions() {
        if (!chatContent) return;
        
        const intro = chatContent.querySelector('.chat-intro');
        chatFAQ.forEach((item, index) => {
            const questionEl = document.createElement('div');
            questionEl.className = 'chat-question';
            questionEl.textContent = item.question;
            questionEl.addEventListener('click', () => {
                sounds.flip?.();
                showChatAnswer(item.answer);
            });
            chatContent.appendChild(questionEl);
        });
    }
    
    function showChatAnswer(answer) {
        const existingAnswer = chatContent.querySelector('.chat-answer');
        if (existingAnswer) {
            existingAnswer.remove();
        }
        
        const answerEl = document.createElement('div');
        answerEl.className = 'chat-answer';
        answerEl.textContent = answer;
        chatContent.appendChild(answerEl);
        
        answerEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    if (chatToggle && chatPanel) {
        renderChatQuestions();
        
        chatToggle.addEventListener('click', () => {
            sounds.tap?.();
            chatPanel.classList.toggle('active');
        });
        
        if (chatClose) {
            chatClose.addEventListener('click', () => {
                sounds.tap?.();
                chatPanel.classList.remove('active');
            });
        }
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.chat-widget')) {
                chatPanel.classList.remove('active');
            }
        });
    }
    
    // Sound effects for interactive elements
    document.addEventListener('click', (e) => {
        if (e.target.closest('.project-card, .love-frame, .work-item')) {
            sounds.tap?.();
        }
        
        if (e.target.closest('.writing-link')) {
            sounds.flip?.();
        }
    });
    
    // Hover sounds for navigation
    const navLinks = document.querySelectorAll('.floating-dock a');
    navLinks.forEach(link => {
        link.addEventListener('mouseenter', () => {
            sounds.hover?.();
        });
    });
    
    // Smooth scroll for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const href = anchor.getAttribute('href');
            if (href === '#' || href === '#top') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const offset = 80;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({ top: targetPosition, behavior: 'smooth' });
            }
        });
    });
    
    // Active navigation indicator
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('.floating-dock a');
    
    function updateActiveNav() {
        let current = '';
        const scrollPosition = window.pageYOffset + 200;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });
        
        navItems.forEach(item => {
            item.classList.remove('active');
            const href = item.getAttribute('href');
            if (href === `#${current}`) {
                item.classList.add('active');
            }
        });
    }
    
    if (!reduceMotion) {
        window.addEventListener('scroll', updateActiveNav, { passive: true });
        updateActiveNav();
    }
    
    // Reveal animations on scroll
    const revealElements = document.querySelectorAll('.project-card, .work-item, .love-frame, .writing-card');
    
    if (!reduceMotion && 'IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    revealObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        revealElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            revealObserver.observe(el);
        });
    }
    
    // Legacy support for non-redesign pages
    const sectionLinks = [...document.querySelectorAll('.toc a[href^="#"]')];
    const tocSections = sectionLinks
        .map((link) => document.querySelector(link.getAttribute("href")))
        .filter(Boolean);

    if (tocSections.length) {
        const nav = document.querySelector(".toc");
        let scrollFrame;

        const setActiveSection = (section) => {
            sectionLinks.forEach((link) => {
                const active = link.getAttribute("href") === `#${section.id}`;
                if (active) link.setAttribute("aria-current", "location");
                else link.removeAttribute("aria-current");
            });
        };

        const updateActiveSection = () => {
            scrollFrame = undefined;
            const pageBottom = window.scrollY + window.innerHeight;
            const documentBottom = document.documentElement.scrollHeight;

            if (pageBottom >= documentBottom - 4) {
                setActiveSection(tocSections.at(-1));
                return;
            }

            const navigationOffset = nav?.classList.contains("article-toc") ? 0 : (nav?.offsetHeight || 0);
            const activationLine = navigationOffset + window.innerHeight * 0.28;
            let activeSection = tocSections[0];
            tocSections.forEach((section) => {
                if (section.getBoundingClientRect().top <= activationLine) activeSection = section;
            });
            setActiveSection(activeSection);
        };

        const queueActiveSectionUpdate = () => {
            if (scrollFrame) return;
            scrollFrame = requestAnimationFrame(updateActiveSection);
        };

        sectionLinks.forEach((link, index) => {
            link.addEventListener("click", () => setActiveSection(tocSections[index]));
        });
        window.addEventListener("scroll", queueActiveSectionUpdate, { passive: true });
        window.addEventListener("resize", queueActiveSectionUpdate);
        window.addEventListener("hashchange", queueActiveSectionUpdate);
        window.addEventListener("pageshow", queueActiveSectionUpdate);
        queueActiveSectionUpdate();
    }

    // Details element animation
    document.querySelectorAll("details").forEach((details) => {
        const summary = details.querySelector("summary");
        summary?.addEventListener("click", (event) => {
            if (!details.open || reduceMotion || details.classList.contains("is-closing")) return;
            event.preventDefault();
            details.classList.add("is-closing");
            window.setTimeout(() => {
                details.open = false;
                details.classList.remove("is-closing");
            }, 240);
        });
    });

    // Page transition
    document.addEventListener("click", (event) => {
        const link = event.target.closest("a");
        if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const url = new URL(link.href, window.location.href);
        const sameDocumentAnchor = url.pathname === location.pathname && url.search === location.search && url.hash;
        const internalPage = url.origin === location.origin && !url.hash && !link.hasAttribute("download") && link.target !== "_blank";

        if (sameDocumentAnchor || !internalPage || reduceMotion) return;
        event.preventDefault();
        root.classList.add("page-leaving");
        window.setTimeout(() => { window.location.href = url.href; }, 230);
    });

    window.addEventListener("pageshow", () => root.classList.remove("page-leaving"));
})();
