import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowLeft, 
  MapPin, 
  Camera, 
  ChevronRight, 
  Send, 
  Check, 
  Info, 
  Compass, 
  ClipboardList, 
  Award, 
  User, 
  Copy, 
  Plus, 
  Bell, 
  Shield, 
  Globe, 
  LogOut, 
  CheckCircle2, 
  MessageSquare, 
  Search, 
  Calendar,
  Zap,
  Flame,
  AlertOctagon,
  Image as ImageIcon,
  ThumbsUp,
  HelpCircle,
  QrCode
} from 'lucide-react';
import { AppScreen, Report, Reward, UserProfile, ReportComment } from './types';
import { INITIAL_USER, INITIAL_REPORTS, INITIAL_REWARDS } from './data';
import { api } from './api';

export default function App() {
  // Screen and core states
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(AppScreen.ONBOARDING);
  const [previousScreen, setPreviousScreen] = useState<AppScreen | null>(null);
  
  // User Profile state
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  
  // Reports states
  const [reports, setReports] = useState<Report[]>(INITIAL_REPORTS);
  const [selectedReportId, setSelectedReportId] = useState<string | null>('#88241');
  const [activeChip, setActiveChip] = useState<'HAMISI' | 'AKTIV' | 'HELLEDILIB'>('HAMISI');
  
  // Rewards states
  const [rewards, setRewards] = useState<Reward[]>(INITIAL_REWARDS);
  const [claimedReward, setClaimedReward] = useState<{ reward: Reward; code: string } | null>(null);

  // API session — userId persisted in localStorage; apiIssueIds maps local report ID → backend issue ID
  const [userId, setUserId] = useState<number | null>(() => {
    const stored = localStorage.getItem('openwave_user_id');
    return stored ? parseInt(stored, 10) : null;
  });
  const [apiIssueIds, setApiIssueIds] = useState<Record<string, number>>({});
  
  // Onboarding Carousel index
  const [carouselIndex, setCarouselIndex] = useState<number>(0);
  const [permissionsGranted, setPermissionsGranted] = useState({
    camera: false,
    location: false
  });

  // Flow details for creating a new report
  const [newReportPhoto, setNewReportPhoto] = useState<string>('');
  const [newReportType, setNewReportType] = useState<string>('Yol Təmiri');
  const [newReportDescription, setNewReportDescription] = useState<string>('');
  const [newReportLocation, setNewReportLocation] = useState<string>('Nərimanov r., Təbriz küç.');
  const [isLocationCustom, setIsLocationCustom] = useState<boolean>(false);
  
  // Newly created report reference to view in Detail screen
  const [justCreatedReportId, setJustCreatedReportId] = useState<string | null>(null);

  // Simulation steps timer reference
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [analysisStep, setAnalysisStep] = useState<number>(1); // 1: Image, 2: Category, 3: Institution

  // Toast notifications for user feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // New comment input back to detailed tracking
  const [newCommentText, setNewCommentText] = useState<string>('');

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Helper to change screen
  const navigateTo = (screen: AppScreen) => {
    setPreviousScreen(currentScreen);
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Onboarding data
  const onboardingSlides = [
    {
      title: 'Problemi gör, şəkil çək',
      text: 'Şəhərimizdə gördüyünüz istənilən çatışmazlığı bircə kliklə qeydə alın.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBsqWwcbOj6sVL--9UqoWekC02Kwu9fzioGQ6p3p2DiDENzLnfrqzdZYejDqi3n_3y4OpUzORlTLhuCex-TVl3PAbPF_EsRA9RMwMz-GEl8OL6CUUFMjbVfoHckwCEULlx1txzz4YeXlh4VtqWUawsrTNDy5AJtibo2EJqTbhHVYqs1Nu60uf6YEhzePWh_0fLPWHlhOFF702MfUoTXfzpUe8lSnehwNnRK9Bv3cVR2YNx4HUipEJm1xS7I0JvQ-ACSDFnVe6KQnzk'
    },
    {
      title: 'Süni intellekt avtomatik təyin edir',
      text: 'Ağıllı sistemimiz problemi dərhal analiz edib aidiyyatı quruma yönləndirir.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCCL21J4rnrVE2wYiSLuK8F5uIgm47q7CGYRBCVM3BQKbLvivzxp69sV-Y6haBDk7lA80oZS83rmFVjNexURYfiX7htSCIQMulYIxZ4hOJG9Yf1BTBICy0Rvd01Np8MRPrhNoHYA56AbvXE4CrSCCL_TfpVnYrIiMCZ9qEwvuVNka4QD-XN6OWGORnFGzaGkifre_ygV_3DyAXUYcD8FgSS9aDFrcun2qFRhPyyrgWxysB3tfbND7LCMBBtuKMNn4uvnItUd-x9TrI'
    },
    {
      title: 'Birlikdə həll edirik',
      text: 'Problemin həllinə nəzarət edin və şəhərimizin inkişafına töhfə verin.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBJjRv5owZC83lgMOFT3TEE7Qx0eNZR9mwCGzTvJyDewE3XXdVqfOYtJIut7-vMTVpPAy3RnJVIvbcfGyFaD7LfISm05pEmlbSiytCQbFun5ISg2GbA5UVFh2mZvv2Tb2dE1y8oK1lMGn5SufcM6mVnYsF7bAVJhRI69cGre_jFG_uMGDhX29taZ2S4qz9LKoQrNktkTXvHVIg3GsZBXsXdebqSdiBfb9ftLSj_AlnNnrCs3-R71rGwGOo9Yf7N_9TyoRo9065sT28'
    }
  ];

  // Carousel Next Slide Action
  const nextSlide = () => {
    if (carouselIndex < onboardingSlides.length - 1) {
      setCarouselIndex(carouselIndex + 1);
    } else {
      navigateTo(AppScreen.PERMISSIONS);
    }
  };

  // Fast-tracking permissions for demo
  const handleGrantPermission = (type: 'camera' | 'location') => {
    setPermissionsGranted(prev => ({ ...prev, [type]: true }));
    showToast(`${type === 'camera' ? 'Kamera' : 'Məkan'} icazəsi uğurla təmin edildi.`, 'success');
  };

  const handleCompletePermissions = () => {
    if (!permissionsGranted.camera || !permissionsGranted.location) {
      // Granting both for simplicity if they just click proceed
      setPermissionsGranted({ camera: true, location: true });
    }
    navigateTo(AppScreen.FEED);
    showToast('Openwave-ə xoş gəlmisiniz! Cari xəritə və lent yükləndi.', 'success');
  };

  // Filter logic
  const filteredReports = reports.filter(r => {
    if (activeChip === 'HAMISI') return true;
    if (activeChip === 'AKTIV') return r.status === 'İCRADADIR' || r.status === 'GÖZLƏYİR';
    if (activeChip === 'HELLEDILIB') return r.status === 'HƏLL EDİLDİ';
    return true;
  });

  // Action for "Mən də görürəm" button (Support/Vote)
  const handleSupportReport = (reportId: string) => {
    const targetReport = reports.find(r => r.id === reportId);
    if (!targetReport) return;

    if (targetReport.hasUserReacted) {
      showToast('Siz artıq bu müraciəti dəstəkləmisiniz.', 'info');
      return;
    }

    setReports(prev => prev.map(r => {
      if (r.id === reportId) {
        return {
          ...r,
          reactionsCount: r.reactionsCount + 1,
          hasUserReacted: true,
          comments: [
            {
              id: `uc-${Date.now()}`,
              author: 'Anar Məmmədov (Siz)',
              avatar: user.avatar,
              time: 'İndi qeydə alındı',
              text: 'Mən də bu problemi təsdiq edirəm. Çox vacibdir.'
            },
            ...r.comments
          ]
        };
      }
      return r;
    }));

    // Grant user 5 coins for civic validation
    setUser(prev => ({
      ...prev,
      coins: prev.coins + 5
    }));

    showToast('Müraciətiniz digər vətəndaşlarla birləşdirildi! Alınan töhfə: +5 Coin', 'success');
  };

  // Add Comment Flow
  const handleAddComment = (reportId: string) => {
    if (!newCommentText.trim()) return;

    const newComment: ReportComment = {
      id: `comment-${Date.now()}`,
      author: 'Anar Məmmədov (Siz)',
      avatar: user.avatar,
      time: 'İndi',
      text: newCommentText
    };

    setReports(prev => prev.map(r => {
      if (r.id === reportId) {
        return {
          ...r,
          comments: [...r.comments, newComment]
        };
      }
      return r;
    }));

    setUser(prev => ({
      ...prev,
      coins: prev.coins + 2 // Bonus coins for active conversation
    }));

    setNewCommentText('');
    showToast('Xəbərdarlığınız mövzüya əlavə edildi! +2 Coin', 'success');
  };

  // Action to start capturing a photo of a problem
  const triggerCameraInput = () => {
    // We set a random preset Baku visual depending on a random selection
    const problemPresets = [
      {
        photoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuApPoPK5Fs5u_uonw9pfYayadW5sU9lXPM5NlcTfpy5eKet693W-L2wUr3p2ujpYbbNhtmtpSj8AcqYGtiAHlwCDjalBF96QXXkad7QAVZRXMRIVUg5Ulguy2ixxLU3Se5SfNRddtR4miHvMRJ8NKEFD1d7H7mc6Fo_9hGvgUcRJh23mQGe8JYm4IObgGV-2SsN3gNQL6QXap4W3ERtBxDpzfBwEXvcWjMaF_NGiHFw15s8JJ4gIHyq8IRgZP5czdDLD7gBzaHDv58',
        type: 'Yol Təmiri',
        defaultDesc: 'Küçədə dərin asfalt çatları əmələ gəlib, piyadaların və maşınların keçidini əhəmiyyətli dərəcədə çətinləşdirir.',
        location: 'Səbail r., Nizami küç.'
      },
      {
        photoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAuU1oQQGPtYyg6p-O7y36z59AtZ2pUk8MvZ9oA2qDm4NZRtVbuIahYpB1a08RxPkvW3oQU03-U94adhi8UvtkQljTtVBkAj49IzA7wwZZmwn1xnGbHnrbbT6P6SvOnTl_AF6iXW9Vl7FHSDo2lBeK7woKfFTsDWfMVj6gw0G3tStgcAyhKBPtT1knhXRhFTzP-RdWchzO8GIVB-5vSVN6o7dpw0rR5aYFqjzvQT_Grh0ZwRVwUtjLGI8yZRmVQ2Jf_z-rImNW7Po0',
        type: 'Fontan Təmiri',
        defaultDesc: 'Parkdakı tarixi fontanın su təzyiqi tamamilə zəifləyib, bəzi fəvvarələr isə ümumiyyətlə işləmir.',
        location: 'Fəvvarələr meydanı, Baku'
      },
      {
        photoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCDw9h3NVwkDuK_V6dhRpJ-J9TjEDZtZU5jJXS-ds24PuDHV_9lwLcLpw4KVea4MrxjY958ZAuTxHDi8I1l_Rm3wImMYcIcbUkJl4vWIagKxlH8KOxqyRmhxmfTW6lns_5TTV9dNqaF-FfDQSpKhlBXEd9r3xFWfVwxmyczx5_XhHqtV2U7HpFX0O252qVH8T_dzODE86mkkwHUsnAN9DcpD6SD2_nMpxKIPaN6g1I-UYmO9SaBHd0u7QTBQqjsQP5ZnDnpAXZLKbE',
        type: 'Sanitariya və Təmizlik',
        defaultDesc: 'Məişət tullantıları qutularının ətrafına zibillər toplanıb, zibil maşınının gəlməsi gecikir.',
        location: 'Binəqədi r., M.Ə.Rəsulzadə qəs.'
      }
    ];

    const randomIndex = Math.floor(Math.random() * problemPresets.length);
    const selected = problemPresets[randomIndex];

    setNewReportPhoto(selected.photoUrl);
    setNewReportType(selected.type);
    setNewReportDescription(selected.defaultDesc);
    setNewReportLocation(selected.location);
    navigateTo(AppScreen.CAMERA);
  };

  // Simulating shutter tap to view input details form
  const handleShutterTap = () => {
    navigateTo(AppScreen.CREATE_DETAILS);
    showToast('Fotoşəkil uğurla çəkildi. Açılış formu doldurulur.', 'success');
  };

  // Simulating AI analyzing progress bars
  const handleSubmitReportForm = () => {
    navigateTo(AppScreen.AI_ANALYSIS);
    setAnalysisProgress(0);
    setAnalysisStep(1);
  };

  // Register a backend user on first load (or restore existing session)
  useEffect(() => {
    if (!userId) {
      api.createUser(INITIAL_USER.name).then(u => {
        setUserId(u.id);
        localStorage.setItem('openwave_user_id', String(u.id));
      }).catch(() => { /* API unavailable — run in offline/demo mode */ });
    }
  }, []);

  // Fetch rewards catalog from API; fall back to INITIAL_REWARDS if offline
  useEffect(() => {
    api.getRewards().then(data => {
      setRewards(data.map(r => ({
        id: r.id,
        title: r.title_az,
        badge: r.badge,
        cost: r.cost_coins,
        imageUrl: r.image_url,
      })));
    }).catch(() => { /* keep INITIAL_REWARDS */ });
  }, []);

  // When entering REPORT_DETAIL, sync live status from API if we have an issue_id;
  // when entering MY_REPORTS, sync coins/credibility from the user profile.
  useEffect(() => {
    if (currentScreen === AppScreen.REPORT_DETAIL && selectedReportId) {
      const issueId = apiIssueIds[selectedReportId];
      if (issueId) {
        api.getIssue(issueId).then(issue => {
          const statusMap: Record<string, Report['status']> = {
            ai_review: 'GÖZLƏYİR',
            manual_review: 'GÖZLƏYİR',
            routed: 'GÖZLƏYİR',
            in_progress: 'İCRADADIR',
            resolved: 'HƏLL EDİLDİ',
            rejected: 'HƏLL EDİLDİ',
          };
          setReports(prev => prev.map(r => {
            if (r.id !== selectedReportId) return r;
            return {
              ...r,
              status: statusMap[issue.status] ?? r.status,
              authority: issue.org?.name_az ?? r.authority,
              reactionsCount: issue.report_count,
              steps: issue.steps.map(s => ({
                name: s.name,
                status: s.status as 'completed' | 'current' | 'pending',
                subtitle: s.subtitle,
              })),
            };
          }));
        }).catch(() => { /* show local data */ });
      }
    }

    if (currentScreen === AppScreen.MY_REPORTS && userId) {
      api.getMe(userId).then(profile => {
        setUser(prev => ({
          ...prev,
          coins: profile.coins,
          trustScore: profile.credibility,
          reportsCount: profile.reports.length,
          solvedCount: profile.reports.filter(r => r.status === 'resolved').length,
        }));
      }).catch(() => { /* keep local state */ });
    }
  }, [currentScreen, selectedReportId]);

  // Live timer simulation matching our guidelines:
  // "Prefer using primitive values (strings, numbers, booleans) in dependency arrays."
  useEffect(() => {
    let interval: any = null;
    if (currentScreen === AppScreen.AI_ANALYSIS) {
      interval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            // Execute completion, create report item, go to success screen
            handleTriggerReportCreation();
            return 100;
          }
          const nextVal = prev + 5;
          if (nextVal > 70) {
            setAnalysisStep(3);
          } else if (nextVal > 35) {
            setAnalysisStep(2);
          }
          return nextVal;
        });
      }, 150);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentScreen]);

  // Actual insertion of newly reported item to our local react state,
  // then fire-and-forget to the backend so it persists in the real DB.
  const handleTriggerReportCreation = () => {
    const reportId = `#RG-${Math.floor(10000 + Math.random() * 90000)}`;

    const newReportItem: Report = {
      id: reportId,
      title: newReportDescription.length > 30 ? newReportDescription.substring(0, 30) + '...' : (newReportType + ' Proseduru'),
      category: newReportType,
      status: 'GÖZLƏYİR',
      time: 'İndicə',
      date: 'Növbəti günlər',
      imageUrl: newReportPhoto,
      descr: newReportDescription || 'Kamera ilə təyin olunmuş problem sahəsinin təhlili.',
      location: newReportLocation,
      severity: 'Orta',
      authority: newReportType.includes('Yol') ? 'Bakı Şəhər İcra Hakimiyyəti' : 'Abadlıq şöbəsi',
      reporterName: user.name,
      reporterAvatar: user.avatar,
      reactionsCount: 1,
      hasUserReacted: true,
      comments: [],
      steps: [
        {
          name: 'Süni intellekt yoxlaması',
          status: 'completed',
          subtitle: 'Problem uğurla analiz olundu',
          time: 'İndicə'
        },
        {
          name: 'Operator yoxlaması',
          status: 'current',
          subtitle: 'Aidiyyatı idarə tərəfindən baxış gözlənilir'
        }
      ]
    };

    setReports(prev => [newReportItem, ...prev]);
    setJustCreatedReportId(reportId);
    setSelectedReportId(reportId);

    // update profile statistics count and coins (+10 for verified submissions)
    setUser(prev => ({
      ...prev,
      reportsCount: prev.reportsCount + 1,
      coins: prev.coins + 10
    }));

    // Persist to backend (fire-and-forget; local state is the source of truth for UX)
    if (userId !== null) {
      const lat = 40.4093 + (Math.random() - 0.5) * 0.005;
      const lng = 49.8671 + (Math.random() - 0.5) * 0.005;
      api.submitReport({
        imageUrl: newReportPhoto,
        description: newReportDescription,
        lat,
        lng,
        userId,
      }).then(result => {
        if (result.is_relevant && result.issue_id) {
          // Map local report ID → backend issue ID so detail view can sync live status
          setApiIssueIds(prev => ({ ...prev, [reportId]: result.issue_id as number }));
          // If this report joined an existing thread, adjust coins to cluster bonus (+5 not +10)
          if (result.joined_thread) {
            setUser(prev => ({ ...prev, coins: prev.coins - 5 }));
          }
        }
      }).catch(() => { /* API offline — local demo data suffices */ });
    }

    navigateTo(AppScreen.REPORT_CREATED_SUCCESS);
    showToast('Müraciət qəbul edildi! +10 Coin Balansınıza Əlavə Olundu.', 'success');
  };

  // Claim specific reward action checks
  const handleClaimReward = (reward: Reward) => {
    if (user.coins < reward.cost) {
      showToast(`Kifayət qədər Coin yoxdur. Əlavə ${reward.cost - user.coins} Coin lazımdır!`, 'error');
      return;
    }

    // Deduct coin and setup QR claimed view
    setUser(prev => ({
      ...prev,
      coins: prev.coins - reward.cost
    }));

    const verificationCode = `OW-${Math.floor(100 + Math.random() * 900)}-X`;
    setClaimedReward({
      reward,
      code: verificationCode
    });

    navigateTo(AppScreen.REWARD_CLAIMED);
    showToast(`${reward.badge} kuponu uğurla alındı! Kassada təqdim edin.`, 'success');
  };

  return (
    <div className="min-h-screen bg-brand-surface text-brand-on-surface font-sans flex flex-col antialiased selection:bg-brand-primary/20">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] w-11/12 max-w-sm bg-[#3f2c2a] text-[#ffedeb] px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between border border-[#e5bdba]/20 animate-bounce duration-500">
          <div className="flex items-center gap-3">
            {toast.type === 'success' ? (
              <CheckCircle2 className="text-[#a5d6a7]" size={20} />
            ) : toast.type === 'error' ? (
              <AlertOctagon className="text-brand-secondary-container" size={20} />
            ) : (
              <Info className="text-blue-300" size={20} />
            )}
            <p className="text-xs font-semibold leading-tight">{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} className="text-white/60 hover:text-white p-1 ml-1">
            <X size={16} />
          </button>
        </div>
      )}

      {/* RENDER ONBOARDING SLIDES SCREEN */}
      {currentScreen === AppScreen.ONBOARDING && (
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#bd0e21] to-[#870012] flex flex-col justify-between p-6">
          <div className="mt-8 flex justify-center gap-2">
            <MapPin className="text-white" size={28} />
            <span className="font-display font-extrabold text-2xl text-white tracking-tight">Openwave</span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center my-6">
            <div className="w-64 h-64 bg-white/10 rounded-full flex items-center justify-center p-4 border border-white/20 mb-8 backdrop-blur-md">
              <img 
                className="w-48 h-48 object-contain rounded-2xl drop-shadow-lg" 
                src={onboardingSlides[carouselIndex].image} 
                alt="Onboarding" 
              />
            </div>
            
            <h1 className="font-display text-2xl font-extrabold text-white tracking-tight mb-3">
              {onboardingSlides[carouselIndex].title}
            </h1>
            <p className="text-sm text-white/80 max-w-xs leading-relaxed font-medium">
              {onboardingSlides[carouselIndex].text}
            </p>
          </div>

          <div className="flex flex-col items-center gap-6 mb-8">
            {/* Slide dots */}
            <div className="flex gap-2">
              {onboardingSlides.map((_, i) => (
                <div 
                  key={i}
                  onClick={() => setCarouselIndex(i)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    i === carouselIndex ? 'w-6 bg-white' : 'w-2 bg-white/30'
                  }`}
                />
              ))}
            </div>

            <button 
              onClick={nextSlide}
              className="w-full max-w-xs h-14 bg-white text-brand-primary font-bold rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 text-base cursor-pointer hover:bg-[#ffe9e7]"
            >
              Davam et
            </button>
          </div>
        </div>
      )}

      {/* RENDER PERMISSIONS REQUEST SCREEN */}
      {currentScreen === AppScreen.PERMISSIONS && (
        <div className="fixed inset-0 z-50 bg-[#fff8f7] flex flex-col p-6 overflow-y-auto">
          <div className="mt-6 text-center">
            <div className="inline-flex p-3 bg-brand-primary/10 rounded-full text-brand-primary mb-3">
              <Shield size={36} />
            </div>
            <h1 className="font-display text-2xl font-extrabold text-brand-on-surface mb-2">Lazımi icazələr</h1>
            <p className="text-xs text-brand-on-surface-variant max-w-sm mx-auto mb-8 leading-relaxed">
              Tətbiqin tam funksionallığından və süni intellekt analizindən yararlanmaq üçün aşağıdakı girişləri təmin edin.
            </p>
          </div>

          <div className="flex-grow space-y-4 max-w-sm mx-auto w-full">
            {/* Camera Permission Box */}
            <div className="bg-[#ffffff] p-5 rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-[#e5bdba]/30 flex gap-4">
              <div className="p-3 bg-brand-primary/10 rounded-xl text-brand-primary h-fit">
                <Camera size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm text-brand-on-surface">Kamera Girişi</h3>
                <p className="text-xs text-brand-on-surface-variant mb-4 leading-normal mt-1">
                  Problemi yerindəcə fotoşəkil ilə çəkib sənədləşdirmək üçün tələb olunur.
                </p>
                {permissionsGranted.camera ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#e8f5e9] text-[#2e7d32] text-xs font-bold rounded-full">
                    <Check size={14} /> İcazə verildi
                  </span>
                ) : (
                  <button 
                    onClick={() => handleGrantPermission('camera')}
                    className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-full hover:bg-brand-primary-container active:scale-95 transition-all"
                  >
                    İcazə ver
                  </button>
                )}
              </div>
            </div>

            {/* Location Permission Box */}
            <div className="bg-[#ffffff] p-5 rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-[#e5bdba]/30 flex gap-4">
              <div className="p-3 bg-brand-primary/10 rounded-xl text-brand-primary h-fit">
                <MapPin size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm text-brand-on-surface">Məkan Girişi</h3>
                <p className="text-xs text-brand-on-surface-variant mb-4 leading-normal mt-1">
                  Problemin dəqiq ünvanını avtomatik müəyyənləşdirib aidiyyatı quruma ötürmək üçün lazımdır.
                </p>
                {permissionsGranted.location ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#e8f5e9] text-[#2e7d32] text-xs font-bold rounded-full">
                    <Check size={14} /> İcazə verildi
                  </span>
                ) : (
                  <button 
                    onClick={() => handleGrantPermission('location')}
                    className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-full hover:bg-brand-primary-container active:scale-95 transition-all"
                  >
                    İcazə ver
                  </button>
                )}
              </div>
            </div>

            <div className="bg-[#fadbd9]/30 p-4 rounded-xl border border-dashed border-[#e5bdba] mt-4">
              <p className="text-xs text-brand-on-surface-variant/90 italic leading-relaxed text-center">
                Məlumatlarınızın təhlükəsizliyinə dövlət tərəfindən 100% təminat verilir və yalnız rəsmi orqanlar ilə paylaşılır.
              </p>
            </div>
          </div>

          <div className="mt-8 pb-6 flex justify-center">
            <button 
              onClick={handleCompletePermissions}
              className="w-full max-w-xs h-14 bg-brand-primary text-white font-bold rounded-full shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer hover:bg-brand-primary-container"
            >
              Hazırdır <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* RENDER CAMERA VIEW FINDER COMPONENT */}
      {currentScreen === AppScreen.CAMERA && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex justify-between items-center p-4 text-white z-10">
            <button 
              onClick={() => navigateTo(AppScreen.FEED)}
              className="p-2 rounded-full bg-black/40 backdrop-blur-md"
            >
              <X size={20} />
            </button>
            <span className="font-extrabold text-sm tracking-widest uppercase">Kamera süzgəci</span>
            <button className="p-2 rounded-full bg-black/40 backdrop-blur-md text-[#fadbd9]">
              <Zap size={20} />
            </button>
          </div>

          <div className="flex-1 relative overflow-hidden flex items-center justify-center">
            {/* Viewfinder brackets overlay */}
            <div className="absolute z-20 w-72 h-72 border-2 border-white/20 rounded-[32px] pointer-events-none">
              <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-white -translate-x-1 -translate-y-1 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-white translate-x-1 -translate-y-1 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-white -translate-x-1 translate-y-1 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-white translate-x-1 translate-y-1 rounded-br-xl" />
            </div>

            <img 
              className="w-full h-full object-cover select-none" 
              src={newReportPhoto} 
              alt="Simulated live stream" 
            />

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-semibold z-10 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              Avtomatik fokus aktivdir
            </div>
          </div>

          {/* Shutter panel */}
          <div className="h-44 bg-black flex flex-col justify-center items-center px-6 gap-3 shrink-0">
            <p className="text-white/60 text-xs font-semibold mb-1">Şəhər problemini hədəfə alın və düyməni sıxın</p>
            <div className="flex items-center justify-around w-full max-w-xs">
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/20">
                <img 
                  className="w-full h-full object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCiRq3zHHYg_n6miyHFdX4Yz5SFZh1XJJHs1_fnNezEDl4kKE_9ASgvqBryw0elFRQDcrG4ZIirxGHpe-zG5B_R95l42ZmI66pXsuIKjx5L8MITnWCiMP-i-NwyxpX7m4hHLuyyo1J3L4j1xgkRm9HKnv4z3MSJCzC88JOxDF0jXhpCNnrD69qa3Tu0P4bVnLZ9lMs-UqE2DDYYEabsqwnb_dNLJVTpj8FbjrYE_JZQWxGDuwCOrXvHIuYBEVwbRkUlkWuk2pRhjAw" 
                  alt="Gallery" 
                />
              </div>

              <button 
                onClick={handleShutterTap}
                className="w-20 h-20 bg-white rounded-full p-1 transition-transform transform active:scale-90"
                id="shutter-trigger"
              >
                <div className="w-full h-full rounded-full border-4 border-black flex items-center justify-center">
                  <div className="w-14 h-14 bg-brand-primary rounded-full flex items-center justify-center text-white">
                    <Camera size={24} />
                  </div>
                </div>
              </button>

              <div className="w-12" /> {/* alignment spacer */}
            </div>
          </div>
        </div>
      )}

      {/* RENDER DETAILS INPUT after capture */}
      {currentScreen === AppScreen.CREATE_DETAILS && (
        <div className="flex-1 flex flex-col bg-brand-surface pt-4">
          <header className="flex items-center justify-between px-6 h-16 shrink-0 border-b border-[#e5bdba]/10">
            <div className="flex items-center">
              <button 
                onClick={() => navigateTo(AppScreen.CAMERA)}
                className="p-2 -ml-2 text-brand-primary hover:bg-[#ffe9e7] rounded-full transition-colors active:scale-95 duration-200"
              >
                <ArrowLeft size={24} />
              </button>
              <h1 className="ml-4 font-display text-xl font-extrabold text-brand-primary tracking-tight">Detallar</h1>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-[#ffe9e7] text-brand-primary rounded-full">Yeni Müraciət</span>
          </header>

          <main className="flex-grow overflow-y-auto px-6 py-6 space-y-6 max-w-lg mx-auto w-full pb-24">
            {/* Captured Photo box */}
            <div>
              <span className="text-xs font-extrabold text-brand-on-surface-variant uppercase tracking-wider block mb-2">Çəkilmiş şəkil</span>
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-md group">
                <img 
                  className="w-full h-full object-cover" 
                  src={newReportPhoto} 
                  alt="Review captured" 
                />
                <button 
                  onClick={() => navigateTo(AppScreen.CAMERA)}
                  className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold hover:bg-black/75 transition-colors"
                >
                  <Camera size={14} /> Yenidən çək
                </button>
              </div>
            </div>

            {/* AI auto determined Category */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-brand-on-surface-variant uppercase tracking-wider block">Müəyyən edilmiş mövzu növü</label>
              <div className="flex gap-2">
                {['Yol Təmiri', 'Fontan Təmiri', 'Sanitariya və Təmizlik', 'Qəzalı İşıq'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setNewReportType(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                      newReportType === cat 
                        ? 'bg-brand-primary text-white shadow-sm' 
                        : 'bg-white text-brand-on-surface-variant border border-brand-outline-variant/50 hover:bg-[#ffe9e7]/30'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Description Textarea */}
            <div className="space-y-1.5">
              <label 
                htmlFor="problem-desc"
                className="text-xs font-extrabold text-brand-on-surface-variant uppercase tracking-wider block"
              >
                Problemi qısaca təsvir edin…
              </label>
              <textarea 
                id="problem-desc"
                className="w-full min-h-[100px] bg-brand-lowest border border-brand-outline-variant rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all placeholder:text-brand-on-surface-variant/40 leading-relaxed shadow-inner"
                placeholder="Məsələn: Fontanın su axını tənzimlənməlidir, asfalt çökmüşdür..."
                rows={3}
                value={newReportDescription}
                onChange={(e) => setNewReportDescription(e.target.value)}
              />
            </div>

            {/* Interactive Location card withpreset selector */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-xs font-extrabold text-brand-on-surface-variant uppercase tracking-wider block">Ünvan</span>
                <button 
                  onClick={() => {
                    setIsLocationCustom(!isLocationCustom);
                    setNewReportLocation(isLocationCustom ? 'Nərimanov r., Təbriz küç.' : 'İstiqlaliyyət küçəsi, 24');
                  }}
                  className="text-xs font-bold text-brand-primary hover:underline"
                >
                  {isLocationCustom ? 'Avtomatikə keç' : 'Yeri dəqiqləşdir'}
                </button>
              </div>

              {isLocationCustom ? (
                <div className="space-y-1">
                  <input
                    type="text"
                    value={newReportLocation}
                    onChange={(e) => setNewReportLocation(e.target.value)}
                    className="w-full h-12 bg-white border border-brand-outline-variant rounded-xl px-4 text-xs font-semibold focus:ring-2 focus:ring-brand-primary outline-none"
                    placeholder="Ünvanı daxil edin"
                  />
                  <p className="text-[10px] text-brand-on-surface-variant/70 italic px-1">Küçə, bina və yaxınlıqdakı obyekti qeyd edin.</p>
                </div>
              ) : (
                <div className="bg-brand-low p-4 rounded-xl border border-brand-outline-variant/30 flex items-start gap-4 shadow-sm">
                  <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary shrink-0">
                    <MapPin size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-brand-on-surface-variant uppercase tracking-wider">Cari məkan</p>
                    <p className="font-bold text-sm text-brand-on-surface leading-tight mt-1 truncate">{newReportLocation}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] text-brand-primary font-semibold mt-1">
                      <Check size={12} /> GPS vasitəsilə təyin olundu
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-brand-outline-variant/20 shrink-0">
                    <img 
                      className="w-full h-full object-cover" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdSXFeoSfcX42h1uFlwcy6PZiXNi_rBboDmcJZ8qcknWKsn4N-1PWI7OSCnHz5CK9BKVgMkw5C2zt5t3T3NyxuoIa8gC8nBpdakeLYnWaxDA5KmrwF0FsDjkQd1R91UOszT-A0RmUtmyzoUWjy5PTczz3cCFewjx2KM_w6MNBi3x8K7WJbr9piyYE7RqqfimxriqvxLrwBS9V1tnqWIQp3DDnA7KM8Pd3iiMxUJDBCx5infFMqMHpSZZmQLGhqO1c62FJrPt6xbmk" 
                      alt="Map thumbnail" 
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action send submit */}
            <div className="pt-4">
              <button 
                onClick={handleSubmitReportForm}
                className="w-full h-14 bg-brand-primary text-white rounded-full font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-brand-primary-container active:scale-95 transition-all text-sm tracking-wide cursor-pointer"
              >
                <span>Göndər</span>
                <Send size={16} />
              </button>
            </div>
          </main>
        </div>
      )}

      {/* RENDER AI SCANNING SIMULATOR PROCESS SCREEN */}
      {currentScreen === AppScreen.AI_ANALYSIS && (
        <div className="fixed inset-0 z-50 bg-[#fff8f7] flex flex-col justify-center items-center px-6 text-center">
          <div className="relative w-48 h-48 mb-6 flex items-center justify-center">
            {/* Pulsing visual circles */}
            <div className="absolute inset-0 bg-brand-primary/10 rounded-full animate-ping opacity-60" />
            <div className="absolute inset-4 bg-brand-primary/20 rounded-full animate-pulse" />
            <div className="relative z-10 w-24 h-24 bg-brand-primary rounded-full flex items-center justify-center text-white shadow-xl">
              <span className="material-symbols-outlined !text-[48px] animate-pulse">psychology</span>
            </div>
            
            {/* Visual scan light bar */}
            <div className="absolute w-56 h-1 bg-gradient-to-r from-transparent via-brand-primary to-transparent blur-sm z-20 scanning-line-el top-0" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-brand-primary/20 rounded-full" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border border-brand-primary/10 rounded-full" />
          </div>

          <h2 className="font-display text-xl font-extrabold text-[#281716] mb-2">Məlumatlar emal olunur</h2>
          <p className="text-xs text-brand-on-surface-variant max-w-[280px] mx-auto mb-10 leading-normal">
            Süni intellekt müraciətinizi yoxlayır, şəkli analiz edir və aidiyyatı qurumu təyin edir...
          </p>

          {/* Vertical progress stepper indicator */}
          <div className="w-full max-w-xs space-y-4 text-left">
            {/* Step 1 */}
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                analysisStep >= 1 
                  ? 'bg-[#e8f5e9] border-[#2e7d32] text-[#2e7d32]' 
                  : 'bg-brand-low border-brand-outline-variant text-brand-on-surface-variant/45'
              }`}>
                {analysisStep > 1 ? <Check size={16} /> : <span className="text-xs font-bold">1</span>}
              </div>
              <div className="flex-1">
                <p className={`text-xs font-bold ${analysisStep >= 1 ? 'text-brand-primary' : 'text-brand-on-surface-variant'}`}>
                  Şəkil təhlil edilir
                </p>
                {analysisStep === 1 && (
                  <div className="w-full h-1 bg-brand-highest rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-brand-primary rounded-full animate-pulse w-2/3" />
                  </div>
                )}
              </div>
            </div>

            {/* Step 2 */}
            <div className={`flex items-center gap-3 transition-opacity ${analysisStep >= 2 ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                analysisStep >= 2 
                  ? (analysisStep > 2 ? 'bg-[#e8f5e9] border-[#2e7d32] text-[#2e7d32]' : 'bg-[#ffe9e7] border-brand-primary text-brand-primary')
                  : 'bg-brand-low border-brand-outline-variant text-brand-on-surface-variant/45'
              }`}>
                {analysisStep > 2 ? <Check size={16} /> : <span className="text-xs font-bold">2</span>}
              </div>
              <div className="flex-1">
                <p className={`text-xs font-bold ${analysisStep >= 2 ? 'text-brand-primary' : 'text-brand-on-surface-variant'}`}>
                  Mövzu kateqoriyası təyin olunur
                </p>
                {analysisStep === 2 && (
                  <div className="w-full h-1 bg-brand-highest rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-brand-secondary rounded-full animate-pulse w-1/2" />
                  </div>
                )}
              </div>
            </div>

            {/* Step 3 */}
            <div className={`flex items-center gap-3 transition-opacity ${analysisStep >= 3 ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                analysisStep >= 3 
                  ? 'bg-[#ffe9e7] border-brand-primary text-brand-primary shadow-sm' 
                  : 'bg-brand-low border-brand-outline-variant text-brand-on-surface-variant/45'
              }`}>
                <span className="text-xs font-bold">3</span>
              </div>
              <div className="flex-1">
                <p className={`text-xs font-bold ${analysisStep >= 3 ? 'text-brand-primary' : 'text-brand-on-surface-variant'}`}>
                  Aidiyyəti icraçı orqan tapılır
                </p>
                {analysisStep === 3 && (
                  <div className="w-full h-1 bg-brand-highest rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-[#005a99] rounded-full animate-pulse w-3/4" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENDER REPORT CREATION SUCCESS SCREEN */}
      {currentScreen === AppScreen.REPORT_CREATED_SUCCESS && (
        <div className="flex-grow flex flex-col bg-[#fff8f7] success-bg-gradient">
          <main className="flex-grow flex flex-col items-center justify-center px-6 pt-12 max-w-md mx-auto w-full">
            {/* Visual Success Mark */}
            <div className="w-20 h-20 bg-[#e8f5e9] rounded-full flex items-center justify-center mb-6 shadow-sm checkmark-scale">
              <CheckCircle2 className="text-[#2e7d32]" size={48} />
            </div>

            <h1 className="font-display text-2xl font-extrabold text-[#281716] text-center mb-2 leading-none">
              Müraciətiniz qəbul edildi!
            </h1>
            <p className="text-sm text-brand-on-surface-variant text-center max-w-xs leading-relaxed mb-6">
              Bakı şəhərinin abadlaşdırılmasına verdiyiniz töhfə üçün təşəkkür edirik.
            </p>

            {/* Structured Report card summary */}
            <div className="w-full bg-white rounded-3xl p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-[#e5bdba]/20 mb-4">
              <h2 className="text-sm font-bold text-brand-primary flex items-center gap-2 mb-4">
                <ClipboardList size={16} /> Müraciət xülasəsi
              </h2>
              
              <div className="space-y-4 text-xs font-semibold">
                <div className="flex justify-between items-center pb-2 border-b border-[#fadbd9]/30">
                  <span className="text-brand-on-surface-variant">Kateqoriya</span>
                  <span className="text-brand-on-surface text-sm font-bold">{newReportType}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-[#fadbd9]/30">
                  <span className="text-brand-on-surface-variant">Ciddilik statusu</span>
                  <span className="bg-[#ffe2df] text-brand-primary px-3 py-1 rounded-full font-bold">Orta</span>
                </div>
                <div className="flex justify-between items-start pb-2">
                  <span className="text-brand-on-surface-variant mr-4">Aidiyyatı qurum</span>
                  <span className="text-brand-on-surface text-right font-bold flex-1">
                    {newReportType.includes('Yol') ? 'Bakı Şəhər İcra Hakimiyyəti' : 'Abadlıq şöbəsi'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-brand-outline-variant/30">
                  <span className="text-brand-on-surface-variant">Proqnoz həll tarixi</span>
                  <div className="flex items-center gap-1 text-brand-primary font-bold">
                    <Calendar size={14} />
                    <span>5 gün ərzində</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Civic merging alert block */}
            <div className="w-full bg-[#ffe9e7]/50 p-4 rounded-xl border border-brand-primary/10 flex items-center gap-3 mb-6">
              <div className="bg-brand-primary/10 p-2 rounded-lg text-brand-primary shrink-0">
                <Award size={20} />
              </div>
              <p className="text-xs text-brand-on-surface-variant/90 leading-relaxed font-medium">
                Bu müraciət sistemdə mövcud mövzuya əlavə edildi <span className="text-brand-primary font-extrabold">(+1)</span>. Oxşar müraciətlər həlli sürətləndirir.
              </p>
            </div>

            {/* Civic view placeholder image */}
            <div className="w-full rounded-2xl overflow-hidden aspect-video shadow-inner bg-[#fadbd9] relative mb-6">
              <img 
                className="w-full h-full object-cover opacity-90 filter brightness-105" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCh-DRufxO4GjAS6J9LMlFSj0kEJ7-PvF8zRzU2IEO4rA3AUdh2hOMST99QIkivwB0v1-ZLTg2Q4UTAH0JmfIes6NGTuev-aUFOw5IdwKDWlTuwg7nH0xiWtW_kwLYc1jmFLj3pFu9NjskBC1fqz495jl1f0HmwJIMe-SyZ9jScklvoImWEv8FhLa4HMSzmPME1L0LnLHgPmXKIKCE3rJZBKq-_TQqKNVcp5u6vmQaFe0S7nWk9qbRXTXhFe8dh1gvXdPRTCkeQsZk" 
                alt="Baku clean sunset view" 
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 text-white text-[11px] font-bold">
                Müasir Bakı, abad şəhərimiz
              </div>
            </div>
          </main>

          {/* Persistent Action Footer */}
          <footer className="p-6 bg-[#fff8f7] border-t border-[#e5bdba]/15 space-y-3 shrink-0 max-w-md mx-auto w-full">
            <button 
              onClick={() => {
                if (justCreatedReportId) {
                  setSelectedReportId(justCreatedReportId);
                  navigateTo(AppScreen.REPORT_DETAIL);
                } else {
                  navigateTo(AppScreen.FEED);
                }
              }}
              className="w-full h-14 bg-brand-primary text-white rounded-full font-bold flex items-center justify-center gap-2 active:scale-95 transition-all text-sm tracking-wide cursor-pointer hover:bg-brand-primary-container shadow-md"
            >
              Müraciətə bax <ArrowLeft size={16} className="rotate-180" />
            </button>
            <button 
              onClick={() => navigateTo(AppScreen.FEED)}
              className="w-full h-14 border-2 border-brand-outline-variant text-[#5c403e] bg-white rounded-full font-bold flex items-center justify-center active:scale-95 transition-all text-sm cursor-pointer hover:bg-brand-low/40"
            >
              Bağla
            </button>
          </footer>
        </div>
      )}

      {/* RENDER CLAIMED REWARD QR COUPON DETAIL */}
      {currentScreen === AppScreen.REWARD_CLAIMED && claimedReward && (
        <div className="flex-grow flex flex-col bg-brand-surface justify-center items-center p-6">
          <div className="w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl border border-brand-outline-variant/30 relative overflow-hidden flex flex-col items-center">
            
            {/* Stamp Ticket cutout marks */}
            <div className="absolute top-1/2 -left-3 w-6 h-6 bg-brand-surface rounded-full -translate-y-1/2" />
            <div className="absolute top-1/2 -right-3 w-6 h-6 bg-brand-surface rounded-full -translate-y-1/2" />

            {/* Complete Checked Circle */}
            <div className="w-16 h-16 bg-[#ffe9e7] rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="text-[#bd0e21]" size={36} />
            </div>

            <h1 className="font-display text-xl font-extrabold text-[#281716] mb-1">Uğurla alındı!</h1>
            <p className="text-xs text-brand-on-surface-variant font-medium text-center mb-6">
              Mükafat kuponunuz aktivdir. Məbləğ balansınızdan çıxıldı.
            </p>

            {/* Reward Summary Card */}
            <div className="w-full bg-[#fff0ef] rounded-[20px] p-4 mb-6 border border-[#e5bdba]/25 text-xs font-semibold">
              <div className="flex justify-between items-center mb-1.5 uppercase tracking-wider text-[10px] text-brand-on-surface-variant">
                <span>Məhsul növü</span>
                <span className="text-[#bd0e21] font-bold">{claimedReward.reward.cost} Coin</span>
              </div>
              <p className="text-sm font-bold text-brand-on-surface leading-tight">{claimedReward.reward.title}</p>
            </div>

            {/* Custom Brand QR CODE */}
            <div className="w-48 h-48 p-4 bg-white rounded-3xl border border-brand-outline-variant/30 flex items-center justify-center relative shadow-sm overflow-hidden mb-6 group">
              <div className="absolute left-0 w-full bg-brand-primary h-[2px] opacity-40 top-0 scanning-line-el shadow-[0_0_10px_#bd0e21]" />
              <img 
                className="w-full h-full object-contain filter contrast-125" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD88b05xGqeGQQXwLM5Hgs6vbcmSiqWrig_koVXB9B5_Hj1tpf1BASUbBat3plfi-ehatZMzLCTGYnF5G1-dYg_wKDgRlqXj-2Y3TE4UxKkysAJZIJq9i0JsbnR-zF54Pd0gB17_5l3sVaZtV9De6eQm31F5MDurL5DyKLPgL_KTMuec8c0cuRVBJ11rg3a3RasXNJCrUlt9F74UUSg-9D5MlRurmSF5Z-phJGBWhKL2Svd4MvVia9KgGuZcsteGO8jfqZVsjZSYFU" 
                alt="Voucher QR Code" 
              />
            </div>

            {/* Copyable Action code block */}
            <div className="flex flex-col items-center gap-1.5 mb-6 w-full text-center">
              <div className="inline-flex gap-3 items-center px-5 py-3 bg-[#f2d3d0]/30 rounded-xl border border-brand-primary/10 tracking-widest text-[#870012] font-extrabold font-display text-lg">
                <span>{claimedReward.code}</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(claimedReward.code);
                    showToast('Xüsusi kupon kodu kopyalandı!', 'success');
                  }}
                  className="p-1 cursor-pointer bg-white rounded-lg hover:bg-brand-primary/15 transition-all text-[#870012] active:scale-90"
                >
                  <Copy size={16} />
                </button>
              </div>
              <p className="text-[10px] font-bold text-brand-on-surface-variant uppercase tracking-wider block mt-1">
                KODU KASSADA TƏQDİM EDİN
              </p>
            </div>

            <button 
              onClick={() => {
                setClaimedReward(null);
                navigateTo(AppScreen.REWARDS);
              }}
              className="w-full h-12 bg-brand-primary text-white font-bold rounded-full shadow-md active:scale-95 transition-transform text-sm cursor-pointer hover:bg-brand-primary-container"
            >
              Bağla
            </button>
          </div>
        </div>
      )}

      {/* RENDER REPORT DETAIL / DETAILED STEPS TRACKING VIEW */}
      {currentScreen === AppScreen.REPORT_DETAIL && selectedReportId && (
        <div className="flex-grow flex flex-col bg-brand-surface">
          {/* Header */}
          <header className="bg-white/90 backdrop-blur-md border-b border-[#e5bdba]/30 shadow-sm fixed top-0 left-0 w-full h-16 z-40 flex items-center justify-between px-6">
            <div className="flex items-center">
              <button 
                onClick={() => navigateTo(previousScreen || AppScreen.FEED)}
                className="p-2 -ml-2 text-brand-primary hover:bg-[#ffe9e7] rounded-full transition-all active:scale-95 shrink-0"
              >
                <ArrowLeft size={24} />
              </button>
              <h1 className="ml-2 font-display text-lg font-extrabold text-[#281716] tracking-tight">Müraciət</h1>
            </div>

            {/* Small active badge */}
            <div className="bg-[#ffe9e7] text-brand-primary px-3 py-1 rounded-full text-[11px] font-bold tracking-wider truncate max-w-[120px]">
              {reports.find(r => r.id === selectedReportId)?.category}
            </div>
          </header>

          {reports.filter(r => r.id === selectedReportId).map((report) => (
            <main key={report.id} className="pt-20 pb-32 px-6 max-w-xl mx-auto w-full space-y-6">
              
              {/* Report Hero Frame */}
              <article className="bg-[#ffffff] rounded-2xl shadow-md border border-[#e5bdba]/15 overflow-hidden">
                <div className="p-4 border-b border-[#e5bdba]/20 flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <div className="flex gap-2 items-center mb-1">
                      <span className="bg-brand-highest text-brand-primary px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase">
                        {report.status}
                      </span>
                      <span className="text-[11px] font-bold text-brand-on-surface-variant/80 font-display">
                        ID: {report.id}
                      </span>
                    </div>
                    <h2 className="font-bold text-base text-brand-on-surface leading-tight">
                      {report.title}
                    </h2>
                  </div>
                  <span className="text-xs text-brand-on-surface-variant/70 shrink-0 font-medium whitespace-nowrap pt-1">
                    {report.time}
                  </span>
                </div>

                {/* Main Captured Photo */}
                <div className="aspect-video w-full bg-[#fadbd9] relative overflow-hidden group">
                  <img 
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300 select-none" 
                    src={report.imageUrl} 
                    alt={report.title} 
                  />
                  <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md text-white rounded-lg px-2.5 py-1 text-xs font-semibold flex items-center gap-1.5">
                    <MapPin size={12} />
                    <span className="truncate max-w-[200px]">{report.location}</span>
                  </div>
                </div>

                {/* Author profile card */}
                <div className="p-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-[#fadbd9]/30 mb-3">
                    <div className="w-10 h-10 rounded-full border border-brand-primary/20 overflow-hidden shrink-0">
                      <img className="w-full h-full object-cover" src={report.reporterAvatar} alt="Reporter Headshot" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#281716] truncate">{report.reporterName}</p>
                      <span className="text-[10px] font-medium text-brand-on-surface-variant/70 block leading-tight">Müraciət sahibi</span>
                    </div>
                    <span className="text-[10px] text-brand-on-surface-variant px-2.5 py-1 bg-[#fff0ef] rounded-lg border border-[#e5bdba]/40 shrink-0 font-display">
                      {report.id.startsWith('#RG-') ? 'Siz' : 'Sakin'}
                    </span>
                  </div>

                  <p className="text-xs leading-normal font-medium text-[#281716] whitespace-pre-line bg-brand-low/40 p-3 rounded-xl border border-dashed border-[#e5bdba]/40">
                    {report.descr}
                  </p>
                </div>
              </article>

              {/* Status Stepper visualization */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#e5bdba]/20">
                <h3 className="text-sm font-bold text-brand-on-surface mb-6 flex items-center gap-1.5">
                  <Flame size={16} className="text-brand-primary" /> Müraciət statusu
                </h3>

                <div className="relative pl-1">
                  {/* Vertical Stepper connectors bar */}
                  <div className="absolute left-[15px] top-2 bottom-2 w-[2px] bg-brand-outline-variant/30 z-0" />
                  
                  <div className="space-y-6 relative z-10">
                    {report.steps.map((step, sIdx) => (
                      <div key={sIdx} className={`flex items-start gap-3.5 ${
                        step.status === 'pending' ? 'opacity-40' : 'opacity-100'
                      }`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                          step.status === 'completed' 
                            ? 'bg-[#e8f5e9] border-[#2e7d32] text-[#2e7d32]' 
                            : step.status === 'current'
                              ? 'bg-[#ffe9e7] border-brand-primary text-brand-primary font-display relative pulse-animation-btn'
                              : 'bg-brand-low border-brand-outline-variant text-[#5c403e]/40'
                        }`}>
                          {step.status === 'completed' ? (
                            <Check size={16} />
                          ) : (
                            <span className="text-xs font-bold">{sIdx + 1}</span>
                          )}
                          {step.status === 'current' && (
                            <span className="absolute inset-0 rounded-full bg-brand-primary/20 animate-ping" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className={`text-xs font-bold leading-tight ${
                              step.status === 'current' ? 'text-brand-primary' : 'text-brand-on-surface'
                            }`}>
                              {step.name}
                            </h4>
                            {step.time && (
                              <span className="text-[10px] text-brand-on-surface-variant font-medium whitespace-nowrap">
                                {step.time}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-brand-on-surface-variant mt-0.5 leading-tight truncate">
                            {step.subtitle}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Duplicate/Validation upvote button: "Mən də görürəm" */}
              <div className="bg-white rounded-2xl p-4 border border-[#e5bdba]/20 shadow-sm flex flex-col justify-center items-center text-center">
                <p className="text-[11px] text-brand-on-surface-variant mb-3 font-semibold">
                  Bu problem sizin üçün də narahatlıq yaradır? "Dəstəklə" düyməsini sıxın.
                </p>
                
                <button 
                  onClick={() => handleSupportReport(report.id)}
                  className={`w-full py-4 rounded-full border-2 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    report.hasUserReacted 
                      ? 'bg-brand-primary border-brand-primary text-white pointer-events-none'
                      : 'border-brand-primary text-brand-primary hover:bg-brand-primary/5 active:scale-95'
                  }`}
                >
                  <ThumbsUp size={16} />
                  <span>{report.hasUserReacted ? 'Təsdiq edildi (Siz də görürsünüz)' : 'Mən də görürəm'}</span>
                  <span className="bg-brand-highest text-brand-primary rounded-full px-2.5 py-0.5 ml-1 text-[10px] font-extrabold">
                    {report.reactionsCount}
                  </span>
                </button>
              </div>

              {/* Comments / Community notifications section */}
              <section className="space-y-3">
                <h3 className="text-xs font-extrabold text-brand-on-surface-variant uppercase tracking-wider block px-1">
                  Sakinlərin bildirişləri ({report.comments.length})
                </h3>

                <div className="space-y-4">
                  {report.comments.map((comment) => (
                    <div key={comment.id} className="thread-vertical-line relative flex gap-3.5 items-start">
                      <div className="z-10 w-11 h-11 rounded-full overflow-hidden border-2 border-brand-container ring-4 ring-brand-surface shrink-0">
                        <img className="w-full h-full object-cover" src={comment.avatar} alt="Avatar log" />
                      </div>
                      <div className="bg-white p-3.5 rounded-2xl shadow-sm flex-1 border border-[#e5bdba]/15 min-w-0">
                        <div className="flex justify-between items-center gap-2 mb-1">
                          <span className="font-bold text-xs text-[#281716] truncate">{comment.author}</span>
                          <span className="text-[10px] text-brand-on-surface-variant shrink-0 font-medium">{comment.time}</span>
                        </div>
                        <p className="text-[11px] leading-relaxed font-semibold text-brand-on-surface-variant/90">
                          {comment.text}
                        </p>
                        
                        {comment.imageUrl && (
                          <div className="mt-3 rounded-lg overflow-hidden aspect-video border border-[#e5bdba]/20 max-h-32">
                            <img className="w-full h-full object-cover" src={comment.imageUrl} alt="Damage log preview" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Empty state comments message */}
                  {report.comments.length === 0 && (
                    <div className="bg-white/50 p-6 rounded-2xl border border-dashed border-[#e5bdba]/30 text-center">
                      <MessageSquare className="text-brand-on-surface-variant/40 mx-auto mb-2" size={24} />
                      <p className="text-xs text-brand-on-surface-variant font-medium italic">Heç bir sakin rəyi hələ yoxdur. İlk şərhi siz yazın!</p>
                    </div>
                  )}
                </div>

                {/* Input form to add a new comment */}
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-[#e5bdba]/15 flex items-center gap-2">
                  <input
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Əlavə məlumat və ya sübut yazın..."
                    className="flex-1 min-w-0 bg-transparent outline-none text-xs font-semibold px-2 placeholder:text-brand-on-surface-variant/50"
                  />
                  <button
                    onClick={() => handleAddComment(report.id)}
                    className="p-3 bg-brand-primary text-white rounded-xl active:scale-95 transition-all text-xs cursor-pointer hover:bg-brand-primary-container shrink-0"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </section>

            </main>
          ))}

          {/* Sticky Bottom Action Action block */}
          <div className="fixed bottom-0 left-0 w-full p-4 bg-white/90 backdrop-blur-xl border-t border-[#e5bdba]/20 z-40 flex justify-center">
            <button 
              onClick={() => navigateTo(AppScreen.FEED)}
              className="w-full max-w-md h-12 border-2 border-brand-primary text-brand-primary font-bold bg-white rounded-full text-xs active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer hover:bg-brand-low/50"
            >
              <Compass size={16} /> Lentə geri dön
            </button>
          </div>
        </div>
      )}

      {/* RENDER SHELL (FEED, MY_REPORTS, REWARDS, PROFILE) SHARED VISUAL SCENE */}
      {[AppScreen.FEED, AppScreen.MY_REPORTS, AppScreen.REWARDS, AppScreen.PROFILE].includes(currentScreen) && (
        <div className="flex-grow flex flex-col pt-16 pb-28">
          
          {/* Top persistent navigation bar */}
          <header className="bg-white/90 backdrop-blur-md border-b border-[#e5bdba]/30 shadow-sm fixed top-0 left-0 w-full h-16 z-40 flex items-center justify-between px-6">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[#fff0ef] rounded-xl text-brand-primary shrink-0 animate-pulse">
                <MapPin size={20} />
              </span>
              <span className="font-display font-extrabold text-xl text-brand-primary tracking-tight">Openwave</span>
            </div>

            {/* User headshot avatar trigger to navigate to Profile Screen */}
            <div 
              onClick={() => navigateTo(AppScreen.PROFILE)}
              className="w-10 h-10 rounded-full border-2 border-[#ffdad7] shadow-sm overflow-hidden shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-all"
            >
              <img className="w-full h-full object-cover" src={user.avatar} alt="User tiny headshot" />
            </div>
          </header>

          {/* VIEW: FEED (LENT/EXPLORE TAB) */}
          {currentScreen === AppScreen.FEED && (
            <main className="px-6 space-y-6 max-w-xl mx-auto w-full pt-4">
              
              {/* Baku Welcome Section with Coin alert banner */}
              <div>
                <h1 className="font-display text-xl font-extrabold text-[#281716]">Salam, {user.name.split(' ')[0]} 🇦🇿</h1>
                <p className="text-xs font-semibold text-brand-on-surface-variant mt-0.5">Xoş gördük! Şəhərimizi abadlaşdırmağa davam edin.</p>
              </div>

              {/* Dynamic Civic Achievements Carousel */}
              <div className="bg-[#bd0e21] rounded-3xl p-5 text-white shadow-lg overflow-hidden relative">
                <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />
                <div className="absolute right-4 top-4 bg-white/20 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide">
                  Güncəlləmə
                </div>
                
                <h3 className="font-display text-base font-extrabold mb-1">Mövcud Balansınız</h3>
                <div className="flex items-baseline gap-1.5 google-fonts font-medium">
                  <span className="text-2xl font-extrabold font-display leading-none">{user.coins}</span>
                  <span className="text-[11px] font-bold text-[#ffbeb9] tracking-wider uppercase">civic coin</span>
                </div>
                
                <p className="text-[11px] text-white/85 mt-3 max-w-xs font-medium leading-relaxed">
                  Zədələnmiş yolları, zibillikləri və ya işləməyən lampaları lentdə dəstəkləyib xalınızı və mükafatlarınızı artırın!
                </p>
              </div>

              {/* Azerbaijani reports categories filter chips */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-extrabold text-brand-on-surface-variant block uppercase tracking-wider px-1">
                  <span>Müraciətlər</span>
                  <span className="text-[11px] text-[#bd0e21] font-bold hover:underline cursor-pointer" onClick={() => navigateTo(AppScreen.MY_REPORTS)}>
                    Hamısı ({reports.length})
                  </span>
                </div>

                <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                  <button 
                    onClick={() => setActiveChip('HAMISI')}
                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap active:scale-95 transition-all cursor-pointer ${
                      activeChip === 'HAMISI' 
                        ? 'bg-brand-primary text-white shadow-sm' 
                        : 'bg-white text-brand-on-surface-variant border border-[#e5bdba]/50 hover:bg-[#fff0ef]/40'
                    }`}
                  >
                    Hamısı
                  </button>
                  <button 
                    onClick={() => setActiveChip('AKTIV')}
                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap active:scale-95 transition-all cursor-pointer ${
                      activeChip === 'AKTIV' 
                        ? 'bg-brand-primary text-white shadow-sm' 
                        : 'bg-white text-brand-on-surface-variant border border-[#e5bdba]/50 hover:bg-[#fff0ef]/40'
                    }`}
                  >
                    Aktiv
                  </button>
                  <button 
                    onClick={() => setActiveChip('HELLEDILIB')}
                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap active:scale-95 transition-all cursor-pointer ${
                      activeChip === 'HELLEDILIB' 
                        ? 'bg-brand-primary text-white shadow-sm' 
                        : 'bg-white text-brand-on-surface-variant border border-[#e5bdba]/50 hover:bg-[#fff0ef]/40'
                    }`}
                  >
                    Həll edilib
                  </button>
                </div>
              </div>

              {/* Dynamic scrollable cards list grid */}
              <div className="space-y-4">
                {filteredReports.map((report) => (
                  <div 
                    key={report.id}
                    onClick={() => {
                      setSelectedReportId(report.id);
                      navigateTo(AppScreen.REPORT_DETAIL);
                    }}
                    className="bg-white p-4 rounded-3xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-[#e5bdba]/15 flex gap-4 transition-all active:scale-[0.98] cursor-pointer hover:shadow-md"
                  >
                    <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-[#fadbd9] border border-[#e5bdba]/10 relative">
                      <img className="w-full h-full object-cover select-none" src={report.imageUrl} alt="Pothole log view" />
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide leading-none ${
                            report.status === 'HƏLL EDİLDİ' 
                              ? 'bg-[#e8f5e9] text-[#2e7d32]' 
                              : report.status === 'İCRADADIR' 
                                ? 'bg-[#fff0ef] text-brand-primary'
                                : 'bg-brand-highest text-brand-on-surface-variant'
                          }`}>
                            {report.status}
                          </span>
                          <span className="text-[10px] text-brand-on-surface-variant/70 shrink-0 font-medium whitespace-nowrap">
                            {report.time}
                          </span>
                        </div>
                        <h3 className="font-bold text-[#281716] text-sm mt-1 leading-tight truncate">
                          {report.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-brand-on-surface-variant mt-1.5">
                        <MapPin size={12} className="text-brand-primary/80" />
                        <span className="truncate">{report.location}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredReports.length === 0 && (
                  <div className="bg-white/50 p-10 rounded-3xl border border-dashed border-[#e5bdba]/30 text-center">
                    <AlertOctagon className="text-brand-on-surface-variant/40 mx-auto mb-2" size={32} />
                    <p className="text-sm text-brand-on-surface-variant font-bold">Heç bir müraciət tapılmadı</p>
                    <p className="text-xs text-brand-on-surface-variant/60 mt-1 max-w-xs mx-auto">Filtrləri təmizləyin və ya Bakıda yeni müraciət etmək üçün mərkəzi Bildir düyməsini sıxın!</p>
                  </div>
                )}
              </div>

              {/* Informative advice banner of Openwave trust score system */}
              <div className="bg-brand-low p-4 rounded-2xl border border-dashed border-[#e5bdba] flex gap-3 text-xs">
                <div className="p-2 bg-brand-primary/10 rounded-xl text-brand-primary self-center shrink-0">
                  <Award size={20} />
                </div>
                <div className="font-medium text-[#5c403e]/90 leading-relaxed">
                  Şəhərimiz Openwave ilə daha gözəldir. Hər həll olunmuş müraciətlər sakinlərə mükafat və rəqəmsal xallar qazandırır.
                </div>
              </div>

            </main>
          )}

          {/* VIEW: MY_REPORTS (MÜRACİƏTLƏRİM TAB) */}
          {currentScreen === AppScreen.MY_REPORTS && (
            <main className="px-6 space-y-6 max-w-xl mx-auto w-full pt-4">
              <div>
                <h1 className="font-display text-xl font-extrabold text-[#281716]">Müraciətlərim</h1>
                <p className="text-xs font-semibold text-brand-on-surface-variant mt-0.5">Sizin tərəfinizdən göndərilmiş və ya dəstəklənmiş bütün müraciətlər</p>
              </div>

              {/* Filtering summary count boxes */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#ffffff] p-3 rounded-2xl border border-[#e5bdba]/15 text-center shadow-sm">
                  <p className="text-base font-extrabold text-[#281716] leading-none mb-1">
                    {reports.length}
                  </p>
                  <span className="text-[10px] text-brand-on-surface-variant font-bold uppercase tracking-wider">Cəm</span>
                </div>
                <div className="bg-[#ffe9e7]/50 p-3 rounded-2xl border border-brand-primary/5 text-center shadow-sm">
                  <p className="text-base font-extrabold text-brand-primary leading-none mb-1">
                    {reports.filter(r => r.status === 'İCRADADIR' || r.status === 'GÖZLƏYİR').length}
                  </p>
                  <span className="text-[10px] text-brand-primary font-bold uppercase tracking-wider">Aktiv</span>
                </div>
                <div className="bg-[#e8f5e9] p-3 rounded-2xl border border-black/5 text-center shadow-sm">
                  <p className="text-base font-extrabold text-[#2e7d32] leading-none mb-1">
                    {reports.filter(r => r.status === 'HƏLL EDİLDİ').length}
                  </p>
                  <span className="text-[10px] text-[#2e7d32] font-bold uppercase tracking-wider">Həll edilib</span>
                </div>
              </div>

              {/* List of my reports containing detailed visual cards */}
              <div className="space-y-4">
                {reports.map((report) => (
                  <div 
                    key={report.id}
                    onClick={() => {
                      setSelectedReportId(report.id);
                      navigateTo(AppScreen.REPORT_DETAIL);
                    }}
                    className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#e5bdba]/15 transition-all active:scale-[0.98] cursor-pointer hover:shadow-md"
                  >
                    <div className="aspect-video w-full bg-[#fadbd9] relative overflow-hidden">
                      <img className="w-full h-full object-cover" src={report.imageUrl} alt="Pothole view" />
                      
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[10px] font-bold leading-none uppercase">
                        {report.status}
                      </div>

                      <div className="absolute bottom-3 right-3 bg-white text-brand-primary rounded-lg px-2.5 py-1 text-[11px] font-bold flex items-center gap-1">
                        <ThumbsUp size={11} />
                        <span>{report.reactionsCount} sakin</span>
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <div className="flex justify-between items-center text-[10px] text-[#5c403e] font-display font-semibold">
                        <span>{report.category}</span>
                        <span>{report.date}</span>
                      </div>
                      <h3 className="font-bold text-sm text-[#281716] leading-snug line-clamp-1">{report.title}</h3>
                      
                      <div className="flex items-center gap-2 text-xs text-brand-on-surface-variant font-medium pt-1 border-t border-[#fadbd9]/30">
                        <MapPin size={12} className="text-brand-primary shrink-0" />
                        <span className="truncate">{report.location}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </main>
          )}

          {/* VIEW: REWARDS (MÜKAFATLAR TAB) */}
          {currentScreen === AppScreen.REWARDS && (
            <main className="px-6 space-y-6 max-w-xl mx-auto w-full pt-4">
              <div>
                <h1 className="font-display text-xl font-extrabold text-[#281716]">Mükafatlar</h1>
                <p className="text-xs font-semibold text-brand-on-surface-variant mt-0.5">Bakı abadlığı üçün qazandığınız Coinləri endirimlərə dəyişin</p>
              </div>

              {/* Shimmering Rewards Banner */}
              <section className="coin-shimmer-bg rounded-3xl p-8 text-center flex flex-col items-center justify-center shadow-lg transition-transform hover:scale-[1.01]">
                <div className="bg-white/10 p-3 rounded-full mb-3 backdrop-blur-sm text-[#ffbeb9]">
                  <Award size={36} />
                </div>
                <h2 className="font-display text-3xl font-extrabold text-white leading-none mb-1.5">{user.coins} Coin</h2>
                <p className="text-[11px] text-white/80 font-bold uppercase tracking-widest leading-none">MÖVCUD COIN BALANSINIZ</p>
              </section>

              {/* Coin Earning System Guideline Info box */}
              <section className="space-y-3">
                <h3 className="font-display text-sm font-extrabold text-brand-on-surface-variant px-1">Necə qazanılır?</h3>
                <div className="bg-brand-low rounded-2xl border border-brand-outline-variant/30 overflow-hidden text-xs font-semibold p-2">
                  <div className="flex items-center justify-between p-3 border-b border-[#e5bdba]/20">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs">A</span>
                      <span className="text-brand-on-surface">Yeni dürüst müraciət</span>
                    </div>
                    <span className="text-[#870012] font-bold font-display">+10 Coin</span>
                  </div>

                  <div className="flex items-center justify-between p-3 border-b border-[#e5bdba]/20">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">B</span>
                      <span className="text-brand-on-surface">Digər müraciət təsdiqlənməsi</span>
                    </div>
                    <span className="text-[#870012] font-bold font-display">+5 Coin</span>
                  </div>

                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs">C</span>
                      <span className="text-brand-on-surface">Problem rəsmən həll olunduqda</span>
                    </div>
                    <span className="text-[#870012] font-bold font-display">+20 Coin</span>
                  </div>
                </div>
              </section>

              {/* Special offers item cards grid */}
              <section className="space-y-3">
                <h3 className="font-display text-sm font-extrabold text-brand-on-surface-variant px-1">Xüsusi Təkliflər</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {rewards.map((reward) => (
                    <div 
                      key={reward.id} 
                      className="bg-white rounded-2xl overflow-hidden border border-[#e5bdba]/15 shadow-sm p-3.5 flex flex-col justify-between group hover:shadow-md transition-all"
                    >
                      <div>
                        {/* Image overlay with premium badge */}
                        <div className="aspect-square rounded-xl overflow-hidden bg-brand-low relative mb-3">
                          <img 
                            className="w-full h-full object-cover group-hover:scale-105 transition-all" 
                            src={reward.imageUrl} 
                            alt={reward.title} 
                          />
                          <span className="absolute top-2 right-2 bg-[#bd0e21] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full backdrop-blur-sm leading-none">
                            {reward.badge}
                          </span>
                        </div>
                        <h4 className="font-bold text-[#281716] text-xs leading-snug line-clamp-2 mb-2">{reward.title}</h4>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-[#fadbd9]/30 mt-auto">
                        <div className="flex items-center gap-1 font-extrabold text-[#bd0e21]">
                          <span className="text-xs">{reward.cost}</span>
                          <span className="text-[9px] font-bold uppercase tracking-wider block">Coin</span>
                        </div>

                        <button 
                          onClick={() => handleClaimReward(reward)}
                          className="px-3.5 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-full hover:bg-brand-primary-container active:scale-95 transition-all cursor-pointer shadow-sm"
                        >
                          Al
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </main>
          )}

          {/* VIEW: PROFILE (PROFIL TAB) */}
          {currentScreen === AppScreen.PROFILE && (
            <main className="px-6 space-y-6 max-w-xl mx-auto w-full pt-4">
              
              {/* Profile Header section with Dynamic Gauge circle trust score */}
              <section className="flex flex-col items-center justify-center text-center">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  
                  {/* Gauge SVG */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle 
                      className="text-brand-highest" 
                      cx="64" 
                      cy="64" 
                      fill="transparent" 
                      r="54" 
                      stroke="currentColor" 
                      strokeWidth="8" 
                    />
                    <circle 
                      className="text-brand-primary" 
                      cx="64" 
                      cy="64" 
                      fill="transparent" 
                      r="54" 
                      stroke="currentColor" 
                      strokeWidth="8" 
                      strokeDasharray="339.3" 
                      strokeDashoffset={339.3 - (339.3 * user.trustScore) / 100}
                      strokeLinecap="round"
                    />
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display text-2xl font-extrabold text-brand-primary leading-none">{user.trustScore}</span>
                    <span className="text-[10px] font-bold text-brand-on-surface-variant font-sans mt-0.5">Etibar xalı</span>
                  </div>
                </div>

                <div className="mt-4">
                  <h1 className="font-display text-lg font-extrabold text-[#281716] leading-none mb-1.5">{user.name}</h1>
                  <span className="inline-flex items-center gap-1 text-[11px] text-brand-primary font-bold">
                    <CheckCircle2 size={13} className="text-brand-primary shrink-0" />
                    Fəal Vətəndaş
                  </span>
                </div>
              </section>

              {/* Stats bento layout grid */}
              <section className="grid grid-cols-3 gap-3">
                <div className="bg-brand-low/55 p-3.5 rounded-2xl text-center shadow-sm border border-[#e5bdba]/15">
                  <span className="font-display text-xl font-extrabold text-brand-primary leading-none block mb-1">
                    {user.reportsCount}
                  </span>
                  <p className="text-[10px] font-bold font-sans text-brand-on-surface-variant leading-tight">Müraciət</p>
                </div>

                <div className="bg-brand-primary p-3.5 rounded-2xl text-center shadow-[0_4px_12px_rgba(135,0,18,0.15)] text-white">
                  <span className="font-display text-xl font-extrabold leading-none block mb-1">
                    {user.solvedCount}
                  </span>
                  <p className="text-[10px] font-bold font-sans text-white/80 leading-tight block">Həll edilib</p>
                </div>

                <div className="bg-brand-low/55 p-3.5 rounded-2xl text-center shadow-sm border border-[#e5bdba]/15">
                  <span className="font-display text-xl font-extrabold text-brand-on-surface leading-none block mb-1 truncate">
                    {user.coins}
                  </span>
                  <p className="text-[10px] font-bold font-sans text-brand-on-surface-variant leading-tight">Civic Coin</p>
                </div>
              </section>

              {/* Badges and achievements list */}
              <section className="space-y-3">
                <div className="flex justify-between items-center text-xs font-extrabold text-brand-on-surface-variant uppercase tracking-wider block px-1">
                  <span>Mükafatlar</span>
                  <button className="text-brand-primary text-[10px] font-bold" onClick={() => navigateTo(AppScreen.REWARDS)}>
                    Hamısı
                  </button>
                </div>

                {/* Achievements row */}
                <div className="flex gap-4 overflow-x-auto pb-1 no-scrollbar">
                  <div className="flex flex-col items-center gap-1.5 shrink-0">
                    <div className="w-14 h-14 rounded-full bg-brand-highest flex items-center justify-center border-2 border-[#bd0e21]/15 text-[#bd0e21]">
                      <span className="material-symbols-outlined !text-2xl">workspace_premium</span>
                    </div>
                    <p className="text-[10px] font-bold text-center w-16 leading-tight">Qızıl İştirakçı</p>
                  </div>

                  <div className="flex flex-col items-center gap-1.5 shrink-0">
                    <div className="w-14 h-14 rounded-full bg-brand-highest flex items-center justify-center border-2 border-[#bd0e21]/15 text-[#bd0e21]">
                      <span className="material-symbols-outlined !text-2xl">photo_camera</span>
                    </div>
                    <p className="text-[10px] font-bold text-center w-16 leading-tight font-sans">Foto-detektiv</p>
                  </div>

                  <div className="flex flex-col items-center gap-1.5 shrink-0 opacity-40 grayscale">
                    <div className="w-14 h-14 rounded-full bg-brand-low flex items-center justify-center border-2 border-brand-outline-variant/30 text-brand-on-surface-variant">
                      <span className="material-symbols-outlined !text-2xl font-normal">groups</span>
                    </div>
                    <p className="text-[10px] font-bold text-center w-16 leading-tight">Könüllü</p>
                  </div>

                  <div className="flex flex-col items-center gap-1.5 shrink-0">
                    <div className="w-14 h-14 rounded-full bg-brand-highest flex items-center justify-center border-2 border-[#bd0e21]/15 text-[#bd0e21]">
                      <span className="material-symbols-outlined !text-2xl">volunteer_activism</span>
                    </div>
                    <p className="text-[10px] font-bold text-center w-16 leading-tight">Yardımçı</p>
                  </div>
                </div>
              </section>

              {/* Settings checklist list options */}
              <section className="space-y-3">
                <h2 className="text-xs font-extrabold text-brand-on-surface-variant uppercase tracking-wider block px-1">Tənzimləmələr</h2>
                
                <div className="space-y-2">
                  {/* Language switch option */}
                  <div 
                    onClick={() => {
                      setUser(prev => ({
                        ...prev,
                        language: prev.language === 'AZ' ? 'EN' : 'AZ'
                      }));
                      showToast(`Dil dəyişdirildi: ${user.language === 'AZ' ? 'EN' : 'AZ'}`, 'info');
                    }}
                    className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-[#e5bdba]/15 transition-all cursor-pointer hover:bg-brand-low/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-low rounded-xl flex items-center justify-center text-brand-primary shrink-0">
                        <Globe size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#281716]">Sistem Dili</p>
                        <span className="text-[10px] text-brand-on-surface-variant font-medium">
                          {user.language === 'AZ' ? 'Azərbaycan dili (AZ)' : 'English (EN)'}
                        </span>
                      </div>
                    </div>
                    <div className="flex bg-[#ffe9e7]/60 rounded-full p-1 border border-brand-primary/10 select-none">
                      <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${user.language === 'AZ' ? 'bg-brand-primary text-white' : 'text-brand-on-surface-variant/70'}`}>AZ</span>
                      <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${user.language === 'EN' ? 'bg-brand-primary text-white' : 'text-brand-on-surface-variant/70'}`}>EN</span>
                    </div>
                  </div>

                  {/* Notification switch options */}
                  <div 
                    onClick={() => {
                      setUser(prev => ({
                        ...prev,
                        notificationsEnabled: !prev.notificationsEnabled
                      }));
                      showToast(user.notificationsEnabled ? 'Anlıq bildirişlər söndürüldü.' : 'Anlıq bildirişlər və status təqibləri aktivdir!', 'info');
                    }}
                    className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-[#e5bdba]/15 transition-all cursor-pointer hover:bg-brand-low/20 animate-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-low rounded-xl flex items-center justify-center text-brand-primary shrink-0">
                        <Bell size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#281716]">Anlıq Bildirişlər</p>
                        <span className="text-[10px] font-medium text-brand-on-surface-variant block">Status yenilənmələri barədə durbin xəbər verilir</span>
                      </div>
                    </div>
                    <div className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                      user.notificationsEnabled ? 'bg-[#bd0e21]' : 'bg-gray-300'
                    }`}>
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ${
                        user.notificationsEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </div>
                  </div>

                  {/* Sign Out Trigger back to onboarding slide show */}
                  <div 
                    onClick={() => {
                      // reset user balance to baseline for full interactive exploration
                      setUser(prev => ({
                        ...prev,
                        coins: 1240,
                        notificationsEnabled: true,
                        language: 'AZ'
                      }));
                      setReports(INITIAL_REPORTS);
                      setCarouselIndex(0);
                      navigateTo(AppScreen.ONBOARDING);
                    }}
                    className="flex justify-between items-center bg-brand-low/40 p-4 rounded-2xl border border-brand-primary/10 transition-all cursor-pointer hover:bg-brand-secondary-fixed-dim/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-secondary-fixed/50 rounded-xl flex items-center justify-center text-brand-secondary shrink-0">
                        <LogOut size={18} />
                      </div>
                      <p className="text-xs font-bold text-brand-secondary">Çıxış</p>
                    </div>
                    <ChevronRight size={16} className="text-brand-secondary" />
                  </div>
                </div>
              </section>

            </main>
          )}

          {/* Bottom Persistent Navigation Bar (The Semantic Shell) */}
          <nav className="fixed bottom-0 left-0 w-full flex justify-around items-end pb-5 pt-3 px-2 bg-white/80 backdrop-blur-xl border-t border-brand-outline-variant/30 shadow-[0px_-4px_22px_rgba(135,0,18,0.04)] z-40 rounded-t-3xl">
            {/* Compass - FEED */}
            <a 
              onClick={(e) => { e.preventDefault(); navigateTo(AppScreen.FEED); }}
              className={`flex flex-col items-center justify-center rounded-full px-3 py-1 transition-all duration-200 ${
                currentScreen === AppScreen.FEED 
                  ? 'text-brand-primary font-bold' 
                  : 'text-brand-on-surface-variant/70 hover:bg-brand-primary-fixed/20'
              }`} 
              href="#"
            >
              <Compass size={22} />
              <span className="text-[10px] font-bold mt-1">Lent</span>
            </a>

            {/* ClipboardList - MY_REPORTS */}
            <a 
              onClick={(e) => { e.preventDefault(); navigateTo(AppScreen.MY_REPORTS); }}
              className={`flex flex-col items-center justify-center rounded-full px-3 py-1 transition-all duration-200 ${
                currentScreen === AppScreen.MY_REPORTS 
                  ? 'text-brand-primary font-bold' 
                  : 'text-brand-on-surface-variant/70 hover:bg-brand-primary-fixed/20'
              }`} 
              href="#"
            >
              <ClipboardList size={22} />
              <span className="text-[10px] font-bold mt-1">Müraciətlər</span>
            </a>

            {/* Central Main Action FAB button (Bildir Camera trigger) */}
            <div className="relative -top-5">
              <button 
                onClick={triggerCameraInput}
                className="w-16 h-16 bg-brand-primary text-white rounded-full shadow-[0_8px_25px_rgba(135,0,18,0.4)] active:scale-90 transition-all duration-200 border-4 border-brand-surface flex items-center justify-center hover:bg-brand-primary-container cursor-pointer"
              >
                <Camera size={28} />
              </button>
              <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-extrabold text-brand-primary uppercase tracking-wide">
                BİLDİR
              </span>
            </div>

            {/* Award - REWARDS */}
            <a 
              onClick={(e) => { e.preventDefault(); navigateTo(AppScreen.REWARDS); }}
              className={`flex flex-col items-center justify-center rounded-full px-3 py-1 transition-all duration-200 ${
                currentScreen === AppScreen.REWARDS 
                  ? 'text-brand-primary font-bold' 
                  : 'text-brand-on-surface-variant/70 hover:bg-brand-primary-fixed/20'
              }`} 
              href="#"
            >
              <Award size={22} />
              <span className="text-[10px] font-bold mt-1">Mükafatlar</span>
            </a>

            {/* User - PROFILE */}
            <a 
              onClick={(e) => { e.preventDefault(); navigateTo(AppScreen.PROFILE); }}
              className={`flex flex-col items-center justify-center rounded-full px-3 py-1 transition-all duration-200 ${
                currentScreen === AppScreen.PROFILE 
                  ? 'text-brand-primary font-bold' 
                  : 'text-brand-on-surface-variant/70 hover:bg-brand-primary-fixed/20'
              }`} 
              href="#"
            >
              <User size={22} />
              <span className="text-[10px] font-bold mt-1">Profil</span>
            </a>
          </nav>
        </div>
      )}

    </div>
  );
}
