import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../app_state.dart';
import '../api.dart';
import '../models.dart';
import '../theme.dart';
import '../widgets/common.dart';

class ReportDetailScreen extends StatefulWidget {
  const ReportDetailScreen({super.key});
  @override
  State<ReportDetailScreen> createState() => _ReportDetailScreenState();
}

class _ReportDetailScreenState extends State<ReportDetailScreen> {
  late String _tab; // 'thread' | 'comments'
  IssueDetail? _detail;
  bool _threadLoading = false;
  bool _showAllSteps = false;
  final _commentCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    final app = context.read<AppState>();
    _tab = app.reportDetailView;
    _loadDetail();
  }

  Future<void> _loadDetail() async {
    final app = context.read<AppState>();
    final id = app.selectedReportId;
    if (id == null) return;
    final apiId = app.apiIssueIds[id];
    if (apiId == null) return;
    setState(() => _threadLoading = true);
    try {
      final issue = await api.getIssue(apiId);
      if (!mounted) return;
      setState(() => _detail = issue);
      const statusMap = {
        'ai_review': 'GÖZLƏYİR',
        'manual_review': 'GÖZLƏYİR',
        'routed': 'GÖZLƏYİR',
        'in_progress': 'İCRADADIR',
        'resolved': 'HƏLL EDİLDİ',
        'rejected': 'İMTİNA EDİLDİ',
      };
      app.updateReport(id, (r) {
        r.status = statusMap[issue.status] ?? 'GÖZLƏYİR';
        r.authority = issue.org?['name_az'] ?? r.authority;
        r.reactionsCount = issue.reportCount;
        r.steps = issue.steps
            .map((s) => StatusStep(
                name: s.name, status: s.status, subtitle: s.subtitle))
            .toList();
      });
    } catch (_) {/* ignore */} finally {
      if (mounted) setState(() => _threadLoading = false);
    }
  }

  void _addComment() {
    final text = _commentCtrl.text.trim();
    if (text.isEmpty) return;
    final app = context.read<AppState>();
    final r = app.selectedReport;
    if (r == null) return;
    app.addComment(
      r.id,
      ReportComment(
        id: 'comment-${DateTime.now().millisecondsSinceEpoch}',
        author: '${app.user.name} (Siz)',
        avatar: app.user.avatar,
        time: 'İndi',
        text: text,
      ),
    );
    _commentCtrl.clear();
    app.showToast('Şərhiniz əlavə edildi! +2 Xal', ToastKind.success);
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final report = app.selectedReport;
    if (report == null) return const SizedBox.shrink();

    final status = StatusStyle.of(report.status);
    final threadReports = _detail?.reports ?? [];
    final location = (_detail?.locationAz.isNotEmpty ?? false)
        ? _detail!.locationAz
        : report.location;

    return Container(
      color: const Color(0xFFFAF5F4),
      child: Column(
        children: [
          // Header
          Container(
            height: 56,
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: SafeArea(
              bottom: false,
              child: Row(
                children: [
                  IconButton(
                    onPressed: () =>
                        app.navigate(app.prevScreen ?? Screen.feed),
                    icon: const Icon(Icons.arrow_back, color: AppColors.ink),
                  ),
                  const Spacer(),
                  Pill(status.label, bg: status.bg, fg: status.fg, fontSize: 10),
                  const SizedBox(width: 8),
                  Pill(report.category, bg: AppColors.low, fg: AppColors.primary,
                      fontSize: 11),
                ],
              ),
            ),
          ),
          // Tab bar
          Container(
            color: Colors.white,
            child: Row(
              children: [
                _tabBtn('thread',
                    'Müraciətlər${threadReports.isNotEmpty ? ' (${threadReports.length})' : ''}'),
                _tabBtn('comments',
                    'Şərhlər${report.comments.isNotEmpty ? ' (${report.comments.length})' : ''}'),
              ],
            ),
          ),
          Expanded(
            child: _tab == 'thread'
                ? _threadTab(report, threadReports, location)
                : _commentsTab(report),
          ),
          if (_tab == 'comments') _commentInput(app),
        ],
      ),
    );
  }

  Widget _tabBtn(String id, String label) {
    final active = _tab == id;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _tab = id),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            border: Border(
                bottom: BorderSide(
                    color: active ? AppColors.primary : Colors.transparent,
                    width: 3)),
          ),
          child: Text(label,
              textAlign: TextAlign.center,
              style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: active ? AppColors.ink : AppColors.faintInk)),
        ),
      ),
    );
  }

  Widget _threadTab(Report report, List<IssueReport> thread, String location) {
    final fullDesc = (_detail?.fullDescAz.isNotEmpty ?? false)
        ? _detail!.fullDescAz
        : report.descr;
    final others = thread.where((r) => !r.isRoot).toList();

    return ListView(
      children: [
        // Hero
        Container(
          color: Colors.white,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (report.imageUrl.isNotEmpty)
                ConstrainedBox(
                  constraints: const BoxConstraints(maxHeight: 256),
                  child: AspectRatio(
                      aspectRatio: 16 / 10, child: AppImage(report.imageUrl)),
                ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        ClipOval(
                            child: SizedBox(
                                width: 36,
                                height: 36,
                                child: AppImage(report.reporterAvatar))),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(report.reporterName,
                                  style: const TextStyle(
                                      fontSize: 13, fontWeight: FontWeight.bold)),
                              Text(report.time,
                                  style: const TextStyle(
                                      fontSize: 11, color: AppColors.faintInk)),
                            ],
                          ),
                        ),
                        Icon(Icons.star,
                            size: 14, color: AppColors.primary.withOpacity(0.5)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(report.title,
                        style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            height: 1.3,
                            color: AppColors.ink)),
                    if (fullDesc.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.only(left: 12),
                        decoration: const BoxDecoration(
                            border: Border(
                                left: BorderSide(
                                    color: AppColors.outlineVariant, width: 2))),
                        child: Text(fullDesc,
                            style: const TextStyle(
                                fontSize: 13,
                                height: 1.5,
                                fontStyle: FontStyle.italic,
                                color: AppColors.mutedInk)),
                      ),
                    ],
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Icon(Icons.location_on,
                            size: 13, color: AppColors.primary.withOpacity(0.7)),
                        const SizedBox(width: 6),
                        Expanded(
                            child: Text(location,
                                style: const TextStyle(
                                    fontSize: 12, color: AppColors.mutedInk))),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        // Stepper
        _stepper(report),
        // Thread replies
        if (_threadLoading)
          const Padding(
            padding: EdgeInsets.all(32),
            child: Center(
                child: CircularProgressIndicator(color: AppColors.primary)),
          )
        else if (others.isNotEmpty)
          Container(
            color: Colors.white,
            margin: const EdgeInsets.only(top: 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  child: Row(
                    children: [
                      const Icon(Icons.people_outline,
                          size: 13, color: AppColors.faintInk),
                      const SizedBox(width: 6),
                      Text('${thread.length} bildiriş',
                          style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: AppColors.faintInk)),
                    ],
                  ),
                ),
                ...others.map((r) => Padding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          InitialAvatar(r.reporterName, size: 36),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(r.reporterName,
                                    style: const TextStyle(
                                        fontSize: 13, fontWeight: FontWeight.bold)),
                                if (r.userText.isNotEmpty) ...[
                                  const SizedBox(height: 2),
                                  Text(r.userText,
                                      style: const TextStyle(
                                          fontSize: 13, color: Color(0xFF3D2120))),
                                ],
                              ],
                            ),
                          ),
                        ],
                      ),
                    )),
              ],
            ),
          ),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _stepper(Report report) {
    StatusStep? current;
    for (final s in report.steps) {
      if (s.status == 'current') current = s;
    }
    current ??= report.steps.isNotEmpty ? report.steps.last : null;
    final visible = _showAllSteps
        ? report.steps
        : (current != null ? [current] : <StatusStep>[]);

    return Container(
      color: Colors.white,
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.local_fire_department,
                      size: 14, color: AppColors.primary),
                  SizedBox(width: 6),
                  Text('Status',
                      style: TextStyle(
                          fontSize: 12, fontWeight: FontWeight.bold)),
                ],
              ),
              GestureDetector(
                onTap: () => setState(() => _showAllSteps = !_showAllSteps),
                child: Text(_showAllSteps ? 'Gizlət' : 'Hamısı',
                    style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...visible.map((step) {
            final idx = report.steps.indexWhere((s) => s.name == step.name);
            final done = step.status == 'completed';
            final cur = step.status == 'current';
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 32,
                    height: 32,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: done
                          ? AppColors.successBg
                          : cur
                              ? AppColors.low
                              : const Color(0xFFF5F5F5),
                      border: Border.all(
                          color: done
                              ? AppColors.successFg
                              : cur
                                  ? AppColors.primary
                                  : const Color(0xFFDDDDDD),
                          width: 2),
                    ),
                    child: done
                        ? const Icon(Icons.check, size: 14, color: AppColors.successFg)
                        : Text('${idx + 1}',
                            style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: cur ? AppColors.primary : Colors.grey)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(step.name,
                            style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: cur ? AppColors.primary : AppColors.ink)),
                        if (step.subtitle.isNotEmpty)
                          Text(step.subtitle,
                              style: const TextStyle(
                                  fontSize: 11, color: AppColors.faintInk)),
                      ],
                    ),
                  ),
                  if (step.time != null && step.time!.isNotEmpty)
                    Text(step.time!,
                        style: const TextStyle(
                            fontSize: 10, color: Color(0xFFC4A09E))),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _commentsTab(Report report) {
    if (report.comments.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: const BoxDecoration(
                  color: AppColors.low, shape: BoxShape.circle),
              child: Icon(Icons.mode_comment_outlined,
                  color: AppColors.primary.withOpacity(0.4)),
            ),
            const SizedBox(height: 12),
            const Text('Hələ heç bir şərh yoxdur',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            const Text('İlk şərhi siz yazın!',
                style: TextStyle(fontSize: 12, color: AppColors.faintInk)),
          ],
        ),
      );
    }
    return ListView.builder(
      itemCount: report.comments.length,
      itemBuilder: (_, i) {
        final c = report.comments[i];
        return Container(
          color: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: const BoxDecoration(
            border: Border(bottom: BorderSide(color: AppColors.hairline)),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipOval(
                  child: SizedBox(
                      width: 36, height: 36, child: AppImage(c.avatar))),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(c.author,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                  fontSize: 13, fontWeight: FontWeight.bold)),
                        ),
                        const SizedBox(width: 6),
                        Text(c.time,
                            style: const TextStyle(
                                fontSize: 11, color: AppColors.faintInk)),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(c.text,
                        style: const TextStyle(
                            fontSize: 13, height: 1.5, color: Color(0xFF3D2120))),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _commentInput(AppState app) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            ClipOval(
                child: SizedBox(
                    width: 32, height: 32, child: AppImage(app.user.avatar))),
            const SizedBox(width: 8),
            Expanded(
              child: TextField(
                controller: _commentCtrl,
                onSubmitted: (_) => _addComment(),
                decoration: InputDecoration(
                  hintText: 'Şərh yazın...',
                  isDense: true,
                  filled: true,
                  fillColor: const Color(0xFFF5F0EF),
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(999),
                      borderSide: BorderSide.none),
                ),
              ),
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: _addComment,
              child: Container(
                padding: const EdgeInsets.all(10),
                decoration: const BoxDecoration(
                    color: AppColors.primary, shape: BoxShape.circle),
                child: const Icon(Icons.send, color: Colors.white, size: 16),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
