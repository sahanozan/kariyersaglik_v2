# Supabase Storage Policies Manuel Düzeltme

## 🔧 **Manuel Düzeltme Adımları:**

### 1. **AVATARS Bucket - Fazla Policy'leri Sil**

1. Supabase Dashboard → **Storage** → **Buckets**
2. **avatars** bucket'ına tıkla
3. **Policies** sekmesine geç
4. Şu policy'leri sil (3 nokta → Delete):
   - ❌ "Avatar images are publicly accessible"
   - ❌ "Users can delete their own avatar" 
   - ❌ "Users can update their own avatar"
   - ❌ "Users can upload their own avatar"

**Kalması gerekenler:**
- ✅ "Allow authenticated users to upload avatars"
- ✅ "Allow public read access to avatars"
- ✅ "Allow users to delete their own avatars"
- ✅ "Allow users to update their own avatars"

### 2. **POST-IMAGES Bucket - UPDATE Policy Ekle**

1. **post-images** bucket'ına tıkla
2. **Policies** sekmesine geç
3. **"New policy"** butonuna tıkla
4. Şu bilgileri gir:
   - **Policy name**: `Allow users to update their own post images`
   - **Policy type**: `UPDATE`
   - **Target roles**: `authenticated`
   - **Policy definition**:
   ```sql
   (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1])
   ```

### 3. **POST-DOCUMENTS Bucket - UPDATE Policy Ekle**

1. **post-documents** bucket'ına tıkla
2. **Policies** sekmesine geç
3. **"New policy"** butonuna tıkla
4. Şu bilgileri gir:
   - **Policy name**: `Allow users to update their own post documents`
   - **Policy type**: `UPDATE`
   - **Target roles**: `authenticated`
   - **Policy definition**:
   ```sql
   (bucket_id = 'post-documents' AND auth.uid()::text = (storage.foldername(name))[1])
   ```

### 4. **Kontrol Et**

Her bucket'ta şu 4 policy olmalı:
- ✅ **INSERT** - Authenticated users can upload
- ✅ **SELECT** - Public read access
- ✅ **UPDATE** - Users can update their own files
- ✅ **DELETE** - Users can delete their own files

## ✅ **Sonuç:**
Bu düzeltmelerden sonra tüm görsel yükleme özellikleri tam olarak çalışacak!
