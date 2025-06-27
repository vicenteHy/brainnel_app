export interface Country {
  code: string;
  name: string;
  flag: string;
  userCount: number;
  phoneCode: string;
}


export interface CountryList {
  country: number;
  currency: string;
  language: string;
  name: string;
  name_en: string;
  timezone: string;
  user_count: number;
  valid_digits:number[]
}

export const countries: Country[] = [
  {
    code: 'CI',
    name: 'Ivory Coast',
    flag: '🇨🇮',
    userCount: 1100000, // 设置最高用户数确保排第一
    phoneCode: '+225'
  },
  {
    code: 'CD',
    name: 'Democratic Republic of the Congo',
    flag: '🇨🇩',
    userCount: 1000000,
    phoneCode: '+243'
  },
  {
    code: 'TG',
    name: 'Togo',
    flag: '🇹🇬',
    userCount: 900000,
    phoneCode: '+228'
  },
  {
    code: 'ML',
    name: 'Mali',
    flag: '🇲🇱',
    userCount: 800000,
    phoneCode: '+223'
  },
  {
    code: 'BF',
    name: 'Burkina Faso',
    flag: '🇧🇫',
    userCount: 700000,
    phoneCode: '+226'
  },
  {
    code: 'GN',
    name: 'Guinea',
    flag: '🇬🇳',
    userCount: 600000,
    phoneCode: '+224'
  },
  {
    code: 'GA',
    name: 'Gabon',
    flag: '🇬🇦',
    userCount: 500000,
    phoneCode: '+241'
  },
  {
    code: 'SN',
    name: 'Senegal',
    flag: '🇸🇳',
    userCount: 400000,
    phoneCode: '+221'
  },
  {
    code: 'CG',
    name: 'Republic of Congo',
    flag: '🇨🇬',
    userCount: 300000,
    phoneCode: '+242'
  },
  {
    code: 'BJ',
    name: 'Benin',
    flag: '🇧🇯',
    userCount: 200000,
    phoneCode: '+229'
  },
  {
    code: 'CM',
    name: 'Cameroon',
    flag: '🇨🇲',
    userCount: 150000,
    phoneCode: '+237'
  },
  {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    userCount: 50000,
    phoneCode: '+33'
  }
].sort((a, b) => b.userCount - a.userCount); 