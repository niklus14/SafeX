import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../app_state.dart';
import '../geolocate.dart';
import '../models.dart';
import '../theme.dart';
import '../widgets/common.dart';

const _categories = [
  'Yol Təmiri',
  'Fontan Təmiri',
  'Sanitariya və Təmizlik',
  'Qəzalı İşıq'
];

class CreateDetailsScreen extends StatefulWidget {
  const CreateDetailsScreen({super.key});
  @override
  State<CreateDetailsScreen> createState() => _CreateDetailsScreenState();
}

class _CreateDetailsScreenState extends State<CreateDetailsScreen> {
  final _descCtrl = TextEditingController();
  final _locCtrl = TextEditingController();
  bool _locating = false;

  @override
  void initState() {
    super.initState();
    final app = context.read<AppState>();
    _descCtrl.text = app.draft.description;
    _locCtrl.text = app.draft.location;
    if (!app.draft.isLocationCustom) _fetchLocation();
  }

  Future<void> _fetchLocation() async {
    setState(() => _locating = true);
    try {
      final loc = await resolveLocation();
      if (!mounted) return;
      context.read<AppState>().patchDraft(
          lat: loc.lat, lng: loc.lng, location: loc.location, isLocationCustom: false);
    } catch (_) {/* keep */} finally {
      if (mounted) setState(() => _locating = false);
    }
  }

  void _toggleMode() {
    final app = context.read<AppState>();
    if (app.draft.isLocationCustom) {
      app.patchDraft(isLocationCustom: false);
      _fetchLocation();
    } else {
      app.patchDraft(isLocationCustom: true, location: '');
      _locCtrl.text = '';
    }
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final draft = app.draft;

    return Container(
      color: AppColors.surface,
      child: SafeArea(
        child: Column(
          children: [
            // Header
            Container(
              height: 64,
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  IconButton(
                    onPressed: () => app.navigate(Screen.camera),
                    icon: const Icon(Icons.arrow_back, color: AppColors.primary),
                  ),
                  const SizedBox(width: 8),
                  Text('Detallar',
                      style: AppTheme.display(
                          size: 20, color: AppColors.primary)),
                  const Spacer(),
                  Pill('Yeni Müraciət',
                      bg: AppColors.container, fg: AppColors.primary, fontSize: 11),
                ],
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(24),
                children: [
                  _label('Çəkilmiş şəkil'),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: AspectRatio(
                        aspectRatio: 16 / 9, child: AppImage(draft.photo)),
                  ),
                  const SizedBox(height: 24),
                  _label('Müəyyən edilmiş mövzu növü'),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _categories.map((cat) {
                      final active = draft.type == cat;
                      return GestureDetector(
                        onTap: () => app.patchDraft(type: cat),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 8),
                          decoration: BoxDecoration(
                            color: active ? AppColors.primary : Colors.white,
                            borderRadius: BorderRadius.circular(999),
                            border: Border.all(
                                color: active
                                    ? AppColors.primary
                                    : AppColors.outlineVariant),
                          ),
                          child: Text(cat,
                              style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: active
                                      ? Colors.white
                                      : AppColors.onSurfaceVariant)),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 24),
                  _label('Problemi qısaca təsvir edin…'),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _descCtrl,
                    maxLines: 4,
                    onChanged: (v) => app.patchDraft(description: v),
                    decoration: InputDecoration(
                      hintText:
                          'Məsələn: Fontanın su axını tənzimlənməlidir...',
                      filled: true,
                      fillColor: Colors.white,
                      contentPadding: const EdgeInsets.all(16),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: const BorderSide(color: AppColors.outlineVariant),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: const BorderSide(color: AppColors.outlineVariant),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _label('Ünvan'),
                      GestureDetector(
                        onTap: _toggleMode,
                        child: Text(
                            draft.isLocationCustom
                                ? 'Avtomatikə keç'
                                : 'Yeri dəqiqləşdir',
                            style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: AppColors.primary)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  if (draft.isLocationCustom)
                    TextField(
                      controller: _locCtrl,
                      onChanged: (v) => app.patchDraft(location: v),
                      decoration: InputDecoration(
                        hintText: 'Ünvanı daxil edin',
                        filled: true,
                        fillColor: Colors.white,
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 12),
                        border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide:
                                const BorderSide(color: AppColors.outlineVariant)),
                      ),
                    )
                  else
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.low,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                            color: AppColors.outlineVariant.withOpacity(0.3)),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                                color: AppColors.primary.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(12)),
                            child: const Icon(Icons.location_on,
                                color: AppColors.primary),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('CARİ MƏKAN',
                                    style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                        letterSpacing: 0.5,
                                        color: AppColors.onSurfaceVariant)),
                                const SizedBox(height: 4),
                                if (_locating)
                                  const Row(children: [
                                    SizedBox(
                                        width: 13,
                                        height: 13,
                                        child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            color: AppColors.primary)),
                                    SizedBox(width: 6),
                                    Text('Məkan təyin olunur…',
                                        style: TextStyle(
                                            fontSize: 13,
                                            color: AppColors.onSurfaceVariant)),
                                  ])
                                else ...[
                                  Text(draft.location,
                                      style: const TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.bold)),
                                  const SizedBox(height: 4),
                                  const Row(children: [
                                    Icon(Icons.check,
                                        size: 12, color: AppColors.primary),
                                    SizedBox(width: 4),
                                    Text('GPS vasitəsilə təyin olundu',
                                        style: TextStyle(
                                            fontSize: 10,
                                            fontWeight: FontWeight.w600,
                                            color: AppColors.primary)),
                                  ]),
                                ],
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  const SizedBox(height: 24),
                  SizedBox(
                    height: 56,
                    child: ElevatedButton(
                      onPressed: () => app.navigate(Screen.aiAnalysis),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(999)),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text('Göndər',
                              style: TextStyle(fontWeight: FontWeight.bold)),
                          SizedBox(width: 8),
                          Icon(Icons.send, size: 16),
                        ],
                      ),
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

  Widget _label(String t) => Text(t.toUpperCase(),
      style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.5,
          color: AppColors.onSurfaceVariant));
}
