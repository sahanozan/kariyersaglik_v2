/*
  # İlaç Prospektüsleri Verilerini Doldur

  1. Veri Ekleme
    - Gerçek ilaç verilerini drugs tablosuna ekle
    - Kategorilere göre organize et
    - Detaylı prospektüs bilgileri

  2. İçerik Yapısı
    - Her ilaç için etken madde, endikasyon, doz bilgileri
    - Yan etkiler ve kontrendikasyonlar
    - Etkileşimler ve uyarılar
*/

-- Mevcut verileri temizle
DELETE FROM drugs;

-- İlaç verilerini ekle
INSERT INTO drugs (id, name, active_ingredient, category, company, content, created_at) VALUES
('aspirin-100', 'Aspirin 100mg', 'Asetilsalisilik Asit', 'Antiplatelet', 'Bayer', '{
  "description": "Kalp krizi ve inme riskini azaltmak için kullanılan kan sulandırıcı ilaç",
  "indications": ["Miyokard infarktüsü profilaksisi", "İskemik inme profilaksisi", "Koroner arter hastalığı"],
  "dosage": "Günde 1 tablet, yemekle birlikte",
  "warnings": ["Mide kanaması riski", "Hamilelikte kullanılmamalı", "Cerrahi öncesi kesilmeli"],
  "contraindications": ["Aktif gastrointestinal kanama", "İntrakraniyal kanama", "Aspirin alerjisi"],
  "side_effects": ["Mide bulantısı", "Dispepsi", "Gastrointestinal kanama", "Baş ağrısı"]
}', NOW()),

('paracetamol-500', 'Paracetamol 500mg', 'Parasetamol', 'Analjezik/Antipiretik', 'Atabay', '{
  "description": "Ağrı kesici ve ateş düşürücü etkili ilaç",
  "indications": ["Hafif-orta şiddette ağrı", "Ateş düşürme", "Baş ağrısı", "Kas ağrıları"],
  "dosage": "Günde 3-4 defa, 1-2 tablet (maksimum 4g/gün)",
  "warnings": ["Karaciğer hasarı riski", "Günlük maksimum 4g aşılmamalı", "Alkol ile birlikte kullanılmamalı"],
  "contraindications": ["Parasetamol alerjisi", "Ciddi karaciğer yetmezliği"],
  "side_effects": ["Nadir: cilt döküntüsü", "Nadir: karaciğer enzim yüksekliği"]
}', NOW()),

('augmentin-625', 'Augmentin 625mg', 'Amoksisilin + Klavulanik asit', 'Antibiyotik', 'GSK', '{
  "description": "Geniş spektrumlu antibiyotik, beta-laktamaz inhibitörü ile güçlendirilmiş",
  "indications": ["Solunum yolu enfeksiyonları", "İdrar yolu enfeksiyonları", "Cilt enfeksiyonları"],
  "dosage": "625 mg, 8 saatte bir",
  "warnings": ["Penisilin alerjisi", "İshal", "Döküntü"],
  "contraindications": ["Penisilin alerjisi", "Mononükleoz"],
  "side_effects": ["İshal", "Bulantı", "Döküntü", "Vajinal kandidiyaz"]
}', NOW()),

('ventolin-inhaler', 'Ventolin İnhaler', 'Salbutamol', 'Bronkodilatör', 'GSK', '{
  "description": "Astım ve KOAH tedavisinde kullanılan kısa etkili bronkodilatör",
  "indications": ["Astım atağı", "KOAH alevlenmesi", "Bronkospazm"],
  "dosage": "100-200 mcg (ihtiyaç halinde)",
  "warnings": ["İlaca aşırı duyarlılık", "Çarpıntı", "Titreme"],
  "usage": "Ağza sıkılıp nefes alışla içine çekilecek, 2 sn bekleyip yavaş burundan nefes verilecek",
  "side_effects": ["Çarpıntı", "Titreme", "Baş ağrısı", "Kas krampları"]
}', NOW()),

