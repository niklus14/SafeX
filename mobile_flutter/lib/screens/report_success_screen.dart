import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../app_state.dart';
import '../models.dart';
import '../theme.dart';

class ReportSuccessScreen extends StatelessWidget {
  const ReportSuccessScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final draft = app.draft;

    return Container(
      color: AppColors.surface,
      child: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(24, 48, 24, 0),
                children: [
                  Center(
                    child: Container(
                      width: 80,
                      height: 80,
                      decoration: const BoxDecoration(
                          color: AppColors.successBg, shape: BoxShape.circle),
                      child: const Icon(Icons.check_circle,
                          color: AppColors.successFg, size: 48),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text('Müraciətiniz qəbul edildi!',
                      textAlign: TextAlign.center,
                      style: AppTheme.display(size: 24)),
                  const SizedBox(height: 8),
                  const Text(
                    'Bakı şəhərinin abadlaşdırılmasına verdiyiniz töhfə üçün təşəkkür edirik.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        fontSize: 14, color: AppColors.onSurfaceVariant),
                  ),
                  const SizedBox(height: 24),
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(
                          color: AppColors.outlineVariant.withOpacity(0.2)),
                    ),
                    child: Column(
                      children: [
                        Row(
                          children: const [
                            Icon(Icons.assignment_outlined,
                                size: 16, color: AppColors.primary),
                            SizedBox(width: 8),
                            Text('Müraciət xülasəsi',
                                style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.primary)),
                          ],
                        ),
                        const SizedBox(height: 16),
                        _row('Kateqoriya', draft.type),
                        const Divider(height: 24),
                        _rowWidget('Ciddilik statusu',
                            _pill('Orta', AppColors.high, AppColors.primary)),
                        const Divider(height: 24),
                        _row(
                            'Aidiyyatı qurum',
                            draft.type.contains('Yol')
                                ? 'Bakı Şəhər İcra Hakimiyyəti'
                                : 'Abadlıq şöbəsi'),
                        const Divider(height: 24),
                        _rowWidget(
                          'Proqnoz həll tarixi',
                          const Row(children: [
                            Icon(Icons.calendar_today,
                                size: 14, color: AppColors.primary),
                            SizedBox(width: 4),
                            Text('5 gün ərzində',
                                style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.primary,
                                    fontSize: 12)),
                          ]),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: () => app.navigate(app.justCreatedId != null
                          ? Screen.reportDetail
                          : Screen.feed),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(999)),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text('Müraciətə bax',
                              style: TextStyle(fontWeight: FontWeight.bold)),
                          SizedBox(width: 8),
                          Icon(Icons.arrow_forward, size: 16),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: OutlinedButton(
                      onPressed: () => app.navigate(Screen.feed),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.onSurfaceVariant,
                        side: const BorderSide(
                            color: AppColors.outlineVariant, width: 2),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(999)),
                      ),
                      child: const Text('Bağla',
                          style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _row(String k, String v) => Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(k,
              style: const TextStyle(
                  fontSize: 12, color: AppColors.onSurfaceVariant)),
          const SizedBox(width: 16),
          Expanded(
            child: Text(v,
                textAlign: TextAlign.right,
                style: const TextStyle(
                    fontSize: 14, fontWeight: FontWeight.bold)),
          ),
        ],
      );

  Widget _rowWidget(String k, Widget v) => Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(k,
              style: const TextStyle(
                  fontSize: 12, color: AppColors.onSurfaceVariant)),
          v,
        ],
      );

  Widget _pill(String t, Color bg, Color fg) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        decoration:
            BoxDecoration(color: bg, borderRadius: BorderRadius.circular(999)),
        child: Text(t,
            style: TextStyle(
                fontSize: 12, fontWeight: FontWeight.bold, color: fg)),
      );
}
