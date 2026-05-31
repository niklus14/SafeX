import { Report, Reward, UserProfile } from './types';

export const INITIAL_USER: UserProfile = {
  name: 'Anar Məmmədov',
  avatar: 'https://picsum.photos/seed/anar-avatar/80/80',
  trustScore: 92,
  reportsCount: 24,
  solvedCount: 18,
  coins: 1240,
  language: 'AZ',
  notificationsEnabled: true,
};

// ── Shared avatar pool (deterministic picsum) ────────────────────────────────
const AV = {
  anar:    'https://picsum.photos/seed/u-anar/40/40',
  leyla:   'https://picsum.photos/seed/u-leyla/40/40',
  resad:   'https://picsum.photos/seed/u-resad/40/40',
  ferid:   'https://picsum.photos/seed/u-ferid/40/40',
  kamil:   'https://picsum.photos/seed/u-kamil/40/40',
  aysel:   'https://picsum.photos/seed/u-aysel/40/40',
  murad:   'https://picsum.photos/seed/u-murad/40/40',
  nermin:  'https://picsum.photos/seed/u-nermin/40/40',
};

// ── Shared image pool ────────────────────────────────────────────────────────
const IMG = {
  road1:    '/img/potholes.png',
  road2:    '/img/potholes.png',
  road3:    '/img/potholes.png',
  trash1:   'https://images.unsplash.com/photo-1604187351574-c75ca79f5807?auto=format&fit=crop&w=800&h=450',
  trash2:   'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&h=450',
  light1:   '/img/streetlights.png',
  sidewalk1:'/img/sidewalk.png',
  flood1:   '/img/drainage.png',
  park1:    '/img/swing.png',
};