('omeprazol-20', 'Omeprazol 20mg', 'Omeprazol', 'Proton Pompa İnhibitörü', 'Deva', '{
  "description": "Mide asidi üretimini azaltan, ülser tedavisinde kullanılan ilaç",
  "indications": ["Peptik ülser", "Gastroözofageal reflü", "Zollinger-Ellison sendromu"],
  "dosage": "Günde 1-2 defa, yemekten önce",
  "warnings": ["Uzun süre kullanımda kemik kırığı riski", "B12 eksikliği"],
  "contraindications": ["İlaca alerji"],
  "side_effects": ["Baş ağrısı", "İshal", "Karın ağrısı", "Bulantı"]
}', NOW()),

('cipro-500', 'Cipro 500mg', 'Siprofloksasin', 'Kinolon Antibiyotik', 'Bayer', '{
  "description": "İdrar ve solunum yolu enfeksiyonlarında kullanılan kinolon",
  "indications": ["İdrar yolu enfeksiyonu", "Solunum yolu enfeksiyonu", "Gastrointestinal enfeksiyonlar"],
  "dosage": "500-1000 mg/gün",
  "warnings": ["Kinolon alerjisi", "Gebelik", "Tendonit riski"],
  "contraindications": ["Kinolon alerjisi", "Gebelik", "18 yaş altı"],
  "side_effects": ["Bulantı", "Baş dönmesi", "İshal", "Tendon problemleri"]
}', NOW()),

('metformin-850', 'Metformin 850mg', 'Metformin HCl', 'Antidiyabetik', 'Merck', '{
  "description": "Tip 2 diyabet tedavisinde kullanılan oral antidiyabetik ilaç",
  "indications": ["Tip 2 diabetes mellitus", "Polikistik over sendromu"],
  "dosage": "Günde 2-3 defa, yemekle birlikte",
  "warnings": ["Laktik asidoz riski", "Böbrek fonksiyonu kontrolü gerekli"],
  "contraindications": ["Böbrek yetmezliği", "Karaciğer yetmezliği", "Kalp yetmezliği"],
  "side_effects": ["Bulantı", "İshal", "Metalik tat", "B12 eksikliği"]
}', NOW()),

('flagyl-500', 'Flagyl 500mg', 'Metronidazol', 'Antibiyotik', 'Sanofi', '{
  "description": "Anaerobik bakteriler ve parazitler için antibiyotik",
  "indications": ["Anaerobik enfeksiyonlar", "Giardiasis", "Amebiasis", "Trichomoniasis"],
  "dosage": "500 mg, günde 2-3 kez",
  "warnings": ["Alkol ile birlikte kullanılmamalı", "Nöropati riski"],
  "contraindications": ["İlaca alerji", "Gebeliğin ilk trimesteri"],
  "side_effects": ["Metalik tat", "Bulantı", "Baş ağrısı", "Koyu renkli idrar"]
}', NOW()),

('prednol-16', 'Prednol 16mg', 'Prednizolon', 'Kortikosteroid', 'Deva', '{
  "description": "Alerji ve iltihabi hastalıklarda kullanılan kortikosteroid",
  "indications": ["Astım", "Alerjik reaksiyonlar", "İltihabi hastalıklar", "Otoimmün hastalıklar"],
  "dosage": "1mg/kg/gün, maksimum 60 mg",
  "warnings": ["Enfeksiyon riski", "Kan şekeri yüksekliği", "Osteoporoz"],
  "contraindications": ["Sistemik mantar enfeksiyonu", "Canlı aşı uygulaması"],
  "side_effects": ["Kilo artışı", "Ödem", "Hipertansiyon", "Duygu durum değişiklikleri"]
}', NOW()),

('diazem-10', 'Diazem 10mg', 'Diazepam', 'Anksiyolitik', 'Deva', '{
  "description": "Anksiyete, kas spazmı ve konvülziyon tedavisinde kullanılan benzodiazepin",
  "indications": ["Anksiyete", "Kas spazmı", "Konvülziyon", "Sedasyon"],
  "dosage": "5-10 mg IM/IV (konvülziyonda)",
  "warnings": ["Solunum depresyonu", "Bağımlılık riski", "Yaşlılarda dikkatli kullanım"],
  "contraindications": ["Miyastenia gravis", "Ciddi solunum yetmezliği"],
  "side_effects": ["Uyuklama", "Baş dönmesi", "Kas güçsüzlüğü", "Konfüzyon"]
}', NOW());