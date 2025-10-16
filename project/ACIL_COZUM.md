# 🚨 ACİL ÇÖZÜM - Infinite Recursion Hatası

## ❌ Şu An Görülen Hatalar:

1. **"infinite recursion detected in policy for relation \"profiles\""** ← ANA SORUN
2. Error fetching profile
3. Error fetching applications count
4. Error fetching friend count
5. Error fetching algorithms
6. Error fetching user data
7. Error fetching posts count
8. Error fetching drugs

## ✅ ÇÖZÜM (3 Dakika)

### 1️⃣ Supabase'e Git
🔗 https://supabase.com/dashboard

### 2️⃣ SQL Dosyasını Çalıştır

1. Sol menüden **SQL Editor** aç
2. **+ New query** tıkla
3. `project/FIX_INFINITE_RECURSION.sql` dosyasını aç
4. **TÜMÜNÜ KOPYALA** (Ctrl+A, Ctrl+C)
5. SQL Editor'e **YAPIŞTIR** (Ctrl+V)
6. **RUN** butonuna tıkla
7. Yeşil "Success" mesajını bekle (15-20 saniye)

### 3️⃣ Emülatörü Yeniden Başlat

```powershell
# PowerShell'de project klasöründe:
cd project
npx expo start --android --clear
```

---

## 🔍 Ne Düzeltildi?

### ✅ Infinite Recursion Sorunu
**Eski Hata:** RLS politikaları `profiles` tablosunu sorgulamak için tekrar `profiles` tablosunu sorguluyordu
**Çözüm:** Admin kontrolü artık `auth.users` tablosunu kullanıyor (recursive değil)

### ✅ Tüm RLS Politikaları
- Profiles için basit politikalar
- Posts için basit politikalar
- Comments için basit politikalar
- Job listings için basit politikalar
- Friend requests için basit politikalar

### ✅ Tüm RPC Fonksiyonları
- `soft_delete_user()` - Kullanıcıyı soft delete
- `restore_user()` - Kullanıcıyı geri yükle
- `permanently_delete_user()` - Kalıcı sil
- `get_deleted_users()` - Silinen kullanıcıları listele
- `block_user_and_cleanup()` - Kullanıcıyı blokla

### ✅ Soft Delete Sütunları
- `deleted_at` - Silinme tarihi
- `deletion_reason` - Silinme sebebi
- `deleted_by` - Kim sildi

---

## 🎯 Beklenen Sonuç

SQL çalıştırdıktan ve emülatörü yeniden başlattıktan sonra:

✅ **Infinite recursion hatası** ← GİDECEK
✅ **Error fetching profile** ← GİDECEK
✅ **Error fetching friend count** ← GİDECEK
✅ **Tüm veritabanı hataları** ← GİDECEK
✅ Ana sayfa düzgün yüklenecek
✅ Profil bilgileri gelecek
✅ Postlar görünecek

---

## ⚠️ ÖNEMLİ NOTLAR

### Admin Email Kontrolü
Admin işlemleri artık şu email ile kontrol ediliyor:
```
ozansahan@outlook.com
```

Bu email'e sahip kullanıcı:
- Tüm profilleri görebilir
- Kullanıcıları silebilir/blokleyebilir
- Admin işlemlerini yapabilir

### RLS Politikaları Basitleştirildi
- **Recursive yapılar kaldırıldı**
- **auth.users tablosu kullanılıyor** (profiles yerine)
- **Her politika bağımsız ve basit**

---

## 🔧 Sorun Yaşarsanız

### Hala "infinite recursion" hatası alıyorsanız:

1. **SQL dosyasının TAMAMINI kopyaladığınızdan emin olun**
2. **Supabase Dashboard'da "Success" mesajını gördüğünüzden emin olun**
3. **Emülatörü mutlaka `--clear` ile başlatın**
4. **Uygulamayı tamamen kapatıp açın**

### Başka hatalar çıkarsa:

Terminal'deki hata mesajını okuyun ve:
- "RLS" hatası → SQL dosyasını tekrar çalıştırın
- "function not found" → RPC fonksiyonları oluşmamış, SQL'i tekrar çalıştırın
- "column not found" → Sütunlar eklenmemiş, SQL'i tekrar çalıştırın

---

## 📞 Test Kontrolü

SQL çalıştırdıktan sonra test edin:

```bash
# 1. Emülatörü başlat
npx expo start --android --clear

# 2. Uygulamayı aç ve kontrol et:
```

✅ Ana sayfa açılıyor mu?
✅ Profil bilgileri görünüyor mu?
✅ Postlar yükleniyor mu?
✅ Hata mesajı kalmadı mı?

Hepsi ✅ ise → BAŞARILI! 🎉

---

## 🔗 Dosya Yolu

SQL Dosyası:
```
project/FIX_INFINITE_RECURSION.sql
```

Bu dosyayı Supabase SQL Editor'de çalıştırın.

