// Supabase Storage Kurulum Script
// Bu dosyayı Node.js ile çalıştırın: node setup-storage-with-keys.cjs

const { createClient } = require('@supabase/supabase-js');

// Supabase konfigürasyonu
const supabaseUrl = 'https://imqcxaxvjnvhkojyxuyz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltcWN4YXh2am52aGtvanl4dXl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODg2OTc2NywiZXhwIjoyMDc0NDQ1NzY3fQ.h6yweQzDbRRkhLUtOdyuEAx288sQ_CsdImVkx-EvQIE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStorage() {
  try {
    console.log('🚀 Supabase Storage kurulumu başlatılıyor...');

    // 1. Storage Buckets Oluştur
    console.log('📦 Storage bucket\'ları oluşturuluyor...');
    
    // Avatars bucket
    const { data: avatarsBucket, error: avatarsError } = await supabase.storage
      .createBucket('avatars', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      });

    if (avatarsError && !avatarsError.message.includes('already exists')) {
      console.error('❌ Avatars bucket oluşturma hatası:', avatarsError);
    } else {
      console.log('✅ Avatars bucket oluşturuldu');
    }

    // Post Media bucket
    const { data: postMediaBucket, error: postMediaError } = await supabase.storage
      .createBucket('post-media', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      });

    if (postMediaError && !postMediaError.message.includes('already exists')) {
      console.error('❌ Post Media bucket oluşturma hatası:', postMediaError);
    } else {
      console.log('✅ Post Media bucket oluşturuldu');
    }

    // 2. Bucket'ları Listele
    console.log('📋 Mevcut bucket\'lar:');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Bucket listeleme hatası:', listError);
    } else {
      buckets.forEach(bucket => {
        console.log(`  - ${bucket.name} (${bucket.public ? 'Public' : 'Private'})`);
      });
    }

    // 3. Test Upload
    console.log('🧪 Test upload yapılıyor...');
    
    // Test dosyası oluştur
    const testContent = 'Test file for storage setup';
    const testFile = new Blob([testContent], { type: 'text/plain' });
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload('test/test.txt', testFile);

    if (uploadError) {
      console.error('❌ Test upload hatası:', uploadError);
    } else {
      console.log('✅ Test upload başarılı');
      
      // Test dosyasını sil
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove(['test/test.txt']);
      
      if (deleteError) {
        console.error('❌ Test dosyası silme hatası:', deleteError);
      } else {
        console.log('✅ Test dosyası silindi');
      }
    }

    console.log('🎉 Storage kurulumu tamamlandı!');
    console.log('📝 RLS Policy\'leri manuel olarak eklemeniz gerekiyor.');

  } catch (error) {
    console.error('❌ Genel hata:', error);
  }
}

// Script'i çalıştır
setupStorage();
