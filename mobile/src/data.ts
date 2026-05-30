import { Report, Reward, UserProfile } from './types';

export const INITIAL_USER: UserProfile = {
  name: 'Anar Məmmədov',
  avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRYJSR_OfaCUURbaRjrhrrOnLyDdPCWp59vv61VS6vd9EYPNJjJNKwT6vuorVH46eqNJIjtZjmqdBvwkX_74fsdgNxfN0ygJzpsWnqU0zyfqnhwWGQGdUqqA0lS5Y6MoheVV-O5L82nU-iH1nX7fE58ODp4bDSKcL5LDoITEomWuS013LIL6l4eyPODf0N1lZ1PO_fOsRbVM-Ro0RTthLb5B8kM45-0H9aSQdlQAdV5bH0lha9ZO_QRSzjm-zkStEwZLWi3pCyKJU',
  trustScore: 92,
  reportsCount: 24,
  solvedCount: 18,
  coins: 1240,
  language: 'AZ',
  notificationsEnabled: true
};

export const INITIAL_REPORTS: Report[] = [
  {
    id: '#88241',
    title: 'Asfalt örtüyünün dağılması',
    category: 'Yol təsərrüfatı',
    status: 'İCRADADIR',
    time: '14:20',
    date: '5 iyun',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAG1PXUViWvVLFQSv8njuDoVXWghMV0PU76godhm7pqdIhB_PwKwekw_HjEc34tX59MJxTzxs2Lf1c7FZTrTbKZwrA5DwBITKWiEs9TRfg6BG_g9hD-NisTFHRHOv36tAyTACsjingjwtlOi9Je8xnXEspont7Ofi-FkiUq1bY1FJuhjAk18h8icnTqu1EWIEHByQ_oQ9mbNMQPmfY35nfBVcG3fDQhqv31SElfUB0zI89WgQX9zm69yi_HnCCP2rcQTCKS14NXhJw',
    descr: 'Yolun bu hissəsində dərin çuxur yaranıb. Yağışlı havalarda bura su dolur və sürücülər üçün təhlükə yaradır. Xahiş edirik, operativ tədbir görülsün.',
    location: 'Nərimanov r., Təbriz küç.',
    severity: 'Orta',
    authority: 'Bakı Şəhər İcra Hakimiyyəti',
    reporterName: 'Leyla Məmmədova',
    reporterAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDxYzb6TyYwaECai3h96lOYG6J4s7jRtcVaOpjUQgoCqGO78bG6fRnUaisfZM8H5tCLKzYH8P3zG4-rqc_b-L-IzffHS5CDqiLvlR37GlS1-Qb6-n8bngR_GqmoH3ublaES_FW2mie2eVvwO3I7TiImZf324VUbt4ifx4u0nleHpfjZilKMb-5wTyVrJZtF-cS1ucITMAxVqQN-SwjRra6d2vRw9AAprzcrqmbmOvqliQ2zTy9YZizHKTvSCwVaBBDCUmzGq7x0YQ4',
    reactionsCount: 24,
    hasUserReacted: false,
    comments: [
      {
        id: 'c1',
        author: 'Rəşad Əliyev',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbaNipn31mT63WySmwiwVsO8WvO5PtroF28xgalRvknckCRhjkjQqrZHNTxEAEzuUF8AqZOkwZYVx1crA1zRF9UWpBouqL-EslWCsbsK-3JCNX4l7QLaYZM3fW2FXRKNzs7FZ759iQNzy1Ti7aeyNWG5EmR_-Hlzp7h1WiqzqZZIUOQ6YbEkTnBtx0O5OlKq0vh2UdVC-cfaYKvM7AIEmGppd-qSpRp1lEDlIx16UiOMJiO0vjj5JWZ3rhJE_Pd_2Qfswdzl6JCtI',
        time: '1 saat əvvəl',
        text: 'Mən də bu gün səhər keçəndə gördüm, vəziyyət daha da pisləşib.',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPnvoixg-AHiPCjfO9CsDNuSqlPCTIwjYkC7Tph3_iGey5B81IgQE3r_87Bdb4Wkc4Tv818eaMjIKFOuj8t07GU7kBl_dYvlESOaRhLvE7gqaaeFqIShMMlIEb0WAoU49cyx9RJVfrf7VnEhMegTzPzxGgF_GS7FuosxcHZ0ah91bd3hSDEmwgyhJ6sU3dvrIGg2_Mnqfv9We2O52oSnyZ4N6d4x4WxIPsLzT82jA0B3GKTZgwbhv1v3jNZsGLbSLv6DBEfYWWxRY'
      },
      {
        id: 'c2',
        author: 'Anar Quliyev',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBsU04XTneFgwbINARHs-r3N2gLoxv5PnR98RZPDHSDFcoXuUxDlwzo-SgXswK6MS3_wJ7cCvpjnq-ih-xNO5ehxAOuuyxLctDiKRXitgdu9mMbCLK5HWBtRPcG9jVE6P-nvrMV7vbl5dkV13S_-TYGSr1soR8W0Y2iMbOHVGoCaZA4-t-L8ic7FNaHoMMXOXUwxS3Uiwf_LcnHerQisWWRf3o6_7VSz7pQXJevXoeF1AVNUwIRgPuEFx_Oyxh72oBlmxQNxRzu5no',
        time: '45 dəq əvvəl',
        text: 'Dünən axşam maşının təkərini burda zədələdim. Çox təhlükəlidir.'
      }
    ],
    steps: [
      {
        name: 'Süni intellekt yoxlaması',
        status: 'completed',
        subtitle: 'Problem avtomatik olaraq təsdiqləndi',
        time: 'Dünən, 14:20'
      },
      {
        name: 'Operator yoxlaması',
        status: 'completed',
        subtitle: 'Məlumatlar mütəxəssis tərəfindən yoxlanıldı',
        time: 'Bugün, 09:15'
      },
      {
        name: 'Quruma yönləndirildi',
        status: 'current',
        subtitle: 'Müraciət BŞİH-ə göndərildi',
        time: 'Bugün, 10:45'
      },
      {
        name: 'İcradadır',
        status: 'pending',
        subtitle: 'Gözlənilir'
      },
      {
        name: 'Həll edildi',
        status: 'pending',
        subtitle: 'Tamamlanmayıb'
      }
    ]
  },
  {
    id: '#88235',
    title: 'Yol örtüyünün təmiri',
    category: 'Yol təsərrüfatı',
    status: 'İCRADADIR',
    time: '14:20',
    date: '5 iyun',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBi7Un4ngJG76QbOUHlw9DERNoQwWfVZxEyYjjBJs2crfsnM57cQkfYnJPoHWrKCl9UhKaqRxyjqp_hXOj8R2FKH1oyCM4uQRBjWL7nEuzFnQgbMxCdbjeckexB095c6tuKh2ArJcNHxlcByiWx51PRIrlJwkXiGfhqfPGyB0MvsQtSIyRYnS5azC4QQpzp3YhiPpjE_SxhTZ56Ca8oTq6EFkGa5GM6ifV0Ba6H81cql03E0zY-EhMgWzz25eI1x2W1YOP-u5A76ec',
    descr: 'Yol səthində çatların yaranması və çökmə halı qeydə alınmışdır. Böyük bir qəzaya səbəb ola bilər.',
    location: 'Nərimanov r., Ağa Nemətulla küç.',
    severity: 'Yüksək',
    authority: 'Bakı Şəhər İcra Hakimiyyəti',
    reporterName: 'Anar Məmmədov',
    reporterAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRYJSR_OfaCUURbaRjrhrrOnLyDdPCWp59vv61VS6vd9EYPNJjJNKwT6vuorVH46eqNJIjtZjmqdBvwkX_74fsdgNxfN0ygJzpsWnqU0zyfqnhwWGQGdUqqA0lS5Y6MoheVV-O5L82nU-iH1nX7fE58ODp4bDSKcL5LDoITEomWuS013LIL6l4eyPODf0N1lZ1PO_fOsRbVM-Ro0RTthLb5B8kM45-0H9aSQdlQAdV5bH0lha9ZO_QRSzjm-zkStEwZLWi3pCyKJU',
    reactionsCount: 18,
    hasUserReacted: false,
    comments: [
      {
        id: 'c1',
        author: 'Muxtar Hasanov',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbaNipn31mT63WySmwiwVsO8WvO5PtroF28xgalRvknckCRhjkjQqrZHNTxEAEzuUF8AqZOkwZYVx1crA1zRF9UWpBouqL-EslWCsbsK-3JCNX4l7QLaYZM3fW2FXRKNzs7FZ759iQNzy1Ti7aeyNWG5EmR_-Hlzp7h1WiqzqZZIUOQ6YbEkTnBtx0O5OlKq0vh2UdVC-cfaYKvM7AIEmGppd-qSpRp1lEDlIx16UiOMJiO0vjj5JWZ3rhJE_Pd_2Qfswdzl6JCtI',
        time: 'Dünən',
        text: 'Çox ağır vəziyyət var, tez düzəliş lazımdır!'
      },
      {
        id: 'c2',
        author: 'Sərdar Ağabəyov',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBsU04XTneFgwbINARHs-r3N2gLoxv5PnR98RZPDHSDFcoXuUxDlwzo-SgXswK6MS3_wJ7cCvpjnq-ih-xNO5ehxAOuuyxLctDiKRXitgdu9mMbCLK5HWBtRPcG9jVE6P-nvrMV7vbl5dkV13S_-TYGSr1soR8W0Y2iMbOHVGoCaZA4-t-L8ic7FNaHoMMXOXUwxS3Uiwf_LcnHerQisWWRf3o6_7VSz7pQXJevXoeF1AVNUwIRgPuEFx_Oyxh72oBlmxQNxRzu5no',
        time: '1 gün əvvəl',
        text: 'Təmirçilər əraziyə gəliblər, gözləyirik.'
      }
    ],
    steps: [
      {
        name: 'Süni intellekt yoxlaması',
        status: 'completed',
        subtitle: 'Problem avtomatik olaraq təsdiqləndi',
        time: 'Dünən, 10:00'
      },
      {
        name: 'Operator yoxlaması',
        status: 'completed',
        subtitle: 'Məlumatlar mütəxəssis tərəfindən yoxlanıldı',
        time: 'Dünən, 12:30'
      },
      {
        name: 'Quruma yönləndirildi',
        status: 'completed',
        subtitle: 'Müraciət BŞİH-ə göndərildi',
        time: 'Dünən, 15:45'
      },
      {
        name: 'İcradadır',
        status: 'current',
        subtitle: 'Yol tikinti briqadası əraziyə cəlb olunub'
      },
      {
        name: 'Həll edildi',
        status: 'pending',
        subtitle: 'Tamamlanmayıb'
      }
    ]
  },
  {
    id: '#88190',
    title: 'İşıqlandırma problemi',
    category: 'İşıqlandırma',
    status: 'HƏLL EDİLDİ',
    time: 'Dünən',
    date: '28 may',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAY9dmAwIAG4A_vhx7DcKUvbnOlvdydwvWKN-APGl_2lsckG2JcFGf51Ic3JM1kKb8pKY7NvGqIDZr_zqlTBipvXhzrLNfZO2XBB-8gG5viFsNYuyuHSCLRAcOga5tbb3CH5mVEezD74zubBqatzhzUf5ofNhfjBb1tmRMK6s5M3Ij5oHmXRTOD0qzMin_lr43sJvC1NJlKtlSSWZX4FJBBXyewr53aSXsdt_LBDJ8twNDxZjb6x9SRZmYkLOBHqEkV_ZUwC8_0u1o',
    descr: 'Küçə lampaları neçə gündür ki parıldayır və sönürdü, indi isə tamamilə sıradan çıxıb.',
    location: 'Nərimanov r., Atatürk prospekti',
    severity: 'Aşağı',
    authority: 'Bakı Rabitə İdarəsi',
    reporterName: 'Kamil Vəliyev',
    reporterAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHky45d_e2Y8t8302ljFDV5C_dnkQdF-FYI-yr-Ylq3TpTco_W3up3ryni6Oaa6HMhOxjeebyHQQiu7G6MyTd2S_X4U7YEYb6O9MFe7avv0__SzJH1JHpnfjE96HTEM0f3f2glj7tCt4bmgX7YvoGXpFjMupCadKdI2K_Z2ZsmxUCZpkzYP6qlyXdKLCPgsrEG1JICglr2cxxsDPd093iNTdrPvnDs3cvzjdEBpi4ORHJmLepdAXbz_kHpT-e-8IwiZC9ID8CM5NE',
    reactionsCount: 15,
    hasUserReacted: false,
    comments: [],
    steps: [
      {
        name: 'Süni intellekt yoxlaması',
        status: 'completed',
        subtitle: 'Problem təsdiqləndi',
        time: '28 May, 11:30'
      },
      {
        name: 'Quruma yönləndirildi',
        status: 'completed',
        subtitle: 'Bakı Rabitə İdarəsinə yönləndirildi',
        time: '28 May, 13:00'
      },
      {
        name: 'İcradadır',
        status: 'completed',
        subtitle: 'Briqada lampanı yenisi ilə əvəz etdi',
        time: '28 May, 16:30'
      },
      {
        name: 'Həll edildi',
        status: 'completed',
        subtitle: 'Uğurla tamamlandı',
        time: '28 May, 17:00'
      }
    ]
  },
  {
    id: '#88152',
    title: 'Tullantıların daşınması',
    category: 'Təmizlik',
    status: 'GÖZLƏYİR',
    time: '2 gün əvvəl',
    date: '31 may',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCDw9h3NVwkDuK_V6dhRpJ-J9TjEDZtZU5jJXS-ds24PuDHV_9lwLcLpw4KVea4MrxjY958ZAuTxHDi8I1l_Rm3wImMYcIcbUkJl4vWIagKxlH8KOxqyRmhxmfTW6lns_5TTV9dNqaF-FfDQSpKhlBXEd9r3xFWfVwxmyczx5_XhHqtV2U7HpFX0O252qVH8T_dzODE86mkkwHUsnAN9DcpD6SD2_nMpxKIPaN6g1I-UYmO9SaBHd0u7QTBQqjsQP5ZnDnpAXZLKbE',
    descr: 'Zibil qutuları tamamilə dolub və günlərdir boşaldılmır. Antisanitar vəziyyət yaranıb.',
    location: 'Nərimanov r., Gənclik metro ətrafı',
    severity: 'Orta',
    authority: 'Məişət Tullantıları MMC',
    reporterName: 'Fərid Qasımov',
    reporterAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDpFhzqSstvzqT89j5Rc0eep37uw1aQ61bP2GFoCCSqOpkem2q-wSK5VIMOBQ3fIEu8TtavQsyCsbZ50ax4wP5KwDDcysjaFQJcAaZOvnsY4hcFoFkKvZ0srhT1mEF9aCxZIKympelOu2GK5Ra8Qo9W-eArHhl7Jx4m9rNLMaikH69VWosJEmonV9_lugW5VW0Lfbg7xSqmspOXp_fCIIjgmUX26cKVRiGa3fCPp5PkY3jRVmW3btBBkt3WWZJSWn9ZDtmbQH39RnQ',
    reactionsCount: 32,
    hasUserReacted: false,
    comments: [],
    steps: [
      {
        name: 'Süni intellekt təyin etdi',
        status: 'completed',
        subtitle: 'Zibil sahəsi müəyyənləşdirildi',
        time: '3 Gün əvvəl'
      },
      {
        name: 'Operator yoxlaması',
        status: 'current',
        subtitle: 'Sənədlər növbədə gözləyir'
      }
    ]
  }
];

