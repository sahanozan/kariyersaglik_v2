/*
  # Örnek İlaç ve Algoritma Verileri Ekleme

  1. Örnek İlaçlar
    - Aspirin (Analjezik)
    - Paracetamol (Analjezik)
    - Amoxicillin (Antibiyotik)
    - Salbutamol (Bronkodilatör)
    - Furosemid (Diüretik)

  2. Örnek Algoritmalar
    - Kardiyopulmoner Resüsitasyon (CPR)
    - Akut Miyokard İnfarktüsü
    - Astım Atağı
    - Anafılaksi
    - Hipoglisemi

  3. Güvenlik
    - Mevcut verileri koruma
    - Sadece yeni veriler ekleme
*/

-- Örnek İlaçlar Ekleme
INSERT INTO drugs (id, name, active_ingredient, category, company, content, created_at, updated_at) VALUES
(
  'aspirin-500mg',
  'Aspirin 500mg',
  'Asetilsalisilik Asit',
  'Analjezikler',
  'Bayer',
  '{
    "description": "Ağrı kesici, ateş düşürücü ve antiinflamatuar etkili ilaç. Kardiyovasküler koruma için de kullanılır.",
    "indications": [
      "Hafif-orta şiddette ağrı",
      "Ateş düşürme",
      "İnflamasyon azaltma",
      "Kardiyovasküler koruma",
      "Miyokard infarktüsü profilaksisi"
    ],
    "dosage": {
      "adult": "500-1000mg günde 3-4 kez, maksimum 4g/gün",
      "pediatric": "10-15mg/kg günde 4 kez bölünmüş dozlarda"
    },
    "contraindications": [
      "Aspirin alerjisi",
      "Aktif gastrointestinal kanama",
      "Ciddi böbrek yetmezliği",
      "Ciddi karaciğer yetmezliği",
      "16 yaş altı çocuklarda viral enfeksiyonlar"
    ],
    "warnings": [
      "Mide koruyucu ile birlikte kullanın",
      "Kanama riskini artırabilir",
      "Gebelikte dikkatli kullanın",
      "Böbrek fonksiyonlarını takip edin"
    ],
    "side_effects": [
      "Mide bulantısı",
      "Mide irritasyonu",
      "Gastrointestinal kanama",
      "Kulak çınlaması",
      "Baş dönmesi"
    ],
    "interactions": [
      "Warfarin ile kanama riskini artırır",
      "ACE inhibitörleri ile böbrek fonksiyonunu bozabilir",
      "Metotreksat ile birlikte kullanmayın",
      "Alkol ile mide irritasyonunu artırır"
    ]
  }',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO drugs (id, name, active_ingredient, category, company, content, created_at, updated_at) VALUES
(
  'paracetamol-500mg',
  'Paracetamol 500mg',
  'Parasetamol',
  'Analjezikler',
  'Atabay',
  '{
    "description": "Güvenli ağrı kesici ve ateş düşürücü. Antiinflamatuar etkisi minimal.",
    "indications": [
      "Hafif-orta şiddette ağrı",
      "Ateş düşürme",
      "Baş ağrısı",
      "Diş ağrısı",
      "Kas ağrıları"
    ],
    "dosage": {
      "adult": "500-1000mg günde 4 kez, maksimum 4g/gün",
      "pediatric": "10-15mg/kg günde 4-6 saatte bir"
    },
    "contraindications": [
      "Parasetamol alerjisi",
      "Ciddi karaciğer yetmezliği",
      "Kronik alkol kullanımı"
    ],
    "warnings": [
      "Günlük maksimum dozu aşmayın",
      "Karaciğer fonksiyonlarını takip edin",
      "Alkol ile birlikte kullanmayın",
      "Diğer parasetamol içeren ilaçlarla birlikte kullanmayın"
    ],
    "side_effects": [
      "Nadiren alerjik reaksiyonlar",
      "Yüksek dozlarda karaciğer toksisitesi",
      "Cilt döküntüsü"
    ],
    "interactions": [
      "Warfarin etkisini artırabilir",
      "Karbamazepin ile etkisi azalabilir",
      "Alkol ile karaciğer toksisitesi riski"
    ]
  }',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO drugs (id, name, active_ingredient, category, company, content, created_at, updated_at) VALUES
