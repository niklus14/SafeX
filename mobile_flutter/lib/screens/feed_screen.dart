import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../app_state.dart';
import '../api.dart';
import '../models.dart';
import '../theme.dart';
import '../widgets/common.dart';

class FeedScreen extends StatefulWidget {
  const FeedScreen({super.key});
  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final items = await api.listIssues();
      if (mounted) context.read<AppState>().loadFeed(items);
    } catch (_) {/* ignore — keep whatever's there */}
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final tab = app.activeChip == 'HELLEDILIB' ? 'HELLEDILIB' : 'AKTIV';

    final filtered = app.reports.where((r) {
      if (tab == 'AKTIV') {
        return r.status == 'İCRADADIR' || r.status == 'GÖZLƏYİR';
      }
      return r.status == 'HƏLL EDİLDİ' || r.status == 'İMTİNA EDİLDİ';
    }).toList();

    final activeCount = app.reports
        .where((r) => r.status == 'İCRADADIR' || r.status == 'GÖZLƏYİR')
        .length;
    final resolvedCount = app.reports
        .where((r) => r.status == 'HƏLL EDİLDİ' || r.status == 'İMTİNA EDİLDİ')
        .length;

    return Column(
      children: [
        // Tab bar
        Container(
          color: Colors.white.withOpacity(0.9),
          child: Row(
            children: [
              _tab(app, 'AKTIV', 'Aktiv', activeCount, tab == 'AKTIV'),
              _tab(app, 'HELLEDILIB', 'Həll Edilmiş', resolvedCount,
                  tab == 'HELLEDILIB'),
            ],
          ),
        ),
        Expanded(
          child: _loading && app.reports.isEmpty
              ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
              : filtered.isEmpty
                  ? _empty(tab)
                  : ListView.builder(
                      padding: const EdgeInsets.only(bottom: 96),
                      itemCount: filtered.length,
                      itemBuilder: (_, i) => _TweetCard(report: filtered[i]),
                    ),
        ),
      ],
    );
  }

  Widget _tab(AppState app, String id, String label, int count, bool active) {
    return Expanded(
      child: InkWell(
        onTap: () => app.setChip(id),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            border: Border(
              bottom: BorderSide(
                color: active ? AppColors.primary : Colors.transparent,
                width: 3,
              ),
            ),
          ),
          child: Column(
            children: [
              Text(label,
                  style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: active ? AppColors.ink : AppColors.faintInk)),
              if (count > 0)
                Text('$count',
                    style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: active
                            ? AppColors.primary
                            : AppColors.outlineVariant)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _empty(String tab) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: const BoxDecoration(
                color: AppColors.low, shape: BoxShape.circle),
            child: Icon(Icons.chat_bubble_outline,
                size: 28, color: AppColors.primary.withOpacity(0.4)),
          ),
          const SizedBox(height: 16),
          Text(
              tab == 'AKTIV'
                  ? 'Aktiv müraciət yoxdur'
                  : 'Həll edilmiş müraciət yoxdur',
              style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: AppColors.onSurface)),
        ],
      ),
    );
  }
}

class _TweetCard extends StatelessWidget {
  final Report report;
  const _TweetCard({required this.report});

  @override
  Widget build(BuildContext context) {
    final app = context.read<AppState>();
    final status = StatusStyle.of(report.status);

    void openThread() {
      app.selectReport(report.id, view: 'thread');
      app.navigate(Screen.reportDetail);
    }

    void openComments() {
      app.selectReport(report.id, view: 'comments');
      app.navigate(Screen.reportDetail);
    }

    return GestureDetector(
      onTap: openThread,
      child: Container(
        decoration: const BoxDecoration(
          border: Border(bottom: BorderSide(color: AppColors.hairline)),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(top: 14),
              child: ClipOval(
                child: SizedBox(
                  width: 40,
                  height: 40,
                  child: AppImage(report.reporterAvatar),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // meta
                    Row(
                      children: [
                        Flexible(
                          child: Text(report.reporterName,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.ink)),
                        ),
                        const Text('  ·  ',
                            style: TextStyle(color: Color(0xFFC4A09E), fontSize: 11)),
                        Flexible(
                          child: Text(report.category,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500,
                                  color: Color(0xFF7A5250))),
                        ),
                        const Text('  ·  ',
                            style: TextStyle(color: Color(0xFFC4A09E), fontSize: 11)),
                        Text(report.time,
                            style: const TextStyle(
                                fontSize: 11, color: AppColors.faintInk)),
                      ],
                    ),
                    const SizedBox(height: 6),
                    // title
                    Text(report.title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            height: 1.3,
                            color: AppColors.ink)),
                    const SizedBox(height: 8),
                    // image
                    if (report.imageUrl.isNotEmpty)
                      ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: ConstrainedBox(
                          constraints: const BoxConstraints(maxHeight: 224),
                          child: AspectRatio(
                            aspectRatio: 16 / 10,
                            child: AppImage(report.imageUrl),
                          ),
                        ),
                      ),
                    const SizedBox(height: 8),
                    // location
                    Row(
                      children: [
                        Icon(Icons.location_on,
                            size: 12, color: AppColors.primary.withOpacity(0.6)),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(report.location,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                  fontSize: 11.5, color: AppColors.mutedInk)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    // engagement
                    Row(
                      children: [
                        _engage(
                          icon: Icons.keyboard_arrow_up,
                          label: '${report.upvotes}',
                          active: report.upvotedByUser,
                          onTap: () => app.toggleUpvote(report.id),
                        ),
                        const SizedBox(width: 20),
                        _engage(
                          icon: Icons.chat_bubble_outline,
                          label: '${report.comments.length}',
                          onTap: openComments,
                        ),
                        const SizedBox(width: 20),
                        _engage(
                          icon: Icons.people_outline,
                          label: '${report.reactionsCount}',
                          muted: true,
                          onTap: openThread,
                        ),
                        const Spacer(),
                        Pill(status.label.toUpperCase(),
                            bg: status.bg, fg: status.fg, fontSize: 9),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _engage(
      {required IconData icon,
      required String label,
      required VoidCallback onTap,
      bool active = false,
      bool muted = false}) {
    final color = active
        ? AppColors.primary
        : (muted ? const Color(0xFFC4A09E) : AppColors.faintInk);
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Row(
        children: [
          Icon(icon, size: 17, color: color),
          const SizedBox(width: 4),
          Text(label, style: TextStyle(fontSize: 12, color: color)),
        ],
      ),
    );
  }
}
