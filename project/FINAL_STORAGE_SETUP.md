# 🚀 Supabase Storage Final Kurulum Rehberi

## ✅ **Tamamlanan İşlemler:**
- ✅ **Storage Bucket'ları Oluşturuldu:**
  - `avatars` (Public, 5MB, image types)
  - `post-media` (Public, 10MB, image types)

## 📋 **Son Adım: RLS Policies (Manuel)**

### 1. Supabase Dashboard'a Git
- **URL**: https://supabase.com/dashboard
- **Proje**: `imqcxaxvjnvhkojyxuyz`

### 2. Storage Bölümüne Git
- Sol menüden **"Storage"** seçin
- Bucket'ların oluştuğunu kontrol edin

### 3. RLS Policies Ekle

#### **Avatars Bucket için:**
1. `avatars` bucket'ına tıklayın
2. **"Policies"** sekmesine gidin
3. **"New Policy"** butonuna tıklayın
4. **"For full customization"** seçin
5. Aşağıdaki policy'leri tek tek ekleyin:

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

#### **Post Media Bucket için:**
1. `post-media` bucket'ına tıklayın
2. **"Policies"** sekmesine gidin
3. **"New Policy"** butonuna tıklayın
4. **"For full customization"** seçin
5. Aşağıdaki policy'leri tek tek ekleyin:

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

## 🎯 **Test Adımları**

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

## 🚀 **Beklenen Sonuç**
- ✅ Native module hatası olmayacak
- ✅ Kamera ve galeri çalışacak
- ✅ Supabase Storage'a yüklenecek
- ✅ Görseller görüntülenecek

## 📝 **Notlar**
- Her policy'yi ayrı ayrı ekleyin
- Policy'lerin aktif olduğunu kontrol edin
- Test upload yaparak çalıştığını doğrulayın
