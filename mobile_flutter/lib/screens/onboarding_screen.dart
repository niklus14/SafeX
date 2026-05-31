import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../app_state.dart';
import '../models.dart';
import '../theme.dart';
import '../widgets/common.dart';

class _Slide {
  final String title;
  final String image;
  const _Slide(this.title, this.image);
}

const _slides = [
  _Slide('Problemi gör, şəkil çək',
      'https://picsum.photos/seed/onb1/400/400'),
  _Slide('Süni intellektlə təyin et, birlikdə həll edək',
      'https://picsum.photos/seed/onb2/400/400'),
];

class OnboardingScreen extends StatelessWidget {
  const OnboardingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final i = app.carouselIndex.clamp(0, _slides.length - 1);
    final slide = _slides[i];

    void next() {
      if (app.carouselIndex < _slides.length - 1) {
        app.setCarousel(app.carouselIndex + 1);
      } else {
        app.navigate(Screen.permissions);
      }
    }

    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFBD0E21), AppColors.primary],
        ),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.location_on, color: Colors.white, size: 28),
                  const SizedBox(width: 8),
                  Text('myRegion',
                      style: AppTheme.display(
                          size: 24, color: Colors.white, weight: FontWeight.w800)),
                ],
              ),
              Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 256,
                      height: 256,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.1),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white.withOpacity(0.2)),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: AppImage(slide.image, fit: BoxFit.cover),
                      ),
                    ),
                    const SizedBox(height: 32),
                    Text(slide.title,
                        textAlign: TextAlign.center,
                        style: AppTheme.display(
                            size: 24, color: Colors.white, weight: FontWeight.w800)),
                  ],
                ),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(_slides.length, (k) {
                  final active = k == i;
                  return GestureDetector(
                    onTap: () => app.setCarousel(k),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      width: active ? 24 : 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: active ? Colors.white : Colors.white.withOpacity(0.3),
                        borderRadius: BorderRadius.circular(999),
                      ),
                    ),
                  );
                }),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: next,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(999)),
                  ),
                  child: const Text('Davam et',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}