(
  'amoxicillin-500mg',
  'Amoxicillin 500mg',
  'Amoksisilin',
  'Antibiyotikler',
  'Deva',
  '{
    "description": "Geniş spektrumlu penisilin grubu antibiyotik. Gram pozitif ve bazı gram negatif bakterilere etkili.",
    "indications": [
      "Üst solunum yolu enfeksiyonları",
      "Alt solunum yolu enfeksiyonları",
      "İdrar yolu enfeksiyonları",
      "Cilt ve yumuşak doku enfeksiyonları",
      "Diş enfeksiyonları"
    ],
    "dosage": {
      "adult": "500mg günde 3 kez, 7-10 gün",
      "pediatric": "25-50mg/kg/gün 3 eşit doza bölünmüş"
    },
    "contraindications": [
      "Penisilin alerjisi",
      "Mononükleoz",
      "Lenfositik lösemi"
    ],
    "warnings": [
      "Alerjik reaksiyon belirtilerini takip edin",
      "Tedaviyi yarıda bırakmayın",
      "Probiyotik desteği düşünün",
      "Böbrek yetmezliğinde doz ayarlaması gerekebilir"
    ],
    "side_effects": [
      "Diyare",
      "Bulantı",
      "Karın ağrısı",
      "Cilt döküntüsü",
      "Vajinal kandidiyaz"
    ],
    "interactions": [
      "Oral kontraseptif etkisini azaltabilir",
      "Warfarin etkisini artırabilir",
      "Allopurinol ile cilt döküntüsü riski"
    ]
  }',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO drugs (id, name, active_ingredient, category, company, content, created_at, updated_at) VALUES
(
  'salbutamol-inhaler',
  'Salbutamol İnhaler',
  'Salbutamol',
  'Bronkodilatörler',
  'GlaxoSmithKline',
  '{
    "description": "Kısa etkili beta-2 agonist. Bronkodilatör etkili, astım ve KOAH tedavisinde kullanılır.",
    "indications": [
      "Astım atağı",
      "KOAH alevlenmesi",
      "Egzersiz kaynaklı bronkospazm",
      "Bronkospazm profilaksisi"
    ],
    "dosage": {
      "adult": "100-200mcg (1-2 puff) gerektiğinde, günde maksimum 8 puff",
      "pediatric": "100mcg (1 puff) gerektiğinde, günde maksimum 4 puff"
    },
    "contraindications": [
      "Salbutamol alerjisi",
      "Hipertrofik obstrüktif kardiyomiyopati"
    ],
    "warnings": [
      "Aşırı kullanımdan kaçının",
      "Kalp ritmi bozukluklarını takip edin",
      "Diabetes mellitusta kan şekerini kontrol edin",
      "Hipertansiyonda dikkatli kullanın"
    ],
    "side_effects": [
      "Tremor",
      "Çarpıntı",
      "Baş ağrısı",
      "Kas krampları",
      "Huzursuzluk"
    ],
    "interactions": [
      "Beta-blokerler etkisini azaltır",
      "Digoksin ile aritmı riski",
      "MAO inhibitörleri ile hipertansif kriz riski"
    ]
  }',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO drugs (id, name, active_ingredient, category, company, content, created_at, updated_at) VALUES
(
  'furosemid-40mg',
  'Furosemid 40mg',
  'Furosemid',
  'Kardiyovasküler İlaçlar',
  'Sanofi',
  '{
    "description": "Güçlü loop diüretik. Kalp yetmezliği, ödem ve hipertansiyon tedavisinde kullanılır.",
    "indications": [
      "Kalp yetmezliği",
      "Akciğer ödemi",
      "Hipertansiyon",
      "Böbrek hastalığına bağlı ödem",
      "Karaciğer hastalığına bağlı asit"
    ],
    "dosage": {
      "adult": "20-80mg günde 1-2 kez, gerektiğinde artırılabilir",
      "pediatric": "1-2mg/kg günde 1-2 kez"
    },
    "contraindications": [
      "Furosemid alerjisi",
      "Anüri",
      "Ciddi elektrolit dengesizliği",
      "Ciddi dehidratasyon"
    ],
    "warnings": [
      "Elektrolit seviyelerini takip edin",
      "Böbrek fonksiyonlarını kontrol edin",
      "Dehidratasyon riskine dikkat edin",
      "İşitme kaybı riski (yüksek dozlarda)"
    ],
    "side_effects": [
      "Hipokalemi",
      "Hiponatremi",
      "Dehidratasyon",
      "Hipotansiyon",
      "Baş dönmesi"
    ],
    "interactions": [
      "Digoksin toksisitesini artırır",
      "Aminoglikozidler ile ototoksisite riski",
      "Lityum seviyesini artırır",
      "NSAİİ ile böbrek fonksiyonunu bozabilir"
    ]
  }',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Örnek Algoritmalar Ekleme
