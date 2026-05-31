import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../app_state.dart';
import '../models.dart';
import '../theme.dart';
import '../widgets/common.dart';

class MyReportsScreen extends StatelessWidget {
  const MyReportsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final mine = app.reports.where((r) => r.isOwn).toList();
    final active = mine
        .where((r) => r.status == 'İCRADADIR' || r.status == 'GÖZLƏYİR')
        .length;
    final solved = mine.where((r) => r.status == 'HƏLL EDİLDİ').length;

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      children: [
        Text('Müraciətlərim', style: AppTheme.display(size: 20)),
        const SizedBox(height: 2),
        const Text(
          'Sizin tərəfinizdən göndərilmiş və ya dəstəklənmiş bütün müraciətlər',
          style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppColors.onSurfaceVariant),
        ),
        const SizedBox(height: 20),
        Row(
          children: [
            _stat('${mine.length}', 'Cəm', AppColors.ink, Colors.white),
            const SizedBox(width: 10),
            _stat('$active', 'Aktiv', AppColors.primary, AppColors.low),
            const SizedBox(width: 10),
            _stat('$solved', 'Həll edilib', AppColors.successFg,
                AppColors.successBg),
          ],
        ),
        const SizedBox(height: 20),
        if (mine.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 64),
            child: Column(
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: const BoxDecoration(
                      color: AppColors.low, shape: BoxShape.circle),
                  child: Icon(Icons.location_on,
                      size: 22, color: AppColors.primary.withOpacity(0.4)),
                ),
                const SizedBox(height: 12),
                const Text('Hələ müraciətiniz yoxdur',
                    style:
                        TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                const Text('Lentdən problem bildirin.',
                    style: TextStyle(fontSize: 12, color: AppColors.faintInk)),
              ],
            ),
          )
        else
          ...mine.map((r) => _card(context, app, r)),
      ],
    );
  }

  Widget _stat(String value, String label, Color fg, Color bg) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.outlineVariant.withOpacity(0.2)),
        ),
        child: Column(
          children: [
            Text(value,
                style: TextStyle(
                    fontSize: 18, fontWeight: FontWeight.w800, color: fg)),
            const SizedBox(height: 2),
            Text(label.toUpperCase(),
                style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.5,
                    color: fg)),
          ],
        ),
      ),
    );
  }

  Widget _card(BuildContext context, AppState app, Report r) {
    final status = StatusStyle.of(r.status);
    return GestureDetector(
      onTap: () {
        app.selectReport(r.id, view: 'thread');
        app.navigate(Screen.reportDetail);
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.outlineVariant.withOpacity(0.2)),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                AspectRatio(
                    aspectRatio: 16 / 7, child: AppImage(r.imageUrl)),
                Positioned(
                  top: 10,
                  left: 12,
                  child: Pill(status.label.toUpperCase(),
                      bg: status.bg, fg: status.fg, fontSize: 10),
                ),
                Positioned(
                  bottom: 10,
                  right: 12,
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.5),
                        borderRadius: BorderRadius.circular(8)),
                    child: Row(
                      children: [
                        const Icon(Icons.keyboard_arrow_up,
                            size: 12, color: Colors.white),
                        Text('${r.reactionsCount}',
                            style: const TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Pill(r.category,
                          bg: AppColors.low, fg: AppColors.primary, fontSize: 10),
                      Text(r.date,
                          style: const TextStyle(
                              fontSize: 10, color: AppColors.faintInk)),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(r.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: AppColors.ink)),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Icon(Icons.location_on,
                          size: 11, color: AppColors.primary.withOpacity(0.6)),
                      const SizedBox(width: 6),
                      Expanded(
                          child: Text(r.location,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                  fontSize: 11, color: AppColors.mutedInk))),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
