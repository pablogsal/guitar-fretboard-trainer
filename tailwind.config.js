export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'success': 'success 0.5s ease-in-out',
        'error': 'error 0.5s ease-in-out',
        'complete': 'complete 0.5s ease-in-out',
        'fade-in': 'fadeIn 0.3s ease-in-out',
      },
      keyframes: {
        success: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)', boxShadow: '0 0 15px rgba(34, 197, 94, 0.5)' },
        },
        error: {
          '0%, 100%': { transform: 'scale(1)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' },
        },
        complete: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)', boxShadow: '0 0 15px rgba(59, 130, 246, 0.5)' },
          '100%': { transform: 'scale(1)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}