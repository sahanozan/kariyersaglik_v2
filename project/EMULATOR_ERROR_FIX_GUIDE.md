# Emülatör Hata Düzeltme Rehberi

Bu rehber, emülatörde görülen tüm hataların nasıl düzeltileceğini açıklar.

## 🔧 Tespit Edilen Hatalar ve Çözümleri

### 1. ❌ AdMob Başlatma Hatası
**Hata:** `mobileAds.initialize is not available`

**Sebep:** AdMob modülü düzgün yüklenemedi veya web platformunda çalışıyor.

**Çözüm:** 
- `project/lib/adService.ts` dosyasında zaten düzgün kontrol var
- AdMob sadece Android/iOS'ta çalışır, web'de mock kullanılır
- Bu hata normal ve beklenen bir davranıştır

**Durum:** ✅ Normal (hata değil, bilgilendirme)

---

### 2. ❌ RPC Fonksiyon Bulunamadı Hataları

**Hatalar:**
- `could not find the function "soft_delete_user"`
- `could not find the function "restore_user"`
- `could not find the function "permanently_delete_user"`
- `could not find the function "get_deleted_users"`
- `could not find the function "block_user_and_cleanup"`

**Sebep:** Bu fonksiyonlar Supabase veritabanında tanımlı değil.

**Çözüm:**
1. Supabase Dashboard'a git: https://supabase.com/dashboard
2. Projenizi seçin
3. Sol menüden **SQL Editor**'ü açın
4. `project/fix_all_errors.sql` dosyasının içeriğini kopyalayın
5. SQL Editor'e yapıştırın
6. **RUN** butonuna tıklayın

**Durum:** 🔴 Düzeltilmesi gerekiyor

---

### 3. ❌ RLS (Row Level Security) Hataları

**Hatalar:**
- `new row violates row-level security policy`
- `permission denied for table`
- `infinite recursion detected in policy`

**Sebep:** RLS politikaları ya eksik, ya çakışıyor, ya da recursive (kendi kendine referans veren).

**Çözüm:**
- `project/fix_all_errors.sql` dosyasını çalıştırın
- Bu dosya tüm RLS politikalarını temizler ve yeniden oluşturur
- Recursive hataları engellemek için `is_admin()` fonksiyonu kullanılır

**Durum:** 🔴 Düzeltilmesi gerekiyor

---

### 4. ❌ Sütun Bulunamadı Hataları

**Hatalar:**
- `column "deleted_at" does not exist`
- `column "deletion_reason" does not exist`
- `column "deleted_by" does not exist`

**Sebep:** Profiles tablosunda soft delete için gerekli sütunlar yok.

**Çözüm:**
- `project/fix_all_errors.sql` dosyasını çalıştırın
- Bu dosya eksik sütunları otomatik olarak ekler

**Durum:** 🔴 Düzeltilmesi gerekiyor

---

## 📋 Adım Adım Düzeltme Talimatları

### Adım 1: SQL Dosyasını Çalıştır

```bash
# 1. project/fix_all_errors.sql dosyasını aç
# 2. Tüm içeriğini kopyala
# 3. Supabase Dashboard > SQL Editor'e yapıştır
# 4. RUN butonuna tıkla
```

### Adım 2: Emülatörü Yeniden Başlat

```bash
cd project
npx expo start --android --clear
```

### Adım 3: Hata Loglarını Kontrol Et

Emülatörde hala hata varsa:
1. Terminal'deki error loglarına bakın
2. Red screen error'ları okuyun
3. Supabase Dashboard > Logs'tan RPC hatalarını kontrol edin

---

## 🎯 Oluşturulan Fonksiyonlar

### 1. `soft_delete_user(target_user_id, reason)`
Kullanıcıyı yumuşak siler (veri korunur).

**Kullanım:**
```typescript
await supabase.rpc('soft_delete_user', {
  target_user_id: userId,
  reason: 'Admin tarafından silindi'
});
```

