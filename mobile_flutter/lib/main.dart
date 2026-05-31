import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'app_state.dart';
import 'models.dart';
import 'theme.dart';
import 'widgets/shell.dart';

import 'screens/onboarding_screen.dart';
import 'screens/permissions_screen.dart';
import 'screens/feed_screen.dart';
import 'screens/camera_screen.dart';
import 'screens/create_details_screen.dart';
import 'screens/ai_analysis_screen.dart';
import 'screens/report_success_screen.dart';
import 'screens/report_detail_screen.dart';
import 'screens/my_reports_screen.dart';
import 'screens/rewards_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/messages_screen.dart';
import 'screens/message_thread_screen.dart';
import 'screens/reward_claimed_screen.dart';

void main() {
  runApp(const MyRegionApp());
}

class MyRegionApp extends StatelessWidget {
  const MyRegionApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AppState(),
      child: MaterialApp(
        title: 'myRegion',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.build(),
        home: const RootView(),
      ),
    );
  }
}

const _shellScreens = {
  Screen.feed,
  Screen.myReports,
  Screen.rewards,
  Screen.profile,
};

class RootView extends StatelessWidget {
  const RootView({super.key});

  Widget _screenBody(Screen screen) {
    switch (screen) {
      case Screen.feed:
        return const FeedScreen();
      case Screen.myReports:
        return const MyReportsScreen();
      case Screen.rewards:
        return const RewardsScreen();
      case Screen.profile:
        return const ProfileScreen();
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _fullScreen(Screen screen) {
    switch (screen) {
      case Screen.onboarding:
        return const OnboardingScreen();
      case Screen.permissions:
        return const PermissionsScreen();
      case Screen.camera:
        return const CameraScreen();
      case Screen.createDetails:
        return const CreateDetailsScreen();
      case Screen.aiAnalysis:
        return const AiAnalysisScreen();
      case Screen.reportSuccess:
        return const ReportSuccessScreen();
      case Screen.reportDetail:
        return const ReportDetailScreen();
      case Screen.rewardClaimed:
        return const RewardClaimedScreen();
      case Screen.messages:
        return const MessagesScreen();
      case Screen.messageThread:
        return const MessageThreadScreen();
      default:
        return const SizedBox.shrink();
    }
  }

  @override
  Widget build(BuildContext context) {
    final screen = context.select<AppState, Screen>((s) => s.screen);
    final isShell = _shellScreens.contains(screen);

    final Widget content = isShell
        ? Scaffold(
            backgroundColor: AppColors.surface,
            appBar: const ShellHeader(),
            body: SafeArea(top: false, bottom: false, child: _screenBody(screen)),
            bottomNavigationBar: const ShellBottomNav(),
          )
        : _fullScreen(screen);

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: Stack(
        children: [
          Positioned.fill(child: content),
          const ToastOverlay(),
        ],
      ),
    );
  }
}
