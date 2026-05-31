/// app_state.dart — single ChangeNotifier holding all app state.
/// Ported from mobile/src/store.tsx (reducer cases become methods).
library;

import 'dart:math';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'api.dart';
import 'models.dart';

const _kUserIdKey = 'openwave_user_id';

const _months = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr',
];

String _fmtTime(DateTime d) =>
    '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';

String _fmtDate(DateTime d) => '${d.day} ${_months[d.month - 1]}';

enum ToastKind { success, info, error }

class ToastData {
  final String message;
  final ToastKind kind;
  ToastData(this.message, this.kind);
}

class ClaimedReward {
  final Reward reward;
  final String code;
  ClaimedReward(this.reward, this.code);
}

class AppState extends ChangeNotifier {
  // ── State fields (mirror AppState in store.tsx) ──
  Screen screen = Screen.onboarding;
  Screen? prevScreen;
  int? userId;
  UserProfile user = initialUser();
  List<Report> reports = [];
  String? selectedReportId;
  String? selectedOrganization;
  String? messageThread;
  List<Reward> rewards = [];
  final Map<String, int> apiIssueIds = {};
  DraftReport draft = DraftReport();
  String? justCreatedId;
  ClaimedReward? claimedReward;
  ToastData? toast;
  int carouselIndex = 0;
  final Map<String, bool> permissions = {'camera': false, 'location': false};
  String activeChip = 'HAMISI'; // 'HAMISI' | 'AKTIV' | 'HELLEDILIB'
  String reportDetailView = 'thread'; // 'thread' | 'comments'

  final _rng = Random();

  AppState() {
    _bootstrap();
  }

  // ── Navigation + toast ──────────────────────────────────────────────────────

  void navigate(Screen to) {
    prevScreen = screen;
    screen = to;
    notifyListeners();
  }

  void showToast(String message, [ToastKind kind = ToastKind.info]) {
    toast = ToastData(message, kind);
    notifyListeners();
    Future.delayed(const Duration(seconds: 4), () {
      if (toast?.message == message) {
        toast = null;
        notifyListeners();
      }
    });
  }

  void hideToast() {
    toast = null;
    notifyListeners();
  }

  // ── Simple setters ──────────────────────────────────────────────────────────

  void setCarousel(int index) {
    carouselIndex = index;
    notifyListeners();
  }

  void setChip(String chip) {
    activeChip = chip;
    notifyListeners();
  }

  void grantPermission(String perm) {
    permissions[perm] = true;
    notifyListeners();
  }

  void selectOrg(String org) {
    selectedOrganization = org;
    notifyListeners();
  }

  void setMessageThread(String? thread) {
    messageThread = thread;
    notifyListeners();
  }

  void selectReport(String id, {String view = 'thread'}) {
    selectedReportId = id;
    reportDetailView = view;
    notifyListeners();
  }

  void patchDraft({
    String? photo,
    String? type,
    String? description,
    String? location,
    bool? isLocationCustom,
    double? lat,
    double? lng,
  }) {
    if (photo != null) draft.photo = photo;
    if (type != null) draft.type = type;
    if (description != null) draft.description = description;
    if (location != null) draft.location = location;
    if (isLocationCustom != null) draft.isLocationCustom = isLocationCustom;
    if (lat != null) draft.lat = lat;
    if (lng != null) draft.lng = lng;
    notifyListeners();
  }

  void resetDraftForCapture() {
    draft = DraftReport(
      photo: '',
      type: 'Yol Təmiri',
      description: '',
      location: 'Nərimanov r., Təbriz küç.',
      isLocationCustom: false,
    );
    notifyListeners();
  }

  Report? get selectedReport {
    for (final r in reports) {
      if (r.id == selectedReportId) return r;
    }
    return null;
  }

  void updateReport(String id, void Function(Report r) patch) {
    for (final r in reports) {
      if (r.id == id) {
        patch(r);
        break;
      }
    }
    notifyListeners();
  }

  void adjustCoins(int delta) {
    user.coins += delta;
    notifyListeners();
  }

  void mapApiIssue(String localId, int apiId) {
    apiIssueIds[localId] = apiId;
    notifyListeners();
  }