### 2. `restore_user(target_user_id)`
Soft delete edilmiş kullanıcıyı geri yükler.

**Kullanım:**
```typescript
await supabase.rpc('restore_user', {
  target_user_id: userId
});
```

### 3. `permanently_delete_user(target_user_id)`
Kullanıcıyı kalıcı olarak siler (GERİ ALINAMAZ).

**Kullanım:**
```typescript
await supabase.rpc('permanently_delete_user', {
  target_user_id: userId
});
```

### 4. `get_deleted_users()`
Silinen tüm kullanıcıları listeler.

**Kullanım:**
```typescript
const { data, error } = await supabase.rpc('get_deleted_users');
```

### 5. `block_user_and_cleanup(target_user_id)`
Kullanıcıyı bloklar ve içeriklerini temizler.

**Kullanım:**
```typescript
await supabase.rpc('block_user_and_cleanup', {
  target_user_id: userId
});
```

### 6. `is_admin()`
Mevcut kullanıcının admin olup olmadığını kontrol eder.

**Kullanım:** (Otomatik olarak RLS politikalarında kullanılır)

---

## 🔒 RLS Politikaları

Oluşturulan basit RLS politikaları:

### Profiles Tablosu
- ✅ Kullanıcılar kendi profillerini görebilir
- ✅ Kullanıcılar kendi profillerini oluşturabilir
- ✅ Kullanıcılar kendi profillerini güncelleyebilir
- ✅ Adminler tüm profilleri görebilir/düzenleyebilir

### Posts Tablosu
- ✅ Herkes silincilmemiş postları görebilir
- ✅ Kullanıcılar kendi postlarını oluşturabilir
- ✅ Kullanıcılar kendi postlarını güncelleyebilir/silebilir
- ✅ Adminler tüm postları düzenleyebilir/silebilir

### Comments Tablosu
- ✅ Herkes silinmemiş yorumları görebilir
- ✅ Kullanıcılar yorum oluşturabilir
- ✅ Kullanıcılar kendi yorumlarını düzenleyebilir/silebilir
- ✅ Adminler tüm yorumları düzenleyebilir/silebilir

### Job Listings Tablosu
- ✅ Herkes silinmemiş iş ilanlarını görebilir
- ✅ Kullanıcılar ilan oluşturabilir
- ✅ Kullanıcılar kendi ilanlarını düzenleyebilir/silebilir
- ✅ Adminler tüm ilanları düzenleyebilir/silebilir

---

## ⚠️ Önemli Notlar

1. **Admin Koruması:** Admin kullanıcılar bloklanamaz ve silinemez
2. **Soft Delete:** Kullanıcılar ilk önce soft delete edilir, sonra kalıcı silinebilir
3. **Recursive Engelleme:** `is_admin()` fonksiyonu ile RLS recursive hataları engellenir
4. **Cascade Silme:** Kalıcı silme işlemi ilişkili tüm verileri de siler

---

## 📞 Yardım

Hala hatalar devam ediyorsa:

1. **Terminal loglarını kontrol edin:**
   ```bash
   # Kırmızı error mesajlarına bakın
   ```

2. **Supabase Dashboard loglarını kontrol edin:**
   - Dashboard > Logs
   - RPC çağrı hatalarını görün

3. **Browser/Emulator console'u kontrol edin:**
   - Red screen error'da detaylı hata mesajı vardır

---

## ✅ Başarı Kontrolü

Tüm hatalar düzeldiyse:
- ✅ Emülatör açılıyor ve beyaz ekran yok
- ✅ Giriş yapılabiliyor
- ✅ Ana sayfa yükleniyor
- ✅ Postlar görüntüleniyor
- ✅ Admin paneli açılıyor
- ✅ Kullanıcı işlemleri çalışıyor

Eğer bunların hepsi çalışıyorsa, tebrikler! 🎉 Tüm hatalar düzeltildi.

