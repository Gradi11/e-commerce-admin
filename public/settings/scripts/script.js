let currentAlert = null;

function showAlert(message, type) {
    // Remove existing alert if any
    if (currentAlert) {
        currentAlert.remove();
    }

    const alert = document.createElement('div');
    
    // Base styles
    alert.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-xl 
                      transform transition-all duration-300 flex items-center space-x-3
                      ${type === 'success' 
                          ? 'bg-green-50 text-green-800 border-l-4 border-green-500 dark:bg-green-900/50 dark:text-green-300' 
                          : 'bg-red-50 text-red-800 border-l-4 border-red-500 dark:bg-red-900/50 dark:text-red-300'
                      }`;

    // Add icon and message
    alert.innerHTML = `
        <div class="flex-shrink-0">
            ${type === 'success' 
                ? '<i class="ri-checkbox-circle-fill text-2xl text-green-500 dark:text-green-400"></i>'
                : '<i class="ri-error-warning-fill text-2xl text-red-500 dark:text-red-400"></i>'
            }
        </div>
        <div class="flex-1 text-sm font-medium">
            ${message}
        </div>
        <button class="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none">
            <i class="ri-close-line text-xl"></i>
        </button>
    `;

    // Add slide-in animation
    alert.style.transform = 'translateX(100%)';
    document.body.appendChild(alert);
    
    // Trigger animation
    setTimeout(() => {
        alert.style.transform = 'translateX(0)';
    }, 10);

    // Add close button functionality
    const closeButton = alert.querySelector('button');
    closeButton.addEventListener('click', () => {
        alert.style.transform = 'translateX(100%)';
        setTimeout(() => alert.remove(), 300);
        if (currentAlert === alert) {
            currentAlert = null;
        }
    });

    currentAlert = alert;

    // Auto dismiss after 5 seconds
    setTimeout(() => {
        if (alert && document.body.contains(alert)) {
            alert.style.transform = 'translateX(100%)';
            setTimeout(() => {
                alert.remove();
                if (currentAlert === alert) {
                    currentAlert = null;
                }
            }, 300);
        }
    }, 5000);
}

document.addEventListener('DOMContentLoaded', () => {
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    // Set initial toggle state
    darkModeToggle.checked = document.documentElement.classList.contains('dark');

    // Handle toggle changes
    darkModeToggle.addEventListener('change', (e) => {
        const isDark = e.target.checked;
        applyTheme(isDark);

        // Show feedback with the new alert
        const message = isDark ? 'Dark mode enabled' : 'Light mode enabled';
        showAlert(message, 'success');
    });
});
