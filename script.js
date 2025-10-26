document.addEventListener('DOMContentLoaded', () => {

    // --- Theme Switcher Logic ---
    const themeToggle = document.getElementById('theme-toggle-checkbox');
    const body = document.body;

    // Function to set theme
    function setTheme(isDark) {
        if (isDark) {
            body.classList.add('dark-mode');
            body.classList.remove('light-mode');
            themeToggle.checked = true;
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.add('light-mode');
            body.classList.remove('dark-mode');
            themeToggle.checked = false;
            localStorage.setItem('theme', 'light');
        }
    }

    // Check localStorage for saved theme
    const savedTheme = localStorage.getItem('theme');

    // Check system preference if no theme is saved
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme) {
        setTheme(savedTheme === 'dark');
    } else {
        // Set default based on system preference
        setTheme(prefersDark);
    }

    // Add event listener for the toggle
    themeToggle.addEventListener('change', () => {
        setTheme(themeToggle.checked);
    });

    // Listen for changes in system preference
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        // Only change if no theme is manually set in localStorage
        if (!localStorage.getItem('theme')) {
            setTheme(e.matches);
        }
    });


    // --- Project Filtering Logic ---
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Get the filter value from the data-filter attribute
            const filter = button.getAttribute('data-filter');

            // --- 1. Handle Active Button State ---
            // Remove 'active' class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add 'active' class to the clicked button
            button.classList.add('active');

            // --- 2. Filter Project Cards ---
            projectCards.forEach(card => {
                const cardTags = card.getAttribute('data-tags');

                // Show card if its tags include the filter, or if the filter is 'all'
                if (cardTags.includes(filter) || filter === 'all') {
                    card.style.display = 'flex'; // Use flex to maintain layout
                    
                    // Use a timeout to allow the 'display' to apply before fading in
                    setTimeout(() => {
                        card.style.opacity = '1';
                    }, 10); // A small delay is all that's needed

                } else {
                    card.style.opacity = '0';
                    // Wait for fade-out to finish before setting display: none
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 400); // Must match the transition duration
                }
            });
        });
    });

    // Add simple transition for smoother filtering
    projectCards.forEach(card => {
        card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    });


    // --- NEW: Cursor Spotlight Effect ---
    const spotlight = document.querySelector('.spotlight');
    
    // Only run this on devices that are not touch-based
    if (window.matchMedia('(pointer: fine)').matches) {
        window.addEventListener('mousemove', (e) => {
            // Use requestAnimationFrame for smooth performance
            requestAnimationFrame(() => {
                // Get the computed style to read CSS variables
                const style = getComputedStyle(document.body);
                const color1 = style.getPropertyValue('--spotlight-color-1').trim();
                const color2 = style.getPropertyValue('--spotlight-color-2').trim();

                // Update the background gradient position
                spotlight.style.background = `radial-gradient(
                    circle at ${e.clientX}px ${e.clientY}px, 
                    ${color1} 0%, 
                    ${color2} 350px
                )`;
            });
        });
    } else {
        // Hide spotlight on touch devices
        if (spotlight) spotlight.style.display = 'none';
    }


    // --- NEW: Scroll Animation (Intersection Observer) ---
    const animatedElements = document.querySelectorAll('.fade-in-up');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add the 'is-visible' class to trigger the animation
                entry.target.classList.add('is-visible');
                
                // Stop observing the element so the animation only runs once
                observer.unobserve(entry.target);
            }
        });
    }, {
        rootMargin: '0px',
        threshold: 0.1 // Trigger when 10% of the element is visible
    });

    // Observe each element
    animatedElements.forEach(el => {
        observer.observe(el);
    });

});
