// Health branches for registration and job postings
export const HEALTH_BRANCHES = [
  'Ameliyathane Teknikeri',
  'Anestezi Teknikeri',
  'Beslenme ve Diyetetik',
  'Çocuk Gelişimi Uzmanı',
  'Diyaliz Teknikeri',
  'Diyetisyen',
  'Diş Hekimi',
  'Doktor',
  'Ebe',
  'Eczacı',
  'Fizyoterapi ve Rehabilitasyon',
  'Hemşire',
  'İlk ve Acil Yardım Teknikeri (Paramedik)',
  'Odyolog',
  'Optisyen',
  'Perfüzyon Teknikeri',
  'Radyoterapi Teknikeri',
  'Tıbbi Görüntüleme Teknikeri',
  'Tıbbi Laboratuvar Teknikeri',
  'Tıbbi Sekreter',
  'Yaşlı Bakım Teknikeri',
];

// Turkish cities
export const TURKISH_CITIES = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Aksaray', 'Amasya', 'Ankara', 'Antalya',
  'Ardahan', 'Artvin', 'Aydın', 'Balıkesir', 'Bartın', 'Batman', 'Bayburt', 'Bilecik',
  'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum',
  'Denizli', 'Diyarbakır', 'Düzce', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir',
  'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkâri', 'Hatay', 'Iğdır', 'Isparta', 'İstanbul',
  'İzmir', 'Kahramanmaraş', 'Karabük', 'Karaman', 'Kars', 'Kastamonu', 'Kayseri', 'Kilis',
  'Kırıkkale', 'Kırklareli', 'Kırşehir', 'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa',
  'Mardin', 'Mersin', 'Muğla', 'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Osmaniye', 'Rize',
  'Sakarya', 'Samsun', 'Şanlıurfa', 'Siirt', 'Sinop', 'Şırnak', 'Sivas', 'Tekirdağ',
  'Tokat', 'Trabzon', 'Tunceli', 'Uşak', 'Van', 'Yalova', 'Yozgat', 'Zonguldak'
];

// Post types
export const POST_TYPES = [
  { id: 'genel', title: 'Genel Paylaşım', color: '#6B7280' },
  { id: 'vaka', title: 'Vaka Paylaşımı', color: '#DC2626' },
  { id: 'soru', title: 'Soru & Cevap', color: '#059669' },
];

// Job categories
export const JOB_CATEGORIES = [
  'Analjezikler',
  'Antibiyotikler',
  'Antihistaminikler',
  'Antihipertansifler',
  'Bronkodilatörler',
  'Kardiyovasküler İlaçlar',
  'Sedatifler',
  'Antiemetikler',
  'Kortikosteroidler',
  'Acil İlaçlar',
  'Diğer',
];

// Algorithm categories
export const ALGORITHM_CATEGORIES = [
  'Kardiyovasküler Aciller',
  'Solunum Sistemi Acilleri',
  'Nörolojik Aciller',
  'Travma ve Yaralanmalar',
  'Zehirlenmeler',
  'Pediatrik Aciller',
  'Obstetrik ve Jinekolojik Aciller',
  'Psikiyatrik Aciller',
  'Genel Acil Durumlar',
];

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  USER: 'user',
} as const;

// Application status
export const APPLICATION_STATUS = {
  PENDING: 'pending',
  REVIEWED: 'reviewed',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
} as const;

// Friend request status
export const FRIEND_REQUEST_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
} as const;

// Event registration status
export const EVENT_REGISTRATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

// Title abbreviations for health professionals
export const TITLE_ABBREVIATIONS: Record<string, string> = {
  'Doktor': 'Dr.',
  'Diş Hekimi': 'Dt.',
  'Eczacı': 'Ecz.',
  'Hemşire': 'Hemşire',
  'Fizyoterapi ve Rehabilitasyon': 'Fzt.',
  'Ebe': 'Ebe',
  'İlk ve Acil Yardım Teknikeri': 'Prm.',
  'Paramedik': 'Prm.',
  'Anestezi Teknikeri': 'Anest. Tekn.',
  'Anestezist': 'Anest.',
  'Ameliyathane Teknisyeni': 'Amel. Tekn.',
  'Tıbbi Görüntüleme Teknisyeni': 'Rad. Tekn.',
  'Tıbbi Laboratuvar Teknisyeni': 'Lab. Tekn.',
  'Diyaliz Teknisyeni': 'Diy. Tekn.',
  'Optisyen': 'Opt.',
  'Odyolog': 'Ody.',
  'Radyoterapi Teknisyeni': 'Radyoter. Tekn.',
  'Çocuk Gelişimi Uzmanı': 'Çoc. Gel. Uzm.',
  'Yaşlı Bakım Teknisyeni': 'Yaşlı Bak. Tekn.',
  'Tıbbi Sekreter': 'Tıbbi Sek.',
  'Perfüzyon Teknisyeni': 'Perf. Tekn.',
  'Acil Tıp Teknisyeni': 'Acil Tıp Tekn.',
  'Diyetisyen': 'Dyt.',
  'Beslenme ve Diyetetik': 'Dyt.',
};

// Get formatted name without title
export const getFormattedName = (firstName: string, lastName: string, branch: string) => {
  return `${firstName} ${lastName.toUpperCase()}`;
};