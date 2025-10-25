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
                    card.style.opacity = '1';
                } else {
                    card.style.display = 'none';
                    card.style.opacity = '0';
                }
            });
        });
    });

    // Add simple transition for smoother filtering
    projectCards.forEach(card => {
        card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    });

});
