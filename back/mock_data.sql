-- SafeX Mock Database
-- This file contains mock data for the SafeX dashboard
-- Compatible with SQLModel schema in models.py

-- Insert organizations (matching taxonomy.ORGS)
INSERT INTO organization (key, name_az, scope, contact_hint) VALUES
('azersu', 'Azərsu', 'city_utility', 'info@azersu.az'),
('azeriqaz', 'Azəriqaz', 'city_utility', 'info@azeriqaz.az'),
('baku_electric', 'Bakı Elektrik Şəbəkəsi', 'city_utility', 'info@bakuenergy.az'),
('kennan', 'Kənan-A', 'district', 'info@kenan.az'),
('aztelecom', 'Azərtelekom', 'city_utility', 'info@aztelecom.az'),
('parks', 'Yaşıllıq və Parklar', 'district', 'parks@baku.gov.az'),
('cleaning', 'Təmizlik İdarəsi', 'district', 'cleaning@baku.gov.az'),
('road', 'Nəqliyyat və Yollar', 'district', 'roads@baku.gov.az'),
('construction', 'Tikinti İdarəsi', 'district', 'construction@baku.gov.az'),
('emergency', 'Fövqəladə Hallar', 'city_service', 'emergency@az.gov.az');

-- Insert mock issues for Nərimanov district (Baku coordinates: ~40.4093, 49.8671)
-- Note: category values must match enums.Category

-- Road surface problems (potholes)
INSERT INTO issue (lat, lng, title_az, description_az, category, status, severity, priority, deadline, org_key, report_count) VALUES
(40.4093, 49.8671, 'Asfalt örtüyünün zədələnməsi', 'Hüseyn Cavid prospektində asfalt örtüyündə çuxurlar var', 'road_surface', 'in_progress', 'high', 65.5, '2024-06-15 00:00:00', 'road', 12),
(40.4100, 49.8680, 'Yol səthinin deformasiyası', 'Nizami küçəsində asfalt örtüyü zədələnib', 'road_surface', 'ai_review', 'medium', 45.2, '2024-06-20 00:00:00', 'road', 8),
(40.4085, 49.8665, 'Çuxurların yaranması', 'Büllur prospektində böyük çuxurlar var', 'road_surface', 'resolved', 'low', 25.0, '2024-05-30 00:00:00', 'road', 5),
(40.4110, 49.8690, 'Asfaltın qopması', 'Əhməd Cavad küçəsində asfalt qopub', 'road_surface', 'routed', 'high', 58.3, '2024-06-18 00:00:00', 'road', 15),
(40.4075, 49.8650, 'Yol səthinin çatlaması', 'Səməd Vurğun küçəsində asfalt çatlayıb', 'road_surface', 'manual_review', 'medium', 38.7, '2024-06-22 00:00:00', 'road', 6);

-- Road excavation problems
INSERT INTO issue (lat, lng, title_az, description_az, category, status, severity, priority, deadline, org_key, report_count) VALUES
(40.4120, 49.8700, 'Qazılmış asfalt sahəsi', 'Rəşid Behbudov küçəsində qazılmış yerlər var', 'road_excavation', 'in_progress', 'high', 72.1, '2024-06-12 00:00:00', 'construction', 20),
(40.4095, 49.8675, 'Qazıntı işləri nəticəsində zədə', 'Ülviyyə Rəhimova küçəsində qazıntı işləri aparılıb', 'road_excavation', 'ai_review', 'medium', 42.5, '2024-06-25 00:00:00', 'construction', 9),
(40.4080, 49.8660, 'Açıq qazıntı sahəsi', 'Məhəmməd Hadi küçəsində qazılmış yerlər bərpa edilməyib', 'road_excavation', 'resolved', 'low', 20.0, '2024-05-25 00:00:00', 'construction', 3);

-- Sidewalk problems
INSERT INTO issue (lat, lng, title_az, description_az, category, status, severity, priority, deadline, org_key, report_count) VALUES
(40.4105, 49.8685, 'Səkinin zədələnməsi', 'Azadlıq prospektində səki daşları sınıb', 'sidewalk', 'in_progress', 'medium', 48.3, '2024-06-17 00:00:00', 'road', 11),
(40.4090, 49.8670, 'Səki səviyyəsinin fərqi', 'İnşaatçılar prospektində səki səviyyəsi nizamsızdır', 'sidewalk', 'manual_review', 'low', 28.5, '2024-06-28 00:00:00', 'road', 4),
(40.4115, 49.8695, 'Səki daşlarının itkin olması', 'Bakıxanov küçəsində səki daşları yoxdur', 'sidewalk', 'routed', 'medium', 35.0, '2024-06-19 00:00:00', 'road', 7),
(40.4070, 49.8655, 'Səkinin bitki ilə örtülməsi', 'Nizami Gəncəvi küçəsində səki bitkilərlə örtülüb', 'sidewalk', 'ai_review', 'low', 22.0, '2024-06-30 00:00:00', 'parks', 5);

