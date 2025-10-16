/*
  # Sample Data Population

  1. Chat Rooms
    - Create professional chat rooms for different healthcare branches
    - Set appropriate branch requirements

  2. Treatment Algorithms
    - Add essential emergency treatment algorithms
    - Include critical care protocols

  3. Drug Information
    - Add commonly used emergency medications
    - Include proper dosage and contraindication information
*/

-- Insert chat rooms
INSERT INTO chat_rooms (id, name, emoji, description, required_branch) VALUES
('genel', 'Genel Sohbet', '💬', 'Tüm sağlık çalışanları için genel sohbet odası', NULL),
('doktor', 'Doktorlar', '👨‍⚕️', 'Doktorlar için özel sohbet odası', 'Doktor'),
('hemsire', 'Hemşireler', '👩‍⚕️', 'Hemşireler için özel sohbet odası', 'Hemşire'),
('paramedik', 'İlk ve Acil Yardım', '🚑', 'Paramedikler ve acil tıp teknisyenleri için', 'İlk ve Acil Yardım Teknikeri'),
('eczaci', 'Eczacılar', '💊', 'Eczacılar için özel sohbet odası', 'Eczacı'),
('fizyoterapi', 'Fizyoterapistler', '🏃‍♂️', 'Fizyoterapistler için özel sohbet odası', 'Fizyoterapi ve Rehabilitasyon'),
('ebe', 'Ebeler', '👶', 'Ebeler için özel sohbet odası', 'Ebe'),
('anestezist', 'Anestezi', '😴', 'Anestezi teknisyenleri ve anestezistler için', 'Anestezi Teknisyeni'),
('dis-hekimi', 'Diş Hekimleri', '🦷', 'Diş hekimleri için özel sohbet odası', 'Diş Hekimi'),
('ameliyathane', 'Ameliyathane Hizmetleri', '🏥', 'Ameliyathane teknisyenleri için', 'Ameliyathane Teknisyeni'),
('radyoloji', 'Tıbbi Görüntüleme', '📷', 'Radyoloji teknisyenleri için', 'Tıbbi Görüntüleme Teknisyeni'),
('laboratuvar', 'Tıbbi Laboratuvar', '🔬', 'Laboratuvar teknisyenleri için', 'Tıbbi Laboratuvar Teknisyeni')
ON CONFLICT (id) DO NOTHING;

-- Insert sample treatment algorithms
INSERT INTO algorithms (id, title, category, urgency, content, last_updated) VALUES
('kpr-protokolu', 'Kardiyopulmoner Resüsitasyon (KPR)', 'Kardiyovasküler Aciller', 'high', '{
  "description": "Kardiyak arrest durumunda uygulanacak temel ve ileri yaşam desteği protokolü",
  "immediate_actions": [
    "Hastanın bilinç durumunu kontrol edin",
    "Solunum ve nabız kontrolü yapın",
    "112 acil servisi arayın",
    "KPR''ye derhal başlayın"
  ],
  "steps": [
    "Hastayı sert zemine yatırın",
    "Göğüs kafesinin alt yarısına iki el yerleştirin",
    "30 göğüs kompresyonu yapın (5-6 cm derinlik)",
    "2 nefes verme işlemi yapın",
    "Döngüyü kesintisiz devam ettirin"
  ],
  "medications": [
    "Adrenalin 1mg IV/IO her 3-5 dakikada bir",
    "Amiodaron 300mg IV (VF/VT durumunda)",
    "Atropin 1mg IV (asistol/PEA durumunda)"
  ],
  "warning_signs": [
    "Göğüs yükselmesi görülmüyor",
    "Nabız geri dönmüyor",
    "Siyanoz artıyor"
  ]
}', now()),
('anafilaksi', 'Anafilaksi Yönetimi', 'Acil Durumlar', 'high', '{
  "description": "Ciddi alerjik reaksiyon durumunda acil müdahale protokolü",
  "symptoms": [
    "Ani başlayan yaygın ürtiker",
    "Anjioödem (yüz, dudak, dil şişmesi)",
    "Bronkospazm ve nefes darlığı",
    "Hipotansiyon ve şok",
    "Gastrointestinal semptomlar"
  ],
  "immediate_actions": [
    "Adrenalin 0.3-0.5mg IM (uyluk dış kısmı)",
    "IV yol açın ve sıvı resüsitasyonu başlatın",
    "Oksijen desteği verin",
    "Vital bulguları monitörize edin"
  ],
  "medications": [
    "Adrenalin 0.3-0.5mg IM (tekrarlanabilir)",
    "Metilprednizolon 1-2mg/kg IV",
    "Difenhidramin 1mg/kg IV",
    "H2 blokeri (ranitidin 1mg/kg IV)"
  ],
  "contraindications": [
    "Adrenalin için mutlak kontrendikasyon yoktur",
    "Koroner arter hastalığında dikkatli kullanın"
  ]
}', now()),
('astim-krizi', 'Astım Krizi Yönetimi', 'Solunum Sistemi Acilleri', 'medium', '{
  "description": "Akut astım atak durumunda uygulanacak tedavi protokolü",
  "symptoms": [
    "Şiddetli nefes darlığı",
    "Hırıltılı solunum",
    "Göğüs sıkışması",
    "Öksürük",
    "Siyanoz"
  ],
  "immediate_actions": [
    "Hastayı rahatlatın ve oturtun",
    "Oksijen saturasyonunu ölçün",
    "Nebülizatör tedavisi başlatın",
    "IV yol açın"
  ],
  "medications": [
    "Salbutamol 2.5-5mg nebülizatör",
    "İpratropium bromür 0.5mg nebülizatör",
    "Metilprednizolon 1-2mg/kg IV",
    "Magnezyum sülfat 2g IV (şiddetli ataklarda)"
  ],
  "monitoring": [
    "Oksijen saturasyonu",
    "Solunum sayısı ve kalitesi",
    "Nabız ve kan basıncı",
    "Bilinç durumu"
  ]
}', now())
ON CONFLICT (id) DO NOTHING;

