
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['"Pretendard Variable"','"Noto Sans KR"',  'sans-serif'],
        'serif': ['"Pretendard Variable"','"Noto Sans KR"',  'serif'],
        'mono': ['"Pretendard Variable"','"Noto Sans KR"',  'monospace'],
        'display': ['"Pretendard Variable"','"Noto Sans KR"',  'display'],
        'body': ['"Pretendard Variable"','"Noto Sans KR"',  'body'],
      },
    },
  },
  plugins: [require('@tailwindcss/aspect-ratio')],
}