-- Lighting problems
INSERT INTO issue (lat, lng, title_az, description_az, category, status, severity, priority, deadline, org_key, report_count) VALUES
(40.4130, 49.8710, 'İşıq dirəyinin fəaliyyətsizliyi', 'Füzuli küçəsində küçə lampası işləmir', 'lighting', 'in_progress', 'high', 60.5, '2024-06-14 00:00:00', 'baku_electric', 18),
(40.4098, 49.8678, 'İşıqlandırmanın olmaması', 'Zərifə Əliyeva küçəsində küçə lampası yoxdur', 'lighting', 'ai_review', 'medium', 40.2, '2024-06-26 00:00:00', 'baku_electric', 8),
(40.4082, 49.8662, 'İşıq dirəyinin zədələnməsi', 'Məmməd Araz küçəsində dirək əyilib', 'lighting', 'resolved', 'low', 18.5, '2024-05-28 00:00:00', 'baku_electric', 3),
(40.4108, 49.8688, 'Pulsuz işıq lampası', 'Tofiq İsmayılov küçəsində lampa fasiləsiz yanır', 'lighting', 'manual_review', 'medium', 32.0, '2024-06-27 00:00:00', 'baku_electric', 6);

-- Flooding problems
INSERT INTO issue (lat, lng, title_az, description_az, category, status, severity, priority, deadline, org_key, report_count) VALUES
(40.4112, 49.8692, 'Su axınının olması', 'Rəşid Behbudov küçəsində yağışdan sonra su toplanır', 'flooding', 'in_progress', 'high', 68.7, '2024-06-13 00:00:00', 'azersu', 25),
(40.4092, 49.8672, 'Kanalizasiya problemi', 'Hüseyn Cavid prospektində su axını var', 'flooding', 'ai_review', 'high', 55.3, '2024-06-21 00:00:00', 'azersu', 14),
(40.4078, 49.8658, 'Su basması problemi', 'Səməd Vurğun küçəsində yağış suyu yığılır', 'flooding', 'routed', 'medium', 42.0, '2024-06-16 00:00:00', 'azersu', 10),
(40.4102, 49.8682, 'Drenaj sisteminin zədələnməsi', 'Əhməd Cavad küçəsində drenaj işləmir', 'flooding', 'resolved', 'low', 15.0, '2024-05-20 00:00:00', 'azersu', 4);

-- Ice problems
INSERT INTO issue (lat, lng, title_az, description_az, category, status, severity, priority, deadline, org_key, report_count) VALUES
(40.4088, 49.8668, 'Buzlaşma problemi', 'Nizami küçəsində buzla örtülü sahə var', 'ice', 'ai_review', 'medium', 35.5, '2024-12-15 00:00:00', 'cleaning', 7),
(40.4106, 49.8686, 'Buzlu səki', 'Azadlıq prospektində səki buzlu', 'ice', 'manual_review', 'low', 25.0, '2024-12-20 00:00:00', 'cleaning', 3);

-- Park equipment problems
INSERT INTO issue (lat, lng, title_az, description_az, category, status, severity, priority, deadline, org_key, report_count) VALUES
(40.4125, 49.8715, 'Uşaq meydançasının zədələnməsi', 'Nərimanov parkında uşaq qurğuları sınıb', 'park_equipment', 'in_progress', 'high', 62.3, '2024-06-11 00:00:00', 'parks', 16),
(40.4094, 49.8674, 'Qurğunun təhlükəli vəziyyəti', 'Füzuli parkında swing əyilib', 'park_equipment', 'ai_review', 'high', 58.0, '2024-06-23 00:00:00', 'parks', 12),
(40.4076, 49.8656, 'Skameyka zədələnməsi', 'Zərifə Əliyeva parkında skameyka sınıb', 'park_equipment', 'resolved', 'low', 20.0, '2024-05-22 00:00:00', 'parks', 2),
(40.4118, 49.8698, 'Uşaq sürüşdürməsi zədələnib', 'İnşaatçılar parkında sürüşdürmə qırılıb', 'park_equipment', 'manual_review', 'medium', 38.5, '2024-06-24 00:00:00', 'parks', 5);

