import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../app_state.dart';
import '../api.dart';
import '../theme.dart';

const _steps = [
  'Şəkil təhlil edilir',
  'Mövzu kateqoriyası təyin olunur',
  'Aidiyyəti icraçı orqan tapılır',
];

class AiAnalysisScreen extends StatefulWidget {
  const AiAnalysisScreen({super.key});
  @override
  State<AiAnalysisScreen> createState() => _AiAnalysisScreenState();
}

class _AiAnalysisScreenState extends State<AiAnalysisScreen> {
  int _progress = 0;
  int _step = 1;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(milliseconds: 150), (t) {
      setState(() {
        _progress += 5;
        if (_progress > 70) {
          _step = 3;
        } else if (_progress > 35) {
          _step = 2;
        }
      });
      if (_progress >= 100) {
        t.cancel();
        _finish();
      }
    });
  }

  Future<void> _finish() async {
    final app = context.read<AppState>();
    final reportId = app.completeAnalysis();
    app.showToast(
        'Müraciət qəbul edildi! +10 Xal balansınıza əlavə olundu.',
        ToastKind.success);

    final uid = app.userId;
    if (uid != null) {
      try {
        final result = await api.submitReport(
          imageUrl: app.draft.photo,
          description: app.draft.description,
          lat: app.draft.lat,
          lng: app.draft.lng,
          userId: uid,
        );
        if (result.isRelevant && result.issueId != null) {
          app.mapApiIssue(reportId, result.issueId!);
          if (result.joinedThread) app.adjustCoins(-5);
        }
      } catch (_) {/* fire-and-forget */}
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.surface,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 96,
                height: 96,
                decoration: const BoxDecoration(
                    color: AppColors.primary, shape: BoxShape.circle),
                child: const Icon(Icons.psychology, color: Colors.white, size: 48),
              ),
              const SizedBox(height: 24),
              Text('Məlumatlar emal olunur',
                  style: AppTheme.display(size: 20)),
              const SizedBox(height: 8),
              const Text(
                'Süni intellekt müraciətinizi yoxlayır, şəkli analiz edir və aidiyyatı qurumu təyin edir...',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant),
              ),
              const SizedBox(height: 40),
              ...List.generate(_steps.length, (i) {
                final num = i + 1;
                final done = _step > num;
                final active = _step == num;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Row(
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: done
                              ? AppColors.successBg
                              : active
                                  ? AppColors.container
                                  : AppColors.low,
                          border: Border.all(
                              color: done
                                  ? AppColors.successFg
                                  : active
                                      ? AppColors.primary
                                      : AppColors.outlineVariant,
                              width: 2),
                        ),
                        child: done
                            ? const Icon(Icons.check,
                                size: 16, color: AppColors.successFg)
                            : Text('$num',
                                style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: active
                                        ? AppColors.primary
                                        : AppColors.onSurfaceVariant)),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(_steps[i],
                                style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: active || done
                                        ? AppColors.primary
                                        : AppColors.onSurfaceVariant)),
                            if (active) ...[
                              const SizedBox(height: 8),
                              ClipRRect(
                                borderRadius: BorderRadius.circular(999),
                                child: LinearProgressIndicator(
                                  value: (_progress * 3 / 100).clamp(0, 1),
                                  minHeight: 4,
                                  backgroundColor: AppColors.highest,
                                  color: AppColors.primary,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              }),
            ],
          ),
        ),
      ),
    );
  }
}