export const INITIAL_REWARDS: Reward[] = [
  {
    id: 'r1',
    title: 'Kofe 20% endirim',
    badge: '20% Endirim',
    cost: 50,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBi76xPqNqPbKTxEKTNbZ7jBKL3hjVN85lCCzi_JCjMeRRdKsC-ScC9WWhB5AuVi5DuYbV8SibcSZY2WRIhTWqTE9CIQtsoGe7bQu5ikp_DfR4bkNnTV3Y84s-BgdTOHcoIVSBXhpXW0ceaUJbT6S9NtjMtrEKcMgyqTqCP3Kszo8V4VshmS68kkWIGT0wS9Z7rvdLXJoD5HPN7tvwbeI1w_i_ev-PNV6JCxar7J9b_H7M-l8djjhlkbfxIHP9i1j_p3sacP-2p8I'
  },
  {
    id: 'r2',
    title: 'Market alış-verişi (5 AZN Kupon)',
    badge: '5 AZN Kupon',
    cost: 120,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYKrlDTk-nmyTAntHX-axOYPx6p5PLBtceTrjTzDN3nzOEtyasi4Xj-RPMaT2JTW7kbBf3mD5bcTvF56J9yOIKIb6OEXBQ6IwqwjPAl5HDMgaIBTGBy5_aEP7f8lel_sCChpADeQA8cJ7TvYFVEyf1y_wLgXxlhTorxDQJNGLxTd3gUDbD7vjOuKuKfGWdCaAMx_yyEvLLajcGUL8AQNatPnVzDY6pXhhMMos3TmXWm3yHb-yy8tPYvFviNJKMGVaOV9Aelu2-CzY'
  },
  {
    id: 'r3',
    title: 'Sinema bileti (1+1 Bilet)',
    badge: '1+1 Bilet',
    cost: 200,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBdGwlG-OUWElFP1MMqHq2jQyvXZOgER13dxH1EaPJOGQa5ktg0pDVOoQ2r9q-ezfwxZZCYbAAbmqpXXaCqScOOnn_e_7FjugaprFS2H-k1cvdVG265DveVCUah_D_fuvumXejFW_DX8ld0cBMKqOqIttfwtFyLJitWoWktRzkDw4w6j8YTfpVJ_hIUcTiCQxwNB0N2pC8gW61VnVsPL_NbDEQr0VfokHemcucbTeyFuXUqXdx14N9ytBCIiNpXdfpqKN_aHySyfQU'
  },
  {
    id: 'r4',
    title: 'Nəqliyyat kartı (Pulsuz gediş)',
    badge: 'Pulsuz Gediş',
    cost: 80,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGNRYdHc0kongw44drdjyWsGerljfVzCMkYsz-b8aZ2oOLvH16Icwo7JfPPqiLmVGZLuSo2FlO1pQxHSeDBHr0DzVuZsYivadCK0QwJpMV4HA-xrkxMJd9VuKNAaBITCvLaprQUndkB7O6eU4-w9PYFwXDOlXI9d8TRZdnWirnB1rRz1-AJrqXvjhcaooTf2PJyuIk87U266aM5fh46f690yNulITz4A-2mqoVK8UvFf0bFy4vAP6HMmNyRyQRYbnE0us7sCEsYE8'
  }
];
