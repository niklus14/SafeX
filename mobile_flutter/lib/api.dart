/// api.dart — typed client for the Openwave/myRegion backend.
/// Ported from mobile/src/api.ts. Base URL overridable at build time:
///   flutter run --dart-define=API_URL=http://10.0.2.2:8000
library;

import 'dart:convert';
import 'package:http/http.dart' as http;

const String _base = String.fromEnvironment(
  'API_URL',
  defaultValue: 'http://localhost:8000',
);

// ── Response shapes ──────────────────────────────────────────────────────────

class UserResponse {
  final int id;
  final String displayName;
  final int credibility;
  final int coins;
  UserResponse(this.id, this.displayName, this.credibility, this.coins);

  factory UserResponse.fromJson(Map<String, dynamic> j) => UserResponse(
        j['id'] as int,
        j['display_name'] as String? ?? '',
        j['credibility'] as int? ?? 100,
        j['coins'] as int? ?? 0,
      );
}

class ReportSubmitResponse {
  final bool isRelevant;
  // accepted
  final int? issueId;
  final bool joinedThread;
  final String? titleAz;
  // rejected
  final String? rejectionReasonAz;
  final int? credibility;

  ReportSubmitResponse({
    required this.isRelevant,
    this.issueId,
    this.joinedThread = false,
    this.titleAz,
    this.rejectionReasonAz,
    this.credibility,
  });

  factory ReportSubmitResponse.fromJson(Map<String, dynamic> j) {
    final relevant = j['is_relevant'] == true;
    return ReportSubmitResponse(
      isRelevant: relevant,
      issueId: j['issue_id'] as int?,
      joinedThread: j['joined_thread'] == true,
      titleAz: j['title_az'] as String?,
      rejectionReasonAz: j['rejection_reason_az'] as String?,
      credibility: j['credibility'] as int?,
    );
  }
}

class IssueStep {
  final String name;
  final String status;
  final String subtitle;
  IssueStep(this.name, this.status, this.subtitle);
  factory IssueStep.fromJson(Map<String, dynamic> j) => IssueStep(
        j['name'] as String? ?? '',
        j['status'] as String? ?? 'pending',
        j['subtitle'] as String? ?? '',
      );
}

class IssueReport {
  final int id;
  final String userText;
  final String imageUrl;
  final String createdAt;
  final bool isRoot;
  final String reporterName;
  IssueReport(this.id, this.userText, this.imageUrl, this.createdAt,
      this.isRoot, this.reporterName);
  factory IssueReport.fromJson(Map<String, dynamic> j) => IssueReport(
        j['id'] as int,
        j['user_text'] as String? ?? '',
        j['image_url'] as String? ?? '',
        j['created_at'] as String? ?? '',
        j['is_root'] == true,
        j['reporter_name'] as String? ?? 'Vətəndaş',
      );
}

class IssueDetail {
  final int id;
  final String category;
  final String severity;
  final String titleAz;
  final String briefDescAz;
  final String fullDescAz;
  final String status;
  final String? deadline;
  final String createdAt;
  final double lat;
  final double lng;
  final Map<String, String>? org; // {key, name_az}
  final int reportCount;
  final String locationAz;
  final List<IssueReport> reports;
  final List<IssueStep> steps;

  IssueDetail({
    required this.id,
    required this.category,
    required this.severity,
    required this.titleAz,
    required this.briefDescAz,
    required this.fullDescAz,
    required this.status,
    required this.deadline,
    required this.createdAt,
    required this.lat,
    required this.lng,
    required this.org,
    required this.reportCount,
    required this.locationAz,
    required this.reports,
    required this.steps,
  });