-- Insert sample drug information
INSERT INTO drugs (id, name, active_ingredient, category, company, content) VALUES
('adrenalin', 'Adrenalin', 'Epinefrin', 'Acil İlaçlar', 'Osel', '{
  "description": "Anafilaksi ve kardiyak arrest durumlarında kullanılan vazopressör ajan",
  "indications": [
    "Anafilaksi",
    "Kardiyak arrest",
    "Şiddetli bronkospazm",
    "Lokal anestezik toksisitesi"
  ],
  "dosage": {
    "adult": "Anafilaksi: 0.3-0.5mg IM, Kardiyak arrest: 1mg IV",
    "pediatric": "Anafilaksi: 0.01mg/kg IM, Kardiyak arrest: 0.01mg/kg IV"
  },
  "contraindications": [
    "Mutlak kontrendikasyon yoktur",
    "Koroner arter hastalığında dikkatli kullanın"
  ],
  "warnings": [
    "Yanlış IV uygulamada ciddi hipertansiyon",
    "Ekstravazasyon durumunda nekroz riski",
    "Kalp ritmi bozuklukları yapabilir"
  ],
  "side_effects": [
    "Taşikardi",
    "Hipertansiyon",
    "Baş ağrısı",
    "Titreme",
    "Anksiyete"
  ]
}'),
('salbutamol', 'Ventolin', 'Salbutamol', 'Bronkodilatörler', 'GSK', '{
  "description": "Beta-2 agonist bronkodilatör, astım ve KOAH tedavisinde kullanılır",
  "indications": [
    "Akut astım atağı",
    "KOAH alevlenmesi",
    "Bronkospazm",
    "Egzersiz kaynaklı bronkospazm"
  ],
  "dosage": {
    "adult": "2.5-5mg nebülizatör, 15-20 dakikada bir tekrarlanabilir",
    "pediatric": "0.15mg/kg nebülizatör (min 2.5mg)"
  },
  "contraindications": [
    "Salbutamol hipersensitivitesi",
    "Kontrolsüz hipertansiyon",
    "Ciddi kardiyovasküler hastalık"
  ],
  "warnings": [
    "Aşırı kullanımda paradoksal bronkospazm",
    "Kalp ritmi bozuklukları",
    "Serum potasyum düşüklüğü"
  ],
  "side_effects": [
    "Titreme",
    "Taşikardi",
    "Baş ağrısı",
    "Kas krampları",
    "Hipokalemi"
  ]
}'),
('morfin', 'Morfin', 'Morfin Sülfat', 'Analjezikler', 'Osel', '{
  "description": "Güçlü opioid analjezik, şiddetli ağrı tedavisinde kullanılır",
  "indications": [
    "Şiddetli akut ağrı",
    "Miyokard infarktüsü ağrısı",
    "Travma ağrısı",
    "Kanser ağrısı"
  ],
  "dosage": {
    "adult": "2-10mg IV/IM, 4-6 saatte bir",
    "pediatric": "0.1-0.2mg/kg IV/IM"
  },
  "contraindications": [
    "Solunum depresyonu",
    "Paralitik ileus",
    "Akut alkol intoksikasyonu",
    "Kafa travması"
  ],
  "warnings": [
    "Solunum depresyonu riski",
    "Bağımlılık potansiyeli",
    "Yaşlılarda doz azaltımı",
    "Böbrek/karaciğer yetmezliğinde dikkat"
  ],
  "side_effects": [
    "Solunum depresyonu",
    "Sedasyon",
    "Bulantı ve kusma",
    "Konstipasyon",
    "Kaşıntı"
  ],
  "interactions": [
    "Diğer CNS depresanları ile etkileşim",
    "MAO inhibitörleri ile tehlikeli etkileşim",
    "Alkol ile artmış sedatif etki"
  ]
}')
ON CONFLICT (id) DO NOTHING;