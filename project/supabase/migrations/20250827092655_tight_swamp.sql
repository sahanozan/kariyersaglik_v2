/*
  # Sohbet oda isimlerini güncelle

  1. Değişiklikler
    - Oda isimlerinin sonuna "Odası" eklendi
    - "Teknisyeni" → "Teknikeri" değiştirildi
    - Paramedik odası "İlk ve Acil Yardım Teknikeri (Paramedik) Odası" oldu
    - Acil Tıp Teknikeri odası silindi
    
  2. Güncellenen Odalar
    - Tüm branş odalarının isimleri standartlaştırıldı
    - Genel sohbet değişmedi
*/

-- Update room names with "Odası" suffix and fix "Teknisyeni" to "Teknikeri"
UPDATE chat_rooms SET name = 'Doktorlar Odası' WHERE id = 'doktor';
UPDATE chat_rooms SET name = 'Diş Hekimleri Odası' WHERE id = 'dis-hekimi';
UPDATE chat_rooms SET name = 'Eczacılar Odası' WHERE id = 'eczaci';
UPDATE chat_rooms SET name = 'Hemşireler Odası' WHERE id = 'hemsire';
UPDATE chat_rooms SET name = 'Fizyoterapi ve Rehabilitasyon Odası' WHERE id = 'fizyoterapi';
UPDATE chat_rooms SET name = 'Ebeler Odası' WHERE id = 'ebe';
UPDATE chat_rooms SET name = 'İlk ve Acil Yardım Teknikeri (Paramedik) Odası', required_branch = 'İlk ve Acil Yardım Teknikeri (Paramedik)' WHERE id = 'paramedik';
UPDATE chat_rooms SET name = 'Anestezi Teknikerleri Odası' WHERE id = 'anestezist';
UPDATE chat_rooms SET name = 'Ameliyathane Teknikerleri Odası' WHERE id = 'ameliyathane';
UPDATE chat_rooms SET name = 'Tıbbi Görüntüleme Teknikerleri Odası' WHERE id = 'radyoloji';
UPDATE chat_rooms SET name = 'Tıbbi Laboratuvar Teknikerleri Odası' WHERE id = 'laboratuvar';
UPDATE chat_rooms SET name = 'Diyaliz Teknikerleri Odası' WHERE id = 'diyaliz';
UPDATE chat_rooms SET name = 'Optisyenler Odası' WHERE id = 'optisyen';
UPDATE chat_rooms SET name = 'Odyologlar Odası' WHERE id = 'odyolog';
UPDATE chat_rooms SET name = 'Radyoterapi Teknikerleri Odası' WHERE id = 'radyoterapi';
UPDATE chat_rooms SET name = 'Çocuk Gelişimi Uzmanları Odası' WHERE id = 'cocuk-gelisimi';
UPDATE chat_rooms SET name = 'Yaşlı Bakım Teknikerleri Odası' WHERE id = 'yasli-bakim';
UPDATE chat_rooms SET name = 'Tıbbi Sekreterler Odası' WHERE id = 'tibbi-sekreter';
UPDATE chat_rooms SET name = 'Perfüzyon Teknikerleri Odası' WHERE id = 'perfuzyon';
UPDATE chat_rooms SET name = 'Beslenme ve Diyetetik Odası' WHERE id = 'beslenme';

-- Delete Acil Tıp Teknikeri room
DELETE FROM chat_messages WHERE room_id = 'acil-tip';
DELETE FROM chat_room_members WHERE room_id = 'acil-tip';
DELETE FROM chat_rooms WHERE id = 'acil-tip';