
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['"Pretendard Variable"', 'sans-serif'],
        'serif': ['"Pretendard Variable"', 'serif'],
        'mono': ['"Pretendard Variable"', 'monospace'],
        'display': ['"Pretendard Variable"', 'display'],
        'body': ['"Pretendard Variable"', 'body'],
      },
    },
  },
  plugins: [require('@tailwindcss/aspect-ratio')],
}