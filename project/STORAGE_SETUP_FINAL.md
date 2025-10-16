# 🚀 Supabase Storage Kurulum Rehberi

## 📋 Adım Adım Kurulum

### 1. Supabase Dashboard'a Git
- **URL**: https://supabase.com/dashboard
- **Proje**: `imqcxaxvjnvhkojyxuyz`

### 2. Storage Bölümüne Git
- Sol menüden **"Storage"** seçin
- **"Create a new bucket"** butonuna tıklayın

### 3. İlk Bucket: `avatars`
- **Bucket name**: `avatars`
- **Public bucket**: ✅ (işaretli)
- **File size limit**: `5 MB`
- **Allowed MIME types**: `image/jpeg, image/png, image/gif, image/webp`
- **Create bucket** butonuna tıklayın

### 4. İkinci Bucket: `post-media`
- **Bucket name**: `post-media`
- **Public bucket**: ✅ (işaretli)
- **File size limit**: `10 MB`
- **Allowed MIME types**: `image/jpeg, image/png, image/gif, image/webp`
- **Create bucket** butonuna tıklayın

### 5. RLS Policies Ayarla

#### Avatars Bucket için:
1. `avatars` bucket'ına tıklayın
2. **"Policies"** sekmesine gidin
3. **"New Policy"** butonuna tıklayın
4. **"For full customization"** seçin
5. Aşağıdaki policy'leri ekleyin:

**Policy 1: Upload**
```sql
CREATE POLICY "Users can upload their own avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Policy 2: Update**
```sql
CREATE POLICY "Users can update their own avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Policy 3: Delete**
```sql
CREATE POLICY "Users can delete their own avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Policy 4: Select**
```sql
CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');
```

#### Post Media Bucket için:
1. `post-media` bucket'ına tıklayın
2. **"Policies"** sekmesine gidin
3. **"New Policy"** butonuna tıklayın
4. **"For full customization"** seçin
5. Aşağıdaki policy'leri ekleyin:

**Policy 1: Upload**
```sql
CREATE POLICY "Users can upload their own post media" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'post-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Policy 2: Update**
```sql
CREATE POLICY "Users can update their own post media" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'post-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Policy 3: Delete**
```sql
CREATE POLICY "Users can delete their own post media" ON storage.objects
FOR DELETE USING (
  bucket_id = 'post-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Policy 4: Select**
```sql
CREATE POLICY "Anyone can view post media" ON storage.objects
FOR SELECT USING (bucket_id = 'post-media');
```

### 6. Test Et
- Bucket'ların oluştuğunu kontrol edin
- Policy'lerin aktif olduğunu kontrol edin
- Uygulamada görsel yükleme test edin

## 🎯 Test Adımları

### Profile Bölümünde:
1. **Profil fotoğrafına** tıkla
2. **"Kamera"** veya **"Galeri"** seç
3. Fotoğraf çek veya seç
4. **"Güncelle"** butonuna tıkla

### Posts Bölümünde:
1. **"Görsel Ekle"** butonuna tıkla
2. **"Kamera"** veya **"Galeri"** seç
3. Fotoğraf çek veya seç
4. **"Paylaş"** butonuna tıkla

## 🚀 Beklenen Sonuç
- ✅ Native module hatası olmayacak
- ✅ Kamera ve galeri çalışacak
- ✅ Supabase Storage'a yüklenecek
- ✅ Görseller görüntülenecek

## 📝 Notlar
- RLS Policy'leri manuel olarak eklemeniz gerekiyor
- Bucket'lar public olmalı
- MIME type'lar doğru ayarlanmalı
- File size limit'ler uygun olmalı