  // ── Upvote / support / comments ─────────────────────────────────────────────

  void toggleUpvote(String id) {
    for (final r in reports) {
      if (r.id == id) {
        r.upvotedByUser = !r.upvotedByUser;
        r.upvotes += r.upvotedByUser ? 1 : -1;
        break;
      }
    }
    notifyListeners();
  }

  void addComment(String reportId, ReportComment comment) {
    user.coins += 2;
    for (final r in reports) {
      if (r.id == reportId) {
        r.comments.add(comment);
        break;
      }
    }
    notifyListeners();
  }

  // ── Feed load + profile hydrate (ported LOAD_FEED / HYDRATE) ────────────────

  void loadFeed(List<FeedIssue> issues) {
    final ownIds = reports.where((r) => r.isOwn).map((r) => r.id).toSet();
    final sessionReports =
        reports.where((r) => r.id.startsWith('#RG-')).toList();

    final feedReports = issues.map((i) {
      final localId = '#API-${i.id}';
      apiIssueIds[localId] = i.id;
      final created = DateTime.tryParse(i.createdAt) ?? DateTime.now();
      return Report(
        id: localId,
        title: i.titleAz.isNotEmpty
            ? i.titleAz
            : (kBackendCategory[i.category] ?? i.category),
        category: kBackendCategory[i.category] ?? i.category,
        status: kBackendStatus[i.status] ?? 'GÖZLƏYİR',
        time: _fmtTime(created),
        date: _fmtDate(created),
        imageUrl: i.imageUrl ?? '',
        descr: i.briefDescAz,
        location: i.locationAz.isNotEmpty
            ? i.locationAz
            : '${i.lat.toStringAsFixed(4)}°N, ${i.lng.toStringAsFixed(4)}°E',
        severity: kBackendSeverity[i.severity] ?? 'Orta',
        authority: '',
        reporterName: i.reporterName.isNotEmpty ? i.reporterName : 'Vətəndaş',
        reporterAvatar: 'https://picsum.photos/seed/u${i.id}/40/40',
        reactionsCount: i.reportCount,
        isOwn: ownIds.contains(localId),
      );
    }).toList();

    reports = [...sessionReports, ...feedReports];
    notifyListeners();
  }

  void hydrateBackendReports(List<MyReportSummary> summaries) {
    for (final s in summaries) {
      final localId = '#API-${s.issueId}';
      final idx = reports.indexWhere(
          (r) => r.imageUrl == s.imageUrl || r.id == localId);
      if (idx >= 0) {
        apiIssueIds[reports[idx].id] = s.issueId;
        reports[idx].isOwn = true;
      } else {
        final created = DateTime.tryParse(s.createdAt) ?? DateTime.now();
        reports.insert(
          0,
          Report(
            id: localId,
            title: s.titleAz,
            category: kBackendCategory[s.category] ?? s.category,
            status: kBackendStatus[s.status] ?? 'GÖZLƏYİR',
            time: _fmtTime(created),
            date: _fmtDate(created),
            imageUrl: s.imageUrl,
            descr: s.titleAz,
            location: 'Nərimanov r.',
            severity: 'Orta',
            authority: '',
            reporterName: user.name,
            reporterAvatar: user.avatar,
            reactionsCount: 1,
            hasUserReacted: true,
            isOwn: true,
            steps: const [
              StatusStep(
                  name: 'Süni intellekt yoxlaması',
                  status: 'completed',
                  subtitle: 'Tamamlandı'),
              StatusStep(
                  name: 'Operator yoxlaması',
                  status: 'current',
                  subtitle: 'Hazırda bu mərhələdədir'),
            ],
          ),
        );
        apiIssueIds[localId] = s.issueId;
      }
    }
    notifyListeners();
  }

  // ── Submission flow (ported COMPLETE_ANALYSIS) ──────────────────────────────

