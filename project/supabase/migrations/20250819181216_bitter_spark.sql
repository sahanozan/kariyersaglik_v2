/*
  # Tedavi Algoritmaları Örnek Verileri

  1. Örnek Algoritmalar
    - Kardiyopulmoner Resüsitasyon (CPR)
    - Anafılaksi Tedavisi
    - Akut Miyokard İnfarktüsü
    - Astım Atağı Yönetimi
    - Hipoglisemi Tedavisi

  2. İçerik Yapısı
    - Her algoritma detaylı adımlar içerir
    - Aciliyet seviyeleri tanımlanır
    - Kategori bilgileri eklenir
*/

-- Kardiyopulmoner Resüsitasyon (CPR)
INSERT INTO algorithms (id, title, category, urgency, content, last_updated) VALUES 
('cpr-algorithm', 'Kardiyopulmoner Resüsitasyon (CPR)', 'Acil Tıp', 'high', '{
  "description": "Kardiyak arrest durumunda uygulanacak temel ve ileri yaşam desteği protokolü",
  "immediate_actions": [
    "Bilinç kontrolü - omuzlardan sallayarak seslenin",
    "Solunum kontrolı - 10 saniye içinde göğüs hareketlerini gözlemleyin",
    "Nabız kontrolü - karotis nabzını 10 saniye kontrol edin",
    "Yardım çağırın - 112 arayın ve defibrilatör isteyin",
    "CPR başlatın - göğüs kompresyonlarına başlayın"
  ],
  "steps": [
    "Hastayı sert zemine sırtüstü yatırın",
    "Göğüs kafesinin alt yarısına iki el yerleştirin",
    "5-6 cm derinlikte, dakikada 100-120 kompresyon yapın",
    "30 kompresyon sonrası 2 nefes verin",
    "Defibrilatör gelene kadar devam edin"
  ],
  "warning_signs": [
    "Bilinç kaybı",
    "Solunum durması",
    "Nabız alınamıyor",
    "Siyanoz (mavileşme)"
  ]
}', now()),

-- Anafılaksi Tedavisi
('anaphylaxis-treatment', 'Anafılaksi Tedavisi', 'Acil Tıp', 'high', '{
  "description": "Ciddi alerjik reaksiyon durumunda uygulanacak acil tedavi protokolü",
  "immediate_actions": [
    "Adrenalin 0.3-0.5 mg IM (uyluk dış kısmı)",
    "Oksijen desteği başlatın",
    "IV yol açın - kristaloid sıvı verin",
    "Antihistaminik - difenhidramin 25-50 mg IV",
    "Kortikosteroid - prednizolon 1-2 mg/kg IV"
  ],
  "monitoring": [
    "Vital bulgular her 5 dakikada bir",
    "Solunum sıkıntısı takibi",
    "Kan basıncı monitörizasyonu",
    "Bilinç durumu değerlendirmesi"
  ],
  "warning_signs": [
    "Hızlı gelişen cilt döküntüsü",
    "Solunum sıkıntısı",
    "Hipotansiyon",
    "Bilinç bulanıklığı",
    "Gastrointestinal semptomlar"
  ]
}', now()),

-- Akut Miyokard İnfarktüsü
('acute-mi-treatment', 'Akut Miyokard İnfarktüsü', 'Kardiyoloji', 'high', '{
  "description": "STEMI ve NSTEMI durumlarında uygulanacak acil tedavi protokolü",
  "immediate_actions": [
    "12 derivasyonlu EKG çekin",
    "Oksijen saturasyonu <%90 ise O2 verin",
    "Aspirin 300 mg çiğneterek",
    "Klopidogrel 600 mg yükleme dozu",
    "Atorvastatin 80 mg",
    "Metoprolol 25 mg 2x1 (kontrendikasyon yoksa)"
  ],
  "treatment": {
    "stemi": {
      "title": "STEMI Tedavisi",
      "treatment": [
        "Primer PCI < 120 dakika içinde",
        "Trombolitik tedavi (PCI mümkün değilse)",
        "Heparin 60 IU/kg bolus + 12 IU/kg/saat infüzyon"
      ]
    },
    "nstemi": {
      "title": "NSTEMI Tedavisi", 
      "treatment": [
        "Risk stratifikasyonu yapın",
        "Troponin takibi",
        "Erken invaziv strateji (yüksek risk)",
        "Konservatif tedavi (düşük risk)"
      ]
    }
  },
  "contraindications": [
    "Aktif kanama",
    "İntrakraniyal kanama öyküsü",
    "Ciddi hipertansiyon (>180/110)",
    "Son 3 ay içinde major cerrahi"
  ]
}', now()),

-- Astım Atağı Yönetimi
('asthma-attack-management', 'Astım Atağı Yönetimi', 'Göğüs Hastalıkları', 'medium', '{
  "description": "Akut astım atağında uygulanacak tedavi protokolü ve değerlendirme kriterleri",
  "classification": {
    "hafif": {
      "criteria": "Normal konuşma, hafif dispne, nabız <100",
      "treatment": [
        "Salbutamol 2-4 puff her 20 dakikada",
        "Oksijen saturasyonu takibi",
        "Oral prednizolon 40-50 mg"
      ]
    },
    "orta": {
      "criteria": "Konuşma güçlüğü, belirgin dispne, nabız 100-120",
      "treatment": [
        "Salbutamol nebül 2.5-5 mg her 20 dakikada",
        "İpratropium bromür nebül 0.5 mg",
        "Prednizolon 40-50 mg IV",
        "Oksijen desteği"
      ]
    },
    "ağır": {
      "criteria": "Tek kelime konuşma, ciddi dispne, nabız >120",
      "treatment": [
        "Salbutamol nebül sürekli",
        "İpratropium bromür nebül",
        "Metilprednizolon 125 mg IV",
        "Magnezyum sülfat 2g IV (30 dakikada)",
        "Yoğun bakım konsültasyonu"
      ]
    }
  },
  "warning_signs": [
    "Siyanoz",
    "Bilinç bulanıklığı",
    "Paradoks nabız >25 mmHg",
    "Sessiz göğüs",
    "Aşırı yorgunluk"
  ]
}', now()),

-- Hipoglisemi Tedavisi
('hypoglycemia-treatment', 'Hipoglisemi Tedavisi', 'Endokrinoloji', 'high', '{
  "description": "Kan şekeri düşüklüğü durumunda uygulanacak acil tedavi protokolü",
  "symptoms": [
    "Titreme, terleme",
    "Çarpıntı, baş dönmesi", 
    "Açlık hissi",
    "Bilinç bulanıklığı",
    "Koma (ciddi durumlarda)"
  ],
  "treatment": {
    "bilinçli_hasta": {
      "title": "Bilinçli Hasta",
      "treatment": [
        "15-20 g hızlı emilen karbonhidrat",
        "Şeker, bal, meyve suyu",
        "15 dakika sonra kan şekeri kontrolü",
        "Gerekirse tekrarlayın"
      ]
    },
    "bilinçsiz_hasta": {
      "title": "Bilinçsiz Hasta",
      "treatment": [
        "IV yol açın",
        "Dekstroz %50 20-50 ml IV bolus",
        "Glukagon 1 mg IM (IV yol açılamazsa)",
        "Kan şekeri takibi",
        "Bilinç düzeyini değerlendirin"
      ]
    }
  },
  "monitoring": [
    "Kan şekeri her 15 dakikada",
    "Vital bulgular",
    "Nörolojik muayene",
    "Tekrarlama riski değerlendirmesi"
  ]
}', now());