export const INITIAL_REPORTS: Report[] = [

  // ══ CLUSTER: İnşaatçılar prospekti — Asfalt çuxuru ══
  // Root report — 3 citizens joined this thread
  {
    id: '#88241',
    title: 'İnşaatçılar prospektində dərin çuxur',
    category: 'Asfalt örtüyü',
    status: 'İCRADADIR',
    time: '09:40',
    date: '30 may',
    imageUrl: IMG.road1,
    descr: 'Prospektin Koroğlu qovşağına yaxın hissəsində böyük çuxur yaranıb. Yağışdan sonra su dolur, sürücülər görmür. 3 vətəndaş bu problemi müstəqil bildirdi — sistem eyni yerə aid hesab edərək müraciətləri birləşdirdi.',
    location: 'İnşaatçılar prospekti, Nərimanov r.',
    severity: 'Yüksək',
    authority: 'MKT Birliyi',
    reporterName: 'Anar Məmmədov',
    reporterAvatar: AV.anar,
    reactionsCount: 47,
    hasUserReacted: false,
    comments: [
      {
        id: 'c1',
        author: 'Leyla Həsənova',
        avatar: AV.leyla,
        time: '2 saat əvvəl',
        text: 'Mən də eyni yerə müraciət etmişdim — sistem avtomatik birləşdirdi. Çox faydalıdır!',
        imageUrl: IMG.road2,
      },
      {
        id: 'c2',
        author: 'Rəşad Əliyev',
        avatar: AV.resad,
        time: '1 saat əvvəl',
        text: 'Dünən gecə maşının ön asqısı burada sındı. Dərhal tədbirə ehtiyac var.',
        imageUrl: IMG.road3,
      },
      {
        id: 'c3',
        author: 'Fərid Qasımov',
        avatar: AV.ferid,
        time: '35 dəq əvvəl',
        text: 'Briqada bu gün əraziyə gəlib. Zəhmət çəkib gözlədim, işlər başlanır.',
      },
    ],
    steps: [
      { name: 'Süni intellekt yoxlaması',  status: 'completed', subtitle: 'Problem avtomatik təsdiqləndi',           time: '30 May, 09:40' },
      { name: 'Operator yoxlaması',        status: 'completed', subtitle: 'Məlumatlar operatorca doğrulandı',       time: '30 May, 10:15' },
      { name: 'Quruma yönləndirildi',      status: 'completed', subtitle: 'MKT Birliyinə göndərildi',              time: '30 May, 11:00' },
      { name: 'İcradadır',                 status: 'current',   subtitle: 'Yol briqadası əraziyə cəlb olunub' },
      { name: 'Həll edildi',               status: 'pending',   subtitle: 'Tamamlanmayıb' },
    ],
  },

  // ══ CLUSTER: Gənclik metro — Zibil daşıb (3 reports) ══
  {
    id: '#88235',
    title: 'Gənclik metro qarşısında zibil daşıb',
    category: 'Zibil',
    status: 'GÖZLƏYİR',
    time: '14:20',
    date: '29 may',
    imageUrl: IMG.trash1,
    descr: 'Metro girişi qarşısındakı konteynerlər 5 gündür boşaldılmır. Yay istisinin təsiri ilə ağır qoxu yayılır. Siçovullar görünüb. 3 müraciət eyni yerdə birləşdirilib.',
    location: 'Gənclik metro stansiyası ətrafı',
    severity: 'Orta',
    authority: '"Təmiz Şəhər" ASC',
    reporterName: 'Fərid Qasımov',
    reporterAvatar: AV.ferid,
    reactionsCount: 61,
    hasUserReacted: false,
    comments: [
      {
        id: 'c4',
        author: 'Aysel Hüseynova',
        avatar: AV.aysel,
        time: 'Dünən',
        text: 'Konteynerin yanına artıq tullantı da atılıb. Vəziyyət daha da pisləşib.',
        imageUrl: IMG.trash2,
      },
      {
        id: 'c5',
        author: 'Kamil Vəliyev',
        avatar: AV.kamil,
        time: '3 saat əvvəl',
        text: 'Uşaq parkı buraya bitişikdir. Bu antisanitar vəziyyət çox narahat edir.',
      },
    ],
    steps: [
      { name: 'Süni intellekt yoxlaması', status: 'completed', subtitle: 'Zibil sahəsi müəyyənləşdirildi', time: '29 May, 14:20' },
      { name: 'Operator yoxlaması',       status: 'current',   subtitle: 'Sənədlər növbədə gözləyir' },
      { name: 'Quruma yönləndirildi',     status: 'pending',   subtitle: 'Gözlənilir' },
      { name: 'İcradadır',                status: 'pending',   subtitle: 'Gözlənilir' },
      { name: 'Həll edildi',              status: 'pending',   subtitle: 'Tamamlanmayıb' },
    ],
  },

  // ══ STANDALONE: Mirzə Fətəli küç. — Işıqlandırma — RESOLVED ══
  {
    id: '#88190',
    title: 'Mirzə Fətəli küçəsinin işıqları söndü',
    category: 'İşıqlandırma',
    status: 'HƏLL EDİLDİ',
    time: 'Dünən',
    date: '28 may',
    imageUrl: IMG.light1,
    descr: 'Küçənin 200 metrlik hissəsindəki 3 LED dirəyi 2 həftə sönük qaldı. Gecə piyadalar üçün çox qaranlıq idi. Müraciətdən 48 saat sonra "Bakıişıq" briqadası gəlib dirəkləri bərpa etdi.',
    location: 'Mirzə Fətəli Axundzadə küçəsi',
    severity: 'Yüksək',
    authority: '"Bakıişıq" MMC',
    reporterName: 'Kamil Vəliyev',
    reporterAvatar: AV.kamil,
    reactionsCount: 29,
    hasUserReacted: false,
    comments: [
      {
        id: 'c6',
        author: 'Murad Babayev',
        avatar: AV.murad,
        time: '2 gün əvvəl',
        text: 'Velosiped sürərkən gecə bu hissədə qəzaya düşdüm. Tez həll edilməsi çox vacib idi.',
      },
      {
        id: 'c7',
        author: 'Nərmin İsgəndərova',
        avatar: AV.nermin,
        time: '1 gün əvvəl',
        text: 'Briqada gəldi və işlər başladı. Operativlik üçün təşəkkür!',
      },
    ],
    steps: [
      { name: 'Süni intellekt yoxlaması', status: 'completed', subtitle: 'Problem avtomatik təsdiqləndi',    time: '28 May, 10:00' },
      { name: 'Operator yoxlaması',       status: 'completed', subtitle: 'Mütəxəssis doğruladı',            time: '28 May, 11:30' },
      { name: 'Quruma yönləndirildi',     status: 'completed', subtitle: '"Bakıişıq" MMC-yə göndərildi',    time: '28 May, 13:00' },
      { name: 'İcradadır',                status: 'completed', subtitle: 'Briqada dirəkləri yenilədi',      time: '28 May, 16:30' },
      { name: 'Həll edildi',              status: 'completed', subtitle: 'Uğurla tamamlandı',               time: '28 May, 17:00' },
    ],
  },

  // ══ CLUSTER: Atatürk prospekti — Səki qırılıb (2 reports) ══
  {
    id: '#88152',
    title: 'Atatürk prospektində 150m səki dağılıb',
    category: 'Səki',
    status: 'GÖZLƏYİR',
    time: '2 gün əvvəl',
    date: '29 may',
    imageUrl: IMG.sidewalk1,
    descr: 'Plitələrin böyük hissəsi qalxıb. Yaşlı sakinlər və əlil arabalılar keçə bilmir. Yaxınlıqda yaşayanların 2 müraciəti sistem tərəfindən eyni problem kimi birləşdirilib.',
    location: 'Atatürk prospekti, Nərimanov r.',
    severity: 'Yüksək',
    authority: 'RİH — Abadlıq şöbəsi',
    reporterName: 'Rəşad Əliyev',
    reporterAvatar: AV.resad,
    reactionsCount: 38,
    hasUserReacted: false,
    comments: [
      {
        id: 'c8',
        author: 'Nərmin İsgəndərova',
        avatar: AV.nermin,
        time: 'Dünən',
        text: 'Qalxmış plitəyə ilişib yıxılan qadın yaralıdır. Bu sahə bağlanmalı idi!',
      },
    ],
    steps: [
      { name: 'Süni intellekt yoxlaması', status: 'completed', subtitle: 'Avtomatik təsdiqləndi', time: '29 May, 09:00' },
      { name: 'Operator yoxlaması',       status: 'current',   subtitle: 'Növbədə gözlənilir' },
      { name: 'Quruma yönləndirildi',     status: 'pending',   subtitle: 'Gözlənilir' },
      { name: 'İcradadır',                status: 'pending',   subtitle: 'Gözlənilir' },
      { name: 'Həll edildi',              status: 'pending',   subtitle: 'Tamamlanmayıb' },
    ],
  },

  // ══ CLUSTER: Gənclik prospekti — Subasma (2 reports) ══
  {
    id: '#88130',
    title: 'Gənclik prospektinin drenajı tıxanıb',
    category: 'Subasma',
    status: 'İCRADADIR',
    time: '3 gün əvvəl',
    date: '28 may',
    imageUrl: IMG.flood1,
    descr: 'Yarpaq və tullantılarla dolu drenaj kanalı yağış suyunu saxlayır. Hər yağışda yol 20-30 sm su altında qalır. 2 müraciət birləşdirildi, işlər artıq başlanıb.',
    location: 'Gənclik prospekti, Nərimanov r.',
    severity: 'Yüksək',
    authority: '"Azərsu" ASC',
    reporterName: 'Fərid Qasımov',
    reporterAvatar: AV.ferid,
    reactionsCount: 52,
    hasUserReacted: false,
    comments: [
      {
        id: 'c9',
        author: 'Kamil Vəliyev',
        avatar: AV.kamil,
        time: '2 gün əvvəl',
        text: 'Bu gün 40 dəqiqə keçilməz oldu. İşə gedənlər başqa küçəyə keçməli oldu.',
      },
      {
        id: 'c10',
        author: 'Leyla Həsənova',
        avatar: AV.leyla,
        time: '1 gün əvvəl',
        text: '"Azərsu" işçiləri əraziyə gəlib. Drenajı təmizlədilər, nəticə gözləyirik.',
      },
    ],
    steps: [
      { name: 'Süni intellekt yoxlaması', status: 'completed', subtitle: 'Drenaj problemi aşkarlandı',  time: '28 May, 08:30' },
      { name: 'Operator yoxlaması',       status: 'completed', subtitle: 'Mütəxəssis doğruladı',        time: '28 May, 09:45' },
      { name: 'Quruma yönləndirildi',     status: 'completed', subtitle: '"Azərsu" ASC-yə göndərildi',  time: '28 May, 11:00' },
      { name: 'İcradadır',                status: 'current',   subtitle: 'Drenaj briqadası işdədir' },
      { name: 'Həll edildi',              status: 'pending',   subtitle: 'Tamamlanmayıb' },
    ],
  },

  // ══ STANDALONE: Nərimanov bağı — Yaşıllıq ══
  {
    id: '#88110',
    title: 'Nərimanov bağında otlar 1 metrdən hündürdür',
    category: 'Yaşıllıq',
    status: 'GÖZLƏYİR',
    time: '4 gün əvvəl',
    date: '27 may',
    imageUrl: IMG.park1,
    descr: 'Park uzun müddətdir biçilməyib. Həşərat yuvaları əmələ gəlib, sakinlər parkdan istifadə edə bilmir. İlan görüldüyü barədə məlumat daxil olub.',
    location: 'Nərimanov bağı, Nərimanov r.',
    severity: 'Aşağı',
    authority: 'Yaşıllaşdırma Birliyi',
    reporterName: 'Leyla Həsənova',
    reporterAvatar: AV.leyla,
    reactionsCount: 21,
    hasUserReacted: false,
    comments: [
      {
        id: 'c11',
        author: 'Aysel Hüseynova',
        avatar: AV.aysel,
        time: '3 gün əvvəl',
        text: 'Uzun otlar içərisindən ilan keçdiyini gördüm. Uşaqlar oynayan sahədir — təcili tədbir lazımdır!',
      },
    ],
    steps: [
      { name: 'Süni intellekt yoxlaması', status: 'completed', subtitle: 'Sahə problemi müəyyənləşdirildi', time: '27 May, 15:00' },
      { name: 'Operator yoxlaması',       status: 'current',   subtitle: 'Növbədə gözlənilir' },
      { name: 'Quruma yönləndirildi',     status: 'pending',   subtitle: 'Gözlənilir' },
      { name: 'İcradadır',                status: 'pending',   subtitle: 'Gözlənilir' },
      { name: 'Həll edildi',              status: 'pending',   subtitle: 'Tamamlanmayıb' },
    ],
  },
];