  String completeAnalysis() {
    final reportId = '#RG-${10000 + _rng.nextInt(90000)}';
    final title = draft.description.length > 30
        ? '${draft.description.substring(0, 30)}...'
        : '${draft.type} Proseduru';
    final newReport = Report(
      id: reportId,
      title: title,
      category: draft.type,
      status: 'GÖZLƏYİR',
      time: 'İndicə',
      date: 'Növbəti günlər',
      imageUrl: draft.photo,
      descr: draft.description.isNotEmpty
          ? draft.description
          : 'Kamera ilə təyin olunmuş problem sahəsinin təhlili.',
      location: draft.location,
      severity: 'Orta',
      authority: draft.type.contains('Yol')
          ? 'Bakı Şəhər İcra Hakimiyyəti'
          : 'Abadlıq şöbəsi',
      reporterName: user.name,
      reporterAvatar: user.avatar,
      reactionsCount: 1,
      hasUserReacted: true,
      isOwn: true,
      steps: const [
        StatusStep(
            name: 'Süni intellekt yoxlaması',
            status: 'completed',
            subtitle: 'Problem uğurla analiz olundu',
            time: 'İndicə'),
        StatusStep(
            name: 'Operator yoxlaması',
            status: 'current',
            subtitle: 'Aidiyyatı idarə tərəfindən baxış gözlənilir'),
      ],
    );
    reports.insert(0, newReport);
    justCreatedId = reportId;
    selectedReportId = reportId;
    user.reportsCount += 1;
    user.coins += 10;
    prevScreen = screen;
    screen = Screen.reportSuccess;
    notifyListeners();
    return reportId;
  }

  // ── Rewards ─────────────────────────────────────────────────────────────────

  void claimReward(Reward reward, String code) {
    user.coins -= reward.cost;
    claimedReward = ClaimedReward(reward, code);
    prevScreen = screen;
    screen = Screen.rewardClaimed;
    notifyListeners();
  }

  void clearClaimed() {
    claimedReward = null;
    notifyListeners();
  }

  // ── User profile mutations ──────────────────────────────────────────────────

  void updateUser({
    String? language,
    bool? notificationsEnabled,
    int? coins,
    int? trustScore,
    int? reportsCount,
    int? solvedCount,
  }) {
    if (language != null) user.language = language;
    if (notificationsEnabled != null) {
      user.notificationsEnabled = notificationsEnabled;
    }
    if (coins != null) user.coins = coins;
    if (trustScore != null) user.trustScore = trustScore;
    if (reportsCount != null) user.reportsCount = reportsCount;
    if (solvedCount != null) user.solvedCount = solvedCount;
    notifyListeners();
  }

  void reset() {
    final keepUserId = userId;
    user = initialUser();
    user.coins = 1240;
    reports = [];
    apiIssueIds.clear();
    draft = DraftReport();
    justCreatedId = null;
    claimedReward = null;
    selectedReportId = null;
    carouselIndex = 0;
    reportDetailView = 'thread';
    activeChip = 'HAMISI';
    userId = keepUserId;
    prevScreen = null;
    screen = Screen.onboarding;
    notifyListeners();
  }

  // ── Bootstrap: register/restore user + fetch rewards (ported useEffect) ─────

  Future<void> _bootstrap() async {
    final prefs = await SharedPreferences.getInstance();
    final stored = prefs.getInt(_kUserIdKey);
    userId = stored;

    if (userId == null) {
      try {
        final u = await api.createUser(user.name);
        userId = u.id;
        await prefs.setInt(_kUserIdKey, u.id);
        notifyListeners();
      } catch (_) {/* offline — keep demo defaults */}
    } else {
      try {
        final p = await api.getMe(userId!);
        user.coins = p.coins;
        user.trustScore = p.credibility;
        user.reportsCount = p.reports.length;
        user.solvedCount =
            p.reports.where((r) => r.status == 'resolved').length;
        notifyListeners();
        hydrateBackendReports(p.reports);
      } catch (_) {/* ignore */}
    }

    try {
      final data = await api.getRewards();
      rewards = data
          .map((r) => Reward(
                id: r.id,
                title: r.titleAz,
                badge: r.badge,
                cost: r.costCoins,
                imageUrl: r.imageUrl,
              ))
          .toList();
      notifyListeners();
    } catch (_) {/* ignore */}
  }
}
