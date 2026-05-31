import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../app_state.dart';
import '../models.dart';
import '../theme.dart';

class _Msg {
  final String text;
  final String time;
  final bool isOwn;
  _Msg(this.text, this.time, this.isOwn);
}

class _ThreadData {
  final String org;
  final String hotline;
  final String? number;
  final List<_Msg> messages;
  _ThreadData(this.org, this.hotline, this.number, this.messages);
}

Map<String, _ThreadData> _threadData() => {
      'azarsu': _ThreadData('Azərsu əməkdaşı', '955', '955', [
        _Msg('Salam, müraciətiniz üzrə əlavə məlumata ehtiyac var.', '14:30', false),
        _Msg('Zəhmət olmasa yaxın plandan əlavə şəkil və dəqiq konum göndərin.',
            '14:32', false),
        _Msg('Əlavə məlumatı göndərirəm.', '14:35', true),
      ]),
      'azerisiq': _ThreadData('Azərişıq əməkdaşı', '199', '199', [
        _Msg('Salam, işıqlandırma müraciətiniz qəbul olunub.', '15:05', false),
        _Msg('Zəhmət olmasa dəqiq konumu göndərin.', '15:07', false),
      ]),
      'rih': _ThreadData('Nərimanov RİH operatoru', 'Qaynar xətt', null, [
        _Msg('Müraciətiniz operator tərəfindən yoxlanıldı.', 'Dünən', false),
        _Msg('Məlumat aidiyyəti quruma yönləndirildi.', 'Dünən', false),
      ]),
    };

class MessageThreadScreen extends StatefulWidget {
  const MessageThreadScreen({super.key});
  @override
  State<MessageThreadScreen> createState() => _MessageThreadScreenState();
}

class _MessageThreadScreenState extends State<MessageThreadScreen> {
  late _ThreadData _thread;
  late List<_Msg> _messages;
  final _ctrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    final app = context.read<AppState>();
    final data = _threadData();
    _thread = data[app.messageThread] ?? data['azarsu']!;
    _messages = [..._thread.messages];
  }

  void _send() {
    final text = _ctrl.text.trim();
    if (text.isEmpty) return;
    final now = TimeOfDay.now();
    setState(() {
      _messages.add(_Msg(text,
          '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}',
          true));
      _ctrl.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    final app = context.read<AppState>();
    return Container(
      color: AppColors.surface,
      child: SafeArea(
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              color: Colors.white.withOpacity(0.9),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => app.navigate(Screen.messages),
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: const BoxDecoration(
                          color: AppColors.low, shape: BoxShape.circle),
                      child: const Icon(Icons.arrow_back,
                          color: AppColors.primary, size: 20),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(_thread.org,
                            overflow: TextOverflow.ellipsis,
                            style: AppTheme.display(size: 16)),
                        Text(_thread.hotline,
                            style: const TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                color: AppColors.primary)),
                      ],
                    ),
                  ),
                  ElevatedButton.icon(
                    onPressed: _thread.number != null
                        ? () => launchUrl(Uri.parse('tel:${_thread.number}'))
                        : null,
                    icon: const Icon(Icons.phone, size: 15),
                    label: Text(_thread.number != null ? 'Zəng et' : 'Nömrə yoxdur',
                        style: const TextStyle(
                            fontSize: 11, fontWeight: FontWeight.w800)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      disabledBackgroundColor: AppColors.low,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(999)),
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(20),
                children: _messages
                    .map((m) => Align(
                          alignment: m.isOwn
                              ? Alignment.centerRight
                              : Alignment.centerLeft,
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 12),
                            constraints: BoxConstraints(
                                maxWidth: MediaQuery.of(context).size.width * 0.78),
                            decoration: BoxDecoration(
                              color: m.isOwn ? AppColors.primary : Colors.white,
                              borderRadius: BorderRadius.only(
                                topLeft: const Radius.circular(24),
                                topRight: const Radius.circular(24),
                                bottomLeft: Radius.circular(m.isOwn ? 24 : 6),
                                bottomRight: Radius.circular(m.isOwn ? 6 : 24),
                              ),
                              border: m.isOwn
                                  ? null
                                  : Border.all(
                                      color: AppColors.outlineVariant
                                          .withOpacity(0.2)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(m.text,
                                    style: TextStyle(
                                        fontSize: 14,
                                        height: 1.4,
                                        color: m.isOwn
                                            ? Colors.white
                                            : AppColors.onSurface)),
                                const SizedBox(height: 4),
                                Text(m.time,
                                    style: TextStyle(
                                        fontSize: 10,
                                        color: m.isOwn
                                            ? Colors.white70
                                            : AppColors.onSurfaceVariant
                                                .withOpacity(0.6))),
                              ],
                            ),
                          ),
                        ))
                    .toList(),
              ),
            ),
            // Input
            Container(
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
              child: SafeArea(
                top: false,
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _ctrl,
                        onSubmitted: (_) => _send(),
                        decoration: InputDecoration(
                          hintText: 'Mesaj yazın...',
                          isDense: true,
                          contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 12),
                          border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(999),
                              borderSide: const BorderSide(
                                  color: AppColors.outlineVariant)),
                          enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(999),
                              borderSide: const BorderSide(
                                  color: AppColors.outlineVariant)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    GestureDetector(
                      onTap: _send,
                      child: Container(
                        width: 48,
                        height: 48,
                        decoration: const BoxDecoration(
                            color: AppColors.primary, shape: BoxShape.circle),
                        child: const Icon(Icons.send, color: Colors.white),
                      ),
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
}