export const INITIAL_REWARDS: Reward[] = [
  {
    id: 'r1',
    title: 'Kofe 20% endirim',
    badge: '20% Endirim',
    cost: 50,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBi76xPqNqPbKTxEKTNbZ7jBKL3hjVN85lCCzi_JCjMeRRdKsC-ScC9WWhB5AuVi5DuYbV8SibcSZY2WRIhTWqTE9CIQtsoGe7bQu5ikp_DfR4bkNnTV3Y84s-BgdTOHcoIVSBXhpXW0ceaUJbT6S9NtjMtrEKcMgyqTqCP3Kszo8V4VshmS68kkWIGT0wS9Z7rvdLXJoD5HPN7tvwbeI1w_i_ev-PNV6JCxar7J9b_H7M-l8djjhlkbfxIHP9i1j_p3sacP-2p8I',
  },
  {
    id: 'r2',
    title: 'Market alış-verişi (5 AZN Kupon)',
    badge: '5 AZN Kupon',
    cost: 120,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYKrlDTk-nmyTAntHX-axOYPx6p5PLBtceTrjTzDN3nzOEtyasi4Xj-RPMaT2JTW7kbBf3mD5bcTvF56J9yOIKIb6OEXBQ6IwqwjPAl5HDMgaIBTGBy5_aEP7f8lel_sCChpADeQA8cJ7TvYFVEyf1y_wLgXxlhTorxDQJNGLxTd3gUDbD7vjOuKuKfGWdCaAMx_yyEvLLajcGUL8AQNatPnVzDY6pXhhMMos3TmXWm3yHb-yy8tPYvFviNJKMGVaOV9Aelu2-CzY',
  },
  {
    id: 'r3',
    title: 'Sinema bileti (1+1 Bilet)',
    badge: '1+1 Bilet',
    cost: 200,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBdGwlG-OUWElFP1MMqHq2jQyvXZOgER13dxH1EaPJOGQa5ktg0pDVOoQ2r9q-ezfwxZZCYbAAbmqpXXaCqScOOnn_e_7FjugaprFS2H-k1cvdVG265DveVCUah_D_fuvumXejFW_DX8ld0cBMKqOqIttfwtFyLJitWoWktRzkDw4w6j8YTfpVJ_hIUcTiCQxwNB0N2pC8gW61VnVsPL_NbDEQr0VfokHemcucbTeyFuXUqXdx14N9ytBCIiNpXdfpqKN_aHySyfQU',
  },
  {
    id: 'r4',
    title: 'Nəqliyyat kartı (Pulsuz gediş)',
    badge: 'Pulsuz Gediş',
    cost: 80,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGNRYdHc0kongw44drdjyWsGerljfVzCMkYsz-b8aZ2oOLvH16Icwo7JfPPqiLmVGZLuSo2FlO1pQxHSeDBHr0DzVuZsYivadCK0QwJpMV4HA-xrkxMJd9VuKNAaBITCvLaprQUndkB7O6eU4-w9PYFwXDOlXI9d8TRZdnWirnB1rRz1-AJrqXvjhcaooTf2PJyuIk87U266aM5fh46f690yNulITz4A-2mqoVK8UvFf0bFy4vAP6HMmNyRyQRYbnE0us7sCEsYE8',
  },
];