-- Facade problems
INSERT INTO issue (lat, lng, title_az, description_az, category, status, severity, priority, deadline, org_key, report_count) VALUES
(40.4135, 49.8725, 'Bina fasadının zədələnməsi', 'Rəşid Behbudov küçəsində bina fasadı çatlayıb', 'facade', 'in_progress', 'medium', 45.0, '2024-06-18 00:00:00', 'construction', 9),
(40.4086, 49.8666, 'Fasadın rənginin solması', 'Hüseyn Cavid prospektində bina fasadı təmizlənməyib', 'facade', 'ai_review', 'low', 22.5, '2024-06-29 00:00:00', 'cleaning', 4),
(40.4104, 49.8684, 'Bina fasadında çatlar', 'Nizami küçəsində bina fasadında çatlar var', 'facade', 'routed', 'medium', 33.0, '2024-06-20 00:00:00', 'construction', 6);

-- Green zone problems
INSERT INTO issue (lat, lng, title_az, description_az, category, status, severity, priority, deadline, org_key, report_count) VALUES
(40.4113, 49.8693, 'Ağacın quruması', 'Azadlıq prospektində ağac quruyub', 'green_zone', 'ai_review', 'low', 20.0, '2024-06-25 00:00:00', 'parks', 3),
(40.4091, 49.8671, 'Çəmənliklərin bərpa edilməsi', 'Füzuli küçəsində çəmənliklər zədələnib', 'green_zone', 'in_progress', 'medium', 40.5, '2024-06-16 00:00:00', 'parks', 8),
(40.4079, 49.8659, 'Tikmənmiş ağaclar', 'Səməd Vurğun küçəsində ağaclar kəsilməli', 'green_zone', 'manual_review', 'low', 18.0, '2024-06-28 00:00:00', 'parks', 2);

-- Cleanliness problems
INSERT INTO issue (lat, lng, title_az, description_az, category, status, severity, priority, deadline, org_key, report_count) VALUES
(40.4128, 49.8708, 'Çirkablıq yığımı', 'Büllur prospektində zibil yığılıb', 'cleanliness', 'in_progress', 'medium', 43.5, '2024-06-15 00:00:00', 'cleaning', 15),
(40.4097, 49.8677, 'Təmizlik olmayan zona', 'Ülviyyə Rəhimova küçəsində təmizlik yoxdur', 'cleanliness', 'ai_review', 'low', 25.0, '2024-06-27 00:00:00', 'cleaning', 6),
(40.4081, 49.8661, 'Zibil konteynerlərinin dolması', 'Məhəmməd Hadi küçəsində konteynerlər dolub', 'cleanliness', 'routed', 'medium', 35.0, '2024-06-19 00:00:00', 'cleaning', 10);

-- Waste container problems
INSERT INTO issue (lat, lng, title_az, description_az, category, status, severity, priority, deadline, org_key, report_count) VALUES
(40.4107, 49.8687, 'Zibil konteynerinin zədələnməsi', 'Əhməd Cavad küçəsində konteyner sınıb', 'waste', 'in_progress', 'medium', 38.0, '2024-06-17 00:00:00', 'cleaning', 7),
(40.4083, 49.8663, 'Konteynerin olmaması', 'Bakıxanov küçəsində zibil konteyneri yoxdur', 'waste', 'ai_review', 'low', 22.0, '2024-06-30 00:00:00', 'cleaning', 4),
(40.4119, 49.8699, 'Konteynerlərin həddindən artıq dolması', 'Tofiq İsmayılov küçəsində konteynerlər dolub', 'waste', 'manual_review', 'medium', 32.5, '2024-06-26 00:00:00', 'cleaning', 5);

-- Signage problems
INSERT INTO issue (lat, lng, title_az, description_az, category, status, severity, priority, deadline, org_key, report_count) VALUES
(40.4132, 49.8722, 'Reklam lövhəsinin zədələnməsi', 'Rəşid Behbudov küçəsində reklam lövhəsi sınıb', 'signage', 'ai_review', 'low', 20.0, '2024-06-28 00:00:00', 'construction', 3),
(40.4093, 49.8673, 'Yol nişanının olmaması', 'Hüseyn Cavid prospektində yol nişanı yoxdur', 'signage', 'in_progress', 'medium', 40.0, '2024-06-18 00:00:00', 'road', 8),
(40.4077, 49.8657, 'Reklam lövhəsinin düşməsi', 'Nizami küçəsində reklam lövhəsi düşüb', 'signage', 'resolved', 'low', 15.0, '2024-05-18 00:00:00', 'construction', 2);

