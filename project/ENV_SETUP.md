# Environment Variables Setup

Bu proje için gerekli environment variable'ları ayarlamak için aşağıdaki adımları takip edin:

## 1. .env Dosyası Oluşturun

Proje kök dizininde `.env` dosyası oluşturun ve aşağıdaki değişkenleri ekleyin:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# AdMob Configuration
EXPO_PUBLIC_ADMOB_ANDROID_APP_ID=ca-app-pub-xxxxxxxxxxxxxxxx~xxxxxxxxxx
EXPO_PUBLIC_ADMOB_IOS_APP_ID=ca-app-pub-xxxxxxxxxxxxxxxx~xxxxxxxxxx
EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID_JOBS=ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx
EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID_CREATE_JOB=ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx
EXPO_PUBLIC_ADMOB_BANNER_AD_UNIT_ID=ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx

# Test AdMob IDs (for development)
EXPO_PUBLIC_ADMOB_TEST_BANNER_ID=ca-app-pub-3940256099942544/6300978111
EXPO_PUBLIC_ADMOB_TEST_REWARDED_ID=ca-app-pub-3940256099942544/5224354917

# Service Role Key (for server-side operations)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 2. Değerleri Güncelleyin

### Supabase Değerleri:
- `EXPO_PUBLIC_SUPABASE_URL`: Supabase proje URL'iniz
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key'iniz
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key'iniz

### AdMob Değerleri:
- `EXPO_PUBLIC_ADMOB_ANDROID_APP_ID`: Android AdMob App ID'niz
- `EXPO_PUBLIC_ADMOB_IOS_APP_ID`: iOS AdMob App ID'niz
- `EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID_JOBS`: İş ilanları ödüllü reklam ID'niz
- `EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID_CREATE_JOB`: İş ilanı oluşturma ödüllü reklam ID'niz
- `EXPO_PUBLIC_ADMOB_BANNER_AD_UNIT_ID`: Banner reklam ID'niz

## 3. Güvenlik Notları

⚠️ **ÖNEMLİ GÜVENLİK UYARILARI:**

1. **`.env` dosyasını asla Git'e commit etmeyin!**
2. **`.env` dosyası `.gitignore`'da olmalıdır**
3. **Production'da gerçek API key'lerinizi kullanın**
4. **Test key'leri sadece development için kullanın**

## 4. Mevcut Hardcoded Değerler

Aşağıdaki dosyalarda hardcoded değerler bulunmaktadır (fallback olarak):

- `lib/adService.ts` - AdMob Unit ID'leri
- `lib/supabase.ts` - Supabase URL ve anon key
- `app.json` - AdMob App ID'leri
- `android/app/src/main/AndroidManifest.xml` - AdMob Application ID

Bu değerler `.env` dosyasındaki değerler mevcut değilse fallback olarak kullanılır.

## 5. Test Etme

Environment variable'ları ayarladıktan sonra:

```bash
# Development server'ı başlatın
npm run dev

# Veya Android emulator'da test edin
npm run android
```

## 6. Production Deployment

Production'da environment variable'ları hosting platformunuzda ayarlayın:

- **Expo**: `expo publish` ile birlikte environment variable'ları ayarlayın
- **EAS Build**: `eas.json` dosyasında environment variable'ları tanımlayın
- **Vercel/Netlify**: Platform dashboard'unda environment variable'ları ayarlayın
