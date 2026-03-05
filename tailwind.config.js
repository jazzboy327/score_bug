
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['"Noto Sans KR"', '"Pretendard Variable"', 'sans-serif'],
        'serif': ['"Noto Sans KR"', '"Pretendard Variable"', 'serif'],
        'mono': ['"Noto Sans KR"', '"Pretendard Variable"', 'monospace'],
        'display': ['"Noto Sans KR"', '"Pretendard Variable"', 'display'],
        'body': ['"Noto Sans KR"', '"Pretendard Variable"', 'body'],
      },
    },
  },
  plugins: [require('@tailwindcss/aspect-ratio')],
}