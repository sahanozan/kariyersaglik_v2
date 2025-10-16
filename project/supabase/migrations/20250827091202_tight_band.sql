/*
  # Sohbet Odalarını Yeniden Düzenle

  1. Mevcut Durumu Temizle
    - Tüm mevcut sohbet odalarını sil
    - Oda üyeliklerini temizle
    - Mesajları temizle

  2. Yeni Odalar
    - `genel` - Genel Sohbet (herkese açık)
    - `doktor` - Doktorlar
    - `dis-hekimi` - Diş Hekimleri
    - `eczaci` - Eczacılar
    - `hemsire` - Hemşireler
    - `fizyoterapi` - Fizyoterapi ve Rehabilitasyon
    - `ebe` - Ebeler
    - `paramedik` - İlk ve Acil Yardım Teknikeri
    - `anestezist` - Anestezi Teknisyeni
    - `ameliyathane` - Ameliyathane Teknisyeni
    - `radyoloji` - Tıbbi Görüntüleme Teknisyeni
    - `laboratuvar` - Tıbbi Laboratuvar Teknisyeni
    - `diyaliz` - Diyaliz Teknisyeni
    - `optisyen` - Optisyen
    - `odyolog` - Odyolog
    - `radyoterapi` - Radyoterapi Teknisyeni
    - `cocuk-gelisimi` - Çocuk Gelişimi Uzmanı
    - `yasli-bakim` - Yaşlı Bakım Teknisyeni
    - `tibbi-sekreter` - Tıbbi Sekreter
    - `perfuzyon` - Perfüzyon Teknisyeni
    - `acil-tip` - Acil Tıp Teknisyeni
    - `beslenme` - Beslenme ve Diyetetik

  3. Güvenlik
    - RLS politikaları korunacak
    - Branş bazlı erişim kontrolü
*/

-- Mevcut verileri temizle
DELETE FROM chat_messages;
DELETE FROM chat_room_members;
DELETE FROM chat_rooms;

-- Yeni sohbet odalarını oluştur
INSERT INTO chat_rooms (id, name, emoji, description, required_branch, member_count) VALUES
('genel', 'Genel Sohbet', '💬', 'Tüm sağlık çalışanları için genel sohbet odası', NULL, 0),
('doktor', 'Doktorlar', '👨‍⚕️', 'Doktorlar için özel sohbet odası', 'Doktor', 0),
('dis-hekimi', 'Diş Hekimleri', '🦷', 'Diş hekimleri için özel sohbet odası', 'Diş Hekimi', 0),
('eczaci', 'Eczacılar', '💊', 'Eczacılar için özel sohbet odası', 'Eczacı', 0),
('hemsire', 'Hemşireler', '👩‍⚕️', 'Hemşireler için özel sohbet odası', 'Hemşire', 0),
('fizyoterapi', 'Fizyoterapistler', '🏃‍♂️', 'Fizyoterapi ve rehabilitasyon uzmanları için sohbet odası', 'Fizyoterapi ve Rehabilitasyon', 0),
('ebe', 'Ebeler', '👶', 'Ebeler için özel sohbet odası', 'Ebe', 0),
('paramedik', 'Paramedikler', '🚑', 'İlk ve acil yardım teknikerleri için sohbet odası', 'İlk ve Acil Yardım Teknikeri', 0),
('anestezist', 'Anestezi Teknisyenleri', '😴', 'Anestezi teknisyenleri için sohbet odası', 'Anestezi Teknisyeni', 0),
('ameliyathane', 'Ameliyathane Teknisyenleri', '🏥', 'Ameliyathane teknisyenleri için sohbet odası', 'Ameliyathane Teknisyeni', 0),
('radyoloji', 'Tıbbi Görüntüleme', '📡', 'Tıbbi görüntüleme teknisyenleri için sohbet odası', 'Tıbbi Görüntüleme Teknisyeni', 0),
('laboratuvar', 'Tıbbi Laboratuvar', '🔬', 'Tıbbi laboratuvar teknisyenleri için sohbet odası', 'Tıbbi Laboratuvar Teknisyeni', 0),
('diyaliz', 'Diyaliz Teknisyenleri', '🩸', 'Diyaliz teknisyenleri için sohbet odası', 'Diyaliz Teknisyeni', 0),
('optisyen', 'Optisyenler', '👓', 'Optisyenler için sohbet odası', 'Optisyen', 0),
('odyolog', 'Odyologlar', '👂', 'Odyologlar için sohbet odası', 'Odyolog', 0),
('radyoterapi', 'Radyoterapi Teknisyenleri', '☢️', 'Radyoterapi teknisyenleri için sohbet odası', 'Radyoterapi Teknisyeni', 0),
('cocuk-gelisimi', 'Çocuk Gelişimi Uzmanları', '🧸', 'Çocuk gelişimi uzmanları için sohbet odası', 'Çocuk Gelişimi Uzmanı', 0),
('yasli-bakim', 'Yaşlı Bakım Teknisyenleri', '👴', 'Yaşlı bakım teknisyenleri için sohbet odası', 'Yaşlı Bakım Teknisyeni', 0),
('tibbi-sekreter', 'Tıbbi Sekreterler', '📋', 'Tıbbi sekreterler için sohbet odası', 'Tıbbi Sekreter', 0),
('perfuzyon', 'Perfüzyon Teknisyenleri', '❤️', 'Perfüzyon teknisyenleri için sohbet odası', 'Perfüzyon Teknisyeni', 0),
('acil-tip', 'Acil Tıp Teknisyenleri', '🚨', 'Acil tıp teknisyenleri için sohbet odası', 'Acil Tıp Teknisyeni', 0),
('beslenme', 'Beslenme ve Diyetetik', '🥗', 'Beslenme ve diyetetik uzmanları için sohbet odası', 'Beslenme ve Diyetetik', 0);