  factory IssueDetail.fromJson(Map<String, dynamic> j) {
    final orgJson = j['org'];
    return IssueDetail(
      id: j['id'] as int,
      category: j['category'] as String? ?? 'other',
      severity: j['severity'] as String? ?? 'medium',
      titleAz: j['title_az'] as String? ?? '',
      briefDescAz: j['brief_desc_az'] as String? ?? '',
      fullDescAz: j['full_desc_az'] as String? ?? '',
      status: j['status'] as String? ?? 'manual_review',
      deadline: j['deadline'] as String?,
      createdAt: j['created_at'] as String? ?? '',
      lat: (j['lat'] as num?)?.toDouble() ?? 0,
      lng: (j['lng'] as num?)?.toDouble() ?? 0,
      org: orgJson is Map
          ? {
              'key': orgJson['key'] as String? ?? '',
              'name_az': orgJson['name_az'] as String? ?? '',
            }
          : null,
      reportCount: j['report_count'] as int? ?? 1,
      locationAz: j['location_az'] as String? ?? '',
      reports: ((j['reports'] as List?) ?? [])
          .map((e) => IssueReport.fromJson(e as Map<String, dynamic>))
          .toList(),
      steps: ((j['steps'] as List?) ?? [])
          .map((e) => IssueStep.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class MyReportSummary {
  final int issueId;
  final String status;
  final String titleAz;
  final String category;
  final String imageUrl;
  final String createdAt;
  final String? deadline;
  MyReportSummary(this.issueId, this.status, this.titleAz, this.category,
      this.imageUrl, this.createdAt, this.deadline);
  factory MyReportSummary.fromJson(Map<String, dynamic> j) => MyReportSummary(
        j['issue_id'] as int,
        j['status'] as String? ?? 'manual_review',
        j['title_az'] as String? ?? '',
        j['category'] as String? ?? 'other',
        j['image_url'] as String? ?? '',
        j['created_at'] as String? ?? '',
        j['deadline'] as String?,
      );
}

class ProfileResponse {
  final int id;
  final String displayName;
  final int credibility;
  final int coins;
  final List<MyReportSummary> reports;
  ProfileResponse(
      this.id, this.displayName, this.credibility, this.coins, this.reports);
  factory ProfileResponse.fromJson(Map<String, dynamic> j) => ProfileResponse(
        j['id'] as int,
        j['display_name'] as String? ?? '',
        j['credibility'] as int? ?? 100,
        j['coins'] as int? ?? 0,
        ((j['reports'] as List?) ?? [])
            .map((e) => MyReportSummary.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

class FeedIssue {
  final int id;
  final String titleAz;
  final String briefDescAz;
  final String category;
  final String severity;
  final String status;
  final int reportCount;
  final String? imageUrl;
  final String createdAt;
  final String locationAz;
  final String reporterName;
  final double lat;
  final double lng;

  FeedIssue({
    required this.id,
    required this.titleAz,
    required this.briefDescAz,
    required this.category,
    required this.severity,
    required this.status,
    required this.reportCount,
    required this.imageUrl,
    required this.createdAt,
    required this.locationAz,
    required this.reporterName,
    required this.lat,
    required this.lng,
  });

  factory FeedIssue.fromJson(Map<String, dynamic> j) => FeedIssue(
        id: j['id'] as int,
        titleAz: j['title_az'] as String? ?? '',
        briefDescAz: j['brief_desc_az'] as String? ?? '',
        category: j['category'] as String? ?? 'other',
        severity: j['severity'] as String? ?? 'medium',
        status: j['status'] as String? ?? 'manual_review',
        reportCount: j['report_count'] as int? ?? 1,
        imageUrl: j['image_url'] as String?,
        createdAt: j['created_at'] as String? ?? '',
        locationAz: j['location_az'] as String? ?? '',
        reporterName: j['reporter_name'] as String? ?? 'Vətəndaş',
        lat: (j['lat'] as num?)?.toDouble() ?? 0,
        lng: (j['lng'] as num?)?.toDouble() ?? 0,
      );
}

class ApiReward {
  final String id;
  final String titleAz;
  final String badge;
  final int costCoins;
  final String imageUrl;
  ApiReward(this.id, this.titleAz, this.badge, this.costCoins, this.imageUrl);
  factory ApiReward.fromJson(Map<String, dynamic> j) => ApiReward(
        j['id'] as String? ?? '',
        j['title_az'] as String? ?? '',
        j['badge'] as String? ?? '',
        j['cost_coins'] as int? ?? 0,
        j['image_url'] as String? ?? '',
      );
}

// ── Client ───────────────────────────────────────────────────────────────────

class ApiException implements Exception {
  final int status;
  final String body;
  ApiException(this.status, this.body);
  @override
  String toString() => 'ApiException($status): $body';
}

class Api {
  final http.Client _http;
  Api([http.Client? client]) : _http = client ?? http.Client();

  Future<dynamic> _get(String path) async {
    final res = await _http.get(Uri.parse('$_base$path'));
    if (res.statusCode >= 400) throw ApiException(res.statusCode, res.body);
    return jsonDecode(utf8.decode(res.bodyBytes));
  }

  Future<dynamic> _postForm(String path, Map<String, String> fields) async {
    final req = http.MultipartRequest('POST', Uri.parse('$_base$path'))
      ..fields.addAll(fields);
    final streamed = await req.send();
    final res = await http.Response.fromStream(streamed);
    if (res.statusCode >= 400) throw ApiException(res.statusCode, res.body);
    return jsonDecode(utf8.decode(res.bodyBytes));
  }

  Future<UserResponse> createUser(String displayName, {String? phone}) async {
    final fields = {'display_name': displayName};
    if (phone != null) fields['phone'] = phone;
    return UserResponse.fromJson(await _postForm('/users', fields));
  }

  Future<ReportSubmitResponse> submitReport({
    required String imageUrl,
    required String description,
    required double lat,
    required double lng,
    required int userId,
  }) async {
    final json = await _postForm('/reports', {
      'image_url': imageUrl,
      'description': description,
      'lat': lat.toString(),
      'lng': lng.toString(),
      'user_id': userId.toString(),
    });
    return ReportSubmitResponse.fromJson(json as Map<String, dynamic>);
  }

  Future<IssueDetail> getIssue(int id) async =>
      IssueDetail.fromJson(await _get('/issues/$id') as Map<String, dynamic>);

  Future<ProfileResponse> getMe(int userId) async =>
      ProfileResponse.fromJson(await _get('/me/$userId') as Map<String, dynamic>);

  Future<List<ApiReward>> getRewards() async {
    final list = await _get('/rewards') as List;
    return list.map((e) => ApiReward.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<FeedIssue>> listIssues({int pageSize = 50}) async {
    final json = await _get('/admin/issues?sort=created&page_size=$pageSize')
        as Map<String, dynamic>;
    final items = (json['items'] as List?) ?? [];
    return items
        .map((e) => FeedIssue.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}

final api = Api();
