(() => {
    const root = document.documentElement;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    requestAnimationFrame(() => root.classList.add("page-ready"));

    const revealTargets = document.querySelectorAll("section, .writing li");
    revealTargets.forEach((element) => element.classList.add("reveal"));

    if (reduceMotion || !("IntersectionObserver" in window)) {
        revealTargets.forEach((element) => element.classList.add("is-visible"));
    } else {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            });
        }, { rootMargin: "0px 0px -8%", threshold: 0.08 });
        revealTargets.forEach((element) => observer.observe(element));
    }

    const sectionLinks = [...document.querySelectorAll('.toc a[href^="#"]')];
    const sections = sectionLinks
        .map((link) => document.querySelector(link.getAttribute("href")))
        .filter(Boolean);

    if (sections.length) {
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

            // The last section cannot always cross a viewport activation band.
            // Treat reaching the end of the page as reaching that section.
            if (pageBottom >= documentBottom - 4) {
                setActiveSection(sections.at(-1));
                return;
            }

            const activationLine = (nav?.offsetHeight || 0) + window.innerHeight * 0.28;
            let activeSection = sections[0];
            sections.forEach((section) => {
                if (section.getBoundingClientRect().top <= activationLine) activeSection = section;
            });
            setActiveSection(activeSection);
        };

        const queueActiveSectionUpdate = () => {
            if (scrollFrame) return;
            scrollFrame = requestAnimationFrame(updateActiveSection);
        };

        sectionLinks.forEach((link, index) => {
            link.addEventListener("click", () => setActiveSection(sections[index]));
        });
        window.addEventListener("scroll", queueActiveSectionUpdate, { passive: true });
        window.addEventListener("resize", queueActiveSectionUpdate);
        window.addEventListener("hashchange", queueActiveSectionUpdate);
        window.addEventListener("pageshow", queueActiveSectionUpdate);
        queueActiveSectionUpdate();
    }

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
