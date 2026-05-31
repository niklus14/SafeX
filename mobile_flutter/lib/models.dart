/// Domain models — ported from mobile/src/types.ts.
///
/// Status & severity are kept as the Azerbaijani display strings the React app
/// uses (e.g. 'İCRADADIR'), so the rest of the UI can compare them directly.

library;

/// App screens (mirrors the `Screen` union in types.ts).
enum Screen {
  onboarding,
  permissions,
  feed,
  chat,
  messages,
  messageThread,
  myReports,
  camera,
  createDetails,
  aiAnalysis,
  reportSuccess,
  reportDetail,
  rewardClaimed,
  rewards,
  profile,
}

class StatusStep {
  final String name;
  final String status; // 'completed' | 'current' | 'pending'
  final String subtitle;
  final String? time;

  const StatusStep({
    required this.name,
    required this.status,
    required this.subtitle,
    this.time,
  });
}

class ReportComment {
  final String id;
  final String author;
  final String avatar;
  final String time;
  final String text;
  final String? imageUrl;

  const ReportComment({
    required this.id,
    required this.author,
    required this.avatar,
    required this.time,
    required this.text,
    this.imageUrl,
  });
}

class Report {
  String id;
  String title;
  String category;
  String status; // ReportStatus display string
  String time;
  String date;
  String imageUrl;
  String descr;
  String location;
  String severity; // 'Orta' | 'Yüksək' | 'Aşağı'
  String authority;
  String reporterName;
  String reporterAvatar;
  int reactionsCount;
  bool hasUserReacted;
  int upvotes;
  bool upvotedByUser;
  List<ReportComment> comments;
  List<StatusStep> steps;
  bool isOwn;

  Report({
    required this.id,
    required this.title,
    required this.category,
    required this.status,
    required this.time,
    required this.date,
    required this.imageUrl,
    required this.descr,
    required this.location,
    required this.severity,
    required this.authority,
    required this.reporterName,
    required this.reporterAvatar,
    required this.reactionsCount,
    this.hasUserReacted = false,
    this.upvotes = 0,
    this.upvotedByUser = false,
    List<ReportComment>? comments,
    List<StatusStep>? steps,
    this.isOwn = false,
  })  : comments = comments ?? [],
        steps = steps ?? [];
}

class Reward {
  final String id;
  final String title;
  final String badge;
  final int cost;
  final String imageUrl;

  const Reward({
    required this.id,
    required this.title,
    required this.badge,
    required this.cost,
    required this.imageUrl,
  });
}

class UserProfile {
  String name;
  String avatar;
  int trustScore;
  int reportsCount;
  int solvedCount;
  int coins;
  String language; // 'AZ' | 'EN'
  bool notificationsEnabled;

  UserProfile({
    required this.name,
    required this.avatar,
    required this.trustScore,
    required this.reportsCount,
    required this.solvedCount,
    required this.coins,
    this.language = 'AZ',
    this.notificationsEnabled = true,
  });

  UserProfile copy() => UserProfile(
        name: name,
        avatar: avatar,
        trustScore: trustScore,
        reportsCount: reportsCount,
        solvedCount: solvedCount,
        coins: coins,
        language: language,
        notificationsEnabled: notificationsEnabled,
      );
}

class DraftReport {
  String photo;
  String type;
  String description;
  String location;
  bool isLocationCustom;
  double lat;
  double lng;

  DraftReport({
    this.photo = '',
    this.type = 'Yol Təmiri',
    this.description = '',
    this.location = 'Nərimanov r., Təbriz küç.',
    this.isLocationCustom = false,
    this.lat = 40.4093,
    this.lng = 49.8671,
  });
}

/// The initial demo user (mirrors data.ts INITIAL_USER).
UserProfile initialUser() => UserProfile(
      name: 'Anar Məmmədov',
      avatar: 'https://picsum.photos/seed/anar-avatar/80/80',
      trustScore: 92,
      reportsCount: 24,
      solvedCount: 18,
      coins: 1240,
    );

// ── Backend enum → Azerbaijani label maps (ported from store.tsx) ────────────

const Map<String, String> kBackendStatus = {
  'ai_review': 'GÖZLƏYİR',
  'manual_review': 'GÖZLƏYİR',
  'routed': 'GÖZLƏYİR',
  'in_progress': 'İCRADADIR',
  'resolved': 'HƏLL EDİLDİ',
  'rejected': 'İMTİNA EDİLDİ',
};

const Map<String, String> kBackendCategory = {
  'facade': 'Bina fasadı',
  'green_zone': 'Yaşıllıq zonası',
  'flooding': 'Subasma',
  'ice': 'Buzlaşma',
  'cleanliness': 'Təmizlik',
  'waste': 'Zibil konteynerləri',
  'road_excavation': 'Qazılmış asfalt (bərpa)',
  'road_surface': 'Asfalt örtüyü',
  'signage': 'Reklam lövhələri',
  'storefront': 'Vitrinlər',
  'park_equipment': 'Park avadanlığı',
  'fountain': 'Fontanlar',
  'sidewalk': 'Səki və bardürlər',
  'construction_fence': 'Tikinti hasarları',
  'lighting': 'İşıqlandırma',
  'other': 'Digər',
};

const Map<String, String> kBackendSeverity = {
  'low': 'Aşağı',
  'medium': 'Orta',
  'high': 'Yüksək',
};