INSERT INTO algorithms (id, title, category, urgency, content, last_updated, created_at) VALUES
(
  'cpr-algorithm',
  'Kardiyopulmoner Resüsitasyon (CPR)',
  'Kardiyovasküler Aciller',
  'high',
  '{
    "description": "Kardiyak arrest durumunda uygulanacak temel ve ileri yaşam desteği algoritması.",
    "symptoms": [
      "Bilinç kaybı",
      "Nabız alınamıyor",
      "Solunum yok",
      "Siyanoz",
      "Pupil dilatasyonu"
    ],
    "immediate_actions": [
      "Güvenliği sağlayın",
      "Yanıt verip vermediğini kontrol edin",
      "Yardım çağırın (112)",
      "Nabız kontrolü (10 saniye)",
      "Göğüs kompresyonlarına başlayın"
    ],
    "treatment": [
      "30 göğüs kompresyonu : 2 nefes ventilasyonu",
      "Kompresyon derinliği: 5-6 cm",
      "Kompresyon hızı: 100-120/dakika",
      "Tam geri çekilmeye izin verin",
      "Minimal kesinti ile devam edin"
    ],
    "medications": [
      "Adrenalin 1mg IV/IO her 3-5 dakikada bir",
      "Amiodaron 300mg IV (VF/VT için)",
      "Atropin 1mg IV (asistoli/PEA için)",
      "Sodyum bikarbonat 1mEq/kg (asidoz için)"
    ],
    "contraindications": [
      "Açık ölüm belirtileri",
      "DNR (Do Not Resuscitate) kararı",
      "Terminal hastalık son evresi"
    ],
    "warning_signs": [
      "Uzamış arrest süresi (>30 dakika)",
      "Hipotermiye bağlı arrest",
      "İlaç intoksikasyonu",
      "Elektrolit dengesizliği"
    ]
  }',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO algorithms (id, title, category, urgency, content, last_updated, created_at) VALUES
(
  'acute-mi-algorithm',
  'Akut Miyokard İnfarktüsü',
  'Kardiyovasküler Aciller',
  'high',
  '{
    "description": "ST elevasyonlu miyokard infarktüsü (STEMI) ve Non-ST elevasyonlu miyokard infarktüsü (NSTEMI) tedavi algoritması.",
    "symptoms": [
      "Göğüs ağrısı (>20 dakika)",
      "Sol kola yayılan ağrı",
      "Nefes darlığı",
      "Bulantı, kusma",
      "Terleme",
      "Anksiyete"
    ],
    "immediate_actions": [
      "12 derivasyonlu EKG çekin",
      "IV yol açın",
      "Oksijen saturasyonunu ölçün",
      "Vital bulguları monitörize edin",
      "Ağrı skorunu değerlendirin"
    ],
    "treatment": [
      "Aspirin 300mg çiğneterek",
      "Klopidogrel 600mg yükleme dozu",
      "Atorvastatin 80mg",
      "Metoprolol 25mg 2x1 (kontrendikasyon yoksa)",
      "Heparin 60 IU/kg bolus"
    ],
    "medications": [
      "Aspirin 300mg stat, sonra 100mg/gün",
      "Klopidogrel 600mg yükleme, sonra 75mg/gün",
      "Atorvastatin 80mg/gün",
      "Metoprolol 25mg 2x1",
      "Ramipril 2.5mg/gün (48 saat sonra)"
    ],
    "contraindications": [
      "Aktif kanama",
      "İntrakraniyal kanama öyküsü",
      "Ciddi hipertansiyon (>180/110)",
      "Son 3 ay içinde major cerrahi"
    ],
    "warning_signs": [
      "Kardiyojenik şok",
      "Mekanik komplikasyonlar",
      "Aritmiler",
      "Perikardial efüzyon"
    ]
  }',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO algorithms (id, title, category, urgency, content, last_updated, created_at) VALUES
(
  'asthma-attack-algorithm',
  'Astım Atağı Yönetimi',
  'Solunum Sistemi Acilleri',
  'high',
  '{
    "description": "Akut astım atağının değerlendirilmesi ve tedavisi için algoritma.",
    "symptoms": [
      "Nefes darlığı",
      "Wheezing (hırıltı)",
      "Göğüste sıkışma hissi",
      "Öksürük",
      "Konuşma güçlüğü"
    ],
    "immediate_actions": [
      "Hasta pozisyonunu düzeltin (oturur pozisyon)",
      "Oksijen saturasyonunu ölçün",
      "Peak flow ölçümü yapın",
      "Vital bulguları kontrol edin",
      "Atak şiddetini değerlendirin"
    ],
    "treatment": [
      "Salbutamol 2.5-5mg nebülizasyon",
      "İpratropium bromür 500mcg nebülizasyon",
      "Prednizolon 40-50mg oral",
      "Oksijen desteği (SpO2 <92% ise)",
      "IV hidrasyon"
    ],
    "medications": [
      "Salbutamol 2.5mg nebülizasyon, 20 dakikada bir",
      "İpratropium bromür 500mcg nebülizasyon",
      "Prednizolon 1mg/kg (maksimum 50mg)",
      "Magnezyum sülfat 2g IV (ciddi atak)",
      "Adrenalin 0.3mg IM (anafilaksi şüphesi)"
    ],
    "contraindications": [
      "Beta-bloker kullanımı",
      "Kardiyovasküler instabilite"
    ],
    "warning_signs": [
      "Siyanoz",
      "Konuşamama",
      "Bilinç değişikliği",
      "Paradoks nabız >20mmHg",
      "Sessiz göğüs"
    ]
  }',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO algorithms (id, title, category, urgency, content, last_updated, created_at) VALUES
(
  'anaphylaxis-algorithm',
  'Anafilaksi Yönetimi',
  'Genel Acil Durumlar',
  'high',
  '{
    "description": "Anafilaktik reaksiyonun tanınması ve acil tedavisi için algoritma.",
    "symptoms": [
      "Ani başlangıçlı cilt reaksiyonları",
      "Nefes darlığı",
      "Hipotansiyon",
      "Gastrointestinal semptomlar",
      "Bilinç değişikliği"
    ],
    "immediate_actions": [
      "Tetikleyici faktörü uzaklaştırın",
      "ABC değerlendirmesi yapın",
      "Adrenalin hazırlayın",
      "IV yol açın",
      "Oksijen verin"
    ],
    "treatment": [
      "Adrenalin 0.3-0.5mg IM (uyluk)",
      "IV sıvı resüsitasyonu",
      "H1 antihistaminik (difenhidramin)",
      "H2 antihistaminik (ranitidin)",
      "Kortikosteroid (prednizolon)"
    ],
    "medications": [
      "Adrenalin 0.3mg IM, gerekirse 5-15 dk sonra tekrar",
      "Difenhidramin 25-50mg IV",
      "Ranitidin 50mg IV",
      "Prednizolon 1-2mg/kg IV",
      "Salbutamol nebülizasyon (bronkospazm varsa)"
    ],
    "contraindications": [
      "Adrenalin için mutlak kontrendikasyon yok"
    ],
    "warning_signs": [
      "Kardiyovasküler kollaps",
      "Solunum yetmezliği",
      "Bilinç kaybı",
      "Bifazik reaksiyon riski"
    ]
  }',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO algorithms (id, title, category, urgency, content, last_updated, created_at) VALUES
(
  'hypoglycemia-algorithm',
  'Hipoglisemi Yönetimi',
  'Genel Acil Durumlar',
  'medium',
  '{
    "description": "Hipogliseminin tanınması ve tedavisi için algoritma. Kan şekeri <70mg/dL durumları.",
    "symptoms": [
      "Terleme",
      "Tremor",
      "Çarpıntı",
      "Açlık hissi",
      "Bilinç değişikliği",
      "Konfüzyon"
    ],
    "immediate_actions": [
      "Kan şekerini ölçün",
      "Bilinç durumunu değerlendirin",
      "IV yol açın (bilinçsizse)",
      "Vital bulguları kontrol edin"
    ],
    "treatment": [
      "Bilinçli hasta: 15-20g oral glukoz",
      "Bilinçsiz hasta: %50 dekstroz 50ml IV",
      "Glukagon 1mg IM (IV yol açılamazsa)",
      "15 dakika sonra kan şekerini tekrar ölçün",
      "Semptomlar düzelene kadar tekrarlayın"
    ],
    "medications": [
      "%50 Dekstroz 50ml IV bolus",
      "Glukagon 1mg IM",
      "Oral glukoz tablet 15-20g",
      "Thiamine 100mg IV (alkol kullanımı öyküsü varsa)"
    ],
    "contraindications": [
      "Hiperglisemi",
      "Glukagon alerjisi"
    ],
    "warning_signs": [
      "Tekrarlayan hipoglisemi",
      "Bilinç düzeyinde bozulma",
      "Nörolojik defisit",
      "Kardiyovasküler instabilite"
    ]
  }',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;