-- Storefront problems
INSERT INTO issue (lat, lng, title_az, description_az, category, status, severity, priority, deadline, org_key, report_count) VALUES
(40.4109, 49.8689, 'Vitrinin zədələnməsi', 'Azadlıq prospektində mağaza vitrini sınıb', 'storefront', 'ai_review', 'low', 18.0, '2024-06-29 00:00:00', 'construction', 2),
(40.4089, 49.8669, 'Vitrin işığının olmaması', 'Füzuli küçəsində vitrin işığı yoxdur', 'storefront', 'manual_review', 'low', 15.0, '2024-06-30 00:00:00', 'baku_electric', 1);

-- Fountain problems
INSERT INTO issue (lat, lng, title_az, description_az, category, status, severity, priority, deadline, org_key, report_count) VALUES
(40.4126, 49.8716, 'Fontanın işləməməsi', 'Nərimanov parkında fontan işləmir', 'fountain', 'in_progress', 'medium', 42.0, '2024-06-19 00:00:00', 'azersu', 11),
(40.4095, 49.8675, 'Fontan suyunun axması', 'Füzuli parkında fontan suyu axır', 'fountain', 'ai_review', 'low', 25.0, '2024-06-25 00:00:00', 'azersu', 4);

-- Construction fence problems
INSERT INTO issue (lat, lng, title_az, description_az, category, status, severity, priority, deadline, org_key, report_count) VALUES
(40.4138, 49.8728, 'Tikinti hasarının zədələnməsi', 'Rəşid Behbudov küçəsində hasar sınıb', 'construction_fence', 'in_progress', 'medium', 38.5, '2024-06-20 00:00:00', 'construction', 7),
(40.4084, 49.8664, 'Hasarın olmaması', 'Hüseyn Cavid prospektində tikinti hasarı yoxdur', 'construction_fence', 'ai_review', 'low', 22.0, '2024-06-27 00:00:00', 'construction', 3);

-- Other problems
INSERT INTO issue (lat, lng, title_az, description_az, category, status, severity, priority, deadline, org_key, report_count) VALUES
(40.4114, 49.8694, 'Digər problem', 'Azadlıq prospektində müxtəlif problemlər var', 'other', 'ai_review', 'low', 20.0, '2024-06-28 00:00:00', 'emergency', 3),
(40.4096, 49.8676, 'Qeyri-müəyyən problem', 'Füzuli küçəsində problem aşkar olunub', 'other', 'manual_review', 'low', 18.0, '2024-06-29 00:00:00', 'emergency', 2);

-- Additional mock data for testing (more variety)
INSERT INTO issue (lat, lng, title_az, description_az, category, status, severity, priority, deadline, org_key, report_count) VALUES
(40.4140, 49.8730, 'Böyük çuxur', 'Əsas yolda böyük çuxur var', 'road_surface', 'in_progress', 'high', 75.0, '2024-06-10 00:00:00', 'road', 30),
(40.4070, 49.8650, 'Küçə lampası yoxdur', 'Qaranlıq küçədə işıq yoxdur', 'lighting', 'ai_review', 'high', 62.0, '2024-06-22 00:00:00', 'baku_electric', 22),
(40.4120, 49.8705, 'Su basması', 'Yağışdan sonra su yığılır', 'flooding', 'routed', 'high', 70.0, '2024-06-12 00:00:00', 'azersu', 28),
(40.4085, 49.8665, 'Uşaq qurğusu sınıb', 'Təhlükəli vəziyyətdə', 'park_equipment', 'in_progress', 'high', 68.0, '2024-06-11 00:00:00', 'parks', 19),
(40.4100, 49.8680, 'Asfalt çatlayıb', 'Yol səthi zədələnib', 'road_surface', 'resolved', 'medium', 45.0, '2024-05-25 00:00:00', 'road', 13),
(40.4090, 49.8670, 'Səki daşları itkin', 'Gediş üçün təhlükəli', 'sidewalk', 'manual_review', 'medium', 40.0, '2024-06-24 00:00:00', 'road', 9),
(40.4110, 49.8690, 'Kanalizasiya axını', 'Su axını problemi', 'flooding', 'ai_review', 'medium', 48.0, '2024-06-21 00:00:00', 'azersu', 15),
(40.4075, 49.8655, 'İşıq dirəyi əyilib', 'Təhlükəli vəziyyətdə', 'lighting', 'in_progress', 'medium', 42.0, '2024-06-16 00:00:00', 'baku_electric', 11),
(40.4125, 49.8710, 'Çəmənlik zədələnib', 'Yaşıllıq zonası bərpa edilməlidir', 'green_zone', 'routed', 'low', 25.0, '2024-06-19 00:00:00', 'parks', 6),
(40.4080, 49.8660, 'Zibil yığılıb', 'Təmizlik tələb olunur', 'cleanliness', 'in_progress', 'low', 30.0, '2024-06-15 00:00:00', 'cleaning', 12);
