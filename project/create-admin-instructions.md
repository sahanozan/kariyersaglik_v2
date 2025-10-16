# Admin Hesabı Oluşturma Talimatları

## 1. Önce SQL'i Çalıştırın
Supabase Dashboard'da `create_admin_account.sql` dosyasındaki SQL'i çalıştırın.

## 2. Normal Kayıt İşlemi Yapın
Uygulamada kayıt sayfasına gidin ve şu bilgilerle kayıt olun:

**Ad:** Ozan
**Soyad:** ŞAHAN  
**E-posta:** ozansahan@outlook.com
**Şifre:** 2025Sahanbey2
**Branş:** İlk ve Acil Yardım Teknikeri (Paramedik)
**Şehir:** Kocaeli
**Kurum:** ***
**Telefon:** 05318996112

## 3. Admin Rolü Atama
Kayıt işlemi tamamlandıktan sonra, Supabase Dashboard'da SQL Editor'a gidin ve şu komutu çalıştırın:

```sql
SELECT promote_to_admin('ozansahan@outlook.com');
```

## 4. Kontrol
Table Editor'da profiles tablosunu açın ve ozansahan@outlook.com kullanıcısının role sütununda 'admin' yazdığını kontrol edin.

## 5. Test
Uygulamaya giriş yapın ve admin paneline erişebildiğinizi kontrol edin.