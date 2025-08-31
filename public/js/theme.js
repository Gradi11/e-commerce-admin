// Theme management
function applyTheme(isDark) {
    if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
}

// Check saved theme on load
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    applyTheme(savedTheme === 'dark');
} else {
    // Use system preference as default
    applyTheme(window.matchMedia('(prefers-color-scheme: dark)').matches);
}

// Listen for theme changes
window.addEventListener('storage', function(e) {
    if (e.key === 'theme') {
        applyTheme(e.newValue === 'dark');
    }
}); 