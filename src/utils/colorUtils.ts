/**
 * 배경색에 따른 적절한 텍스트 색상을 반환하는 함수
 * @param hexcolor - 16진수 색상 코드 (예: '#ffffff' 또는 'ffffff')
 * @returns 'text-black' 또는 'text-white' - Tailwind CSS 클래스명
 */
export function getContrastYIQ(hexcolor: string): string {
  // '#' 기호 제거 (있어도 없어도 OK하게 처리)
  const hex = hexcolor.replace('#', '')

  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)

  const yiq = (r * 299 + g * 587 + b * 114) / 1000

  return yiq >= 128 ? 'text-black' : 'text-white'
} 