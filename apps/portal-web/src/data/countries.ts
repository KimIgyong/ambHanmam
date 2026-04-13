export interface Country {
  code: string;
  nameEn: string;
  nameKo: string;
  nameVi: string;
  dialCode: string;
}

export const COUNTRIES: Country[] = [
  { code: 'KR', nameEn: 'South Korea', nameKo: '대한민국', nameVi: 'Hàn Quốc', dialCode: '+82' },
  { code: 'VN', nameEn: 'Vietnam', nameKo: '베트남', nameVi: 'Việt Nam', dialCode: '+84' },
  { code: 'US', nameEn: 'United States', nameKo: '미국', nameVi: 'Hoa Kỳ', dialCode: '+1' },
  { code: 'JP', nameEn: 'Japan', nameKo: '일본', nameVi: 'Nhật Bản', dialCode: '+81' },
  { code: 'CN', nameEn: 'China', nameKo: '중국', nameVi: 'Trung Quốc', dialCode: '+86' },
  { code: 'SG', nameEn: 'Singapore', nameKo: '싱가포르', nameVi: 'Singapore', dialCode: '+65' },
  { code: 'TH', nameEn: 'Thailand', nameKo: '태국', nameVi: 'Thái Lan', dialCode: '+66' },
  { code: 'MY', nameEn: 'Malaysia', nameKo: '말레이시아', nameVi: 'Malaysia', dialCode: '+60' },
  { code: 'ID', nameEn: 'Indonesia', nameKo: '인도네시아', nameVi: 'Indonesia', dialCode: '+62' },
  { code: 'PH', nameEn: 'Philippines', nameKo: '필리핀', nameVi: 'Philippines', dialCode: '+63' },
  { code: 'IN', nameEn: 'India', nameKo: '인도', nameVi: 'Ấn Độ', dialCode: '+91' },
  { code: 'AU', nameEn: 'Australia', nameKo: '호주', nameVi: 'Úc', dialCode: '+61' },
  { code: 'GB', nameEn: 'United Kingdom', nameKo: '영국', nameVi: 'Vương quốc Anh', dialCode: '+44' },
  { code: 'DE', nameEn: 'Germany', nameKo: '독일', nameVi: 'Đức', dialCode: '+49' },
  { code: 'FR', nameEn: 'France', nameKo: '프랑스', nameVi: 'Pháp', dialCode: '+33' },
  { code: 'CA', nameEn: 'Canada', nameKo: '캐나다', nameVi: 'Canada', dialCode: '+1' },
  { code: 'TW', nameEn: 'Taiwan', nameKo: '대만', nameVi: 'Đài Loan', dialCode: '+886' },
  { code: 'HK', nameEn: 'Hong Kong', nameKo: '홍콩', nameVi: 'Hồng Kông', dialCode: '+852' },
  { code: 'NZ', nameEn: 'New Zealand', nameKo: '뉴질랜드', nameVi: 'New Zealand', dialCode: '+64' },
  { code: 'AE', nameEn: 'UAE', nameKo: 'UAE', nameVi: 'UAE', dialCode: '+971' },
  { code: 'MX', nameEn: 'Mexico', nameKo: '멕시코', nameVi: 'Mexico', dialCode: '+52' },
  { code: 'BR', nameEn: 'Brazil', nameKo: '브라질', nameVi: 'Brazil', dialCode: '+55' },
  { code: 'ZA', nameEn: 'South Africa', nameKo: '남아프리카', nameVi: 'Nam Phi', dialCode: '+27' },
];

export function getCountryName(country: Country, lang: string): string {
  if (lang.startsWith('ko')) return country.nameKo;
  if (lang.startsWith('vi')) return country.nameVi;
  return country.nameEn;
}
