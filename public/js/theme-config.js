// Common theme configuration
window.themeConfig = {
  colors: {
    primary: '#fc5a05', // Primary Color
  }
};

// Update Tailwind configuration
if (window.tailwind) {
  tailwind.config = {
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          primary: '#fc5a05', // Primary Color
        }
      },
    },
  };
} 