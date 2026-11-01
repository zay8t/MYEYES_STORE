import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../theme.dart';
import '../../models/product.dart';
import '../../providers/catalog_provider.dart';
import '../../services/api_service.dart';
import '../product_detail/product_detail_screen.dart';

class ChatMessage {
  final String id;
  final bool isUser;
  final String text;
  final List<String> productIds;
  final DateTime timestamp;

  ChatMessage({
    required this.id,
    required this.isUser,
    required this.text,
    this.productIds = const [],
    required this.timestamp,
  });
}

class MyEyesAiScreen extends StatefulWidget {
  const MyEyesAiScreen({super.key});

  @override
  State<MyEyesAiScreen> createState() => _MyEyesAiScreenState();
}

class _MyEyesAiScreenState extends State<MyEyesAiScreen> {
  final TextEditingController _inputController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _isLoading = false;

  final List<ChatMessage> _messages = [];
  List<String> _suggestedQuestions = [
    'What glasses suit a round face?',
    'Which lenses are best for screen use?',
    'What frames are best for high power?',
    'How does delivery work in Pakistan?',
  ];

  @override
  void initState() {
    super.initState();
    _messages.add(
      ChatMessage(
        id: 'init-0',
        isUser: false,
        text: "Hi! I'm here to help you find the right glasses.\n\nAsk me anything — face shapes, lenses, delivery, or just what looks good on you.",
        timestamp: DateTime.now(),
      ),
    );
  }

  @override
  void dispose() {
    _inputController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage(String query) async {
    final text = query.trim();
    if (text.isEmpty || _isLoading) return;

    _inputController.clear();

    final userMsg = ChatMessage(
      id: 'usr-${DateTime.now().millisecondsSinceEpoch}',
      isUser: true,
      text: text,
      timestamp: DateTime.now(),
    );

    setState(() {
      _messages.add(userMsg);
      _isLoading = true;
    });
    _scrollToBottom();

    final history = _messages
        .take(6)
        .map((m) => {
              'role': m.isUser ? 'user' : 'assistant',
              'content': m.text,
            })
        .toList();

    final catalog = context.read<CatalogProvider>().allProducts;

    final response = await ApiService.askAiStylist(
      message: text,
      history: history,
      catalog: catalog,
    );

    final aiMsg = ChatMessage(
      id: 'ai-${DateTime.now().millisecondsSinceEpoch}',
      isUser: false,
      text: response.reply,
      productIds: response.productIds,
      timestamp: DateTime.now(),
    );

    setState(() {
      _messages.add(aiMsg);
      if (response.suggestedQuestions.isNotEmpty) {
        _suggestedQuestions = response.suggestedQuestions;
      }
      _isLoading = false;
    });
    _scrollToBottom();
  }

  @override
  Widget build(BuildContext context) {
    final catalog = context.watch<CatalogProvider>();

    return Scaffold(
      backgroundColor: AppColors.slate50,
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(LucideIcons.sparkles, color: Colors.white, size: 16),
            ),
            const SizedBox(width: 10),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Ask MY EYES',
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: AppColors.slate900),
                ),
                Text(
                  'Online · Style & Lens Help',
                  style: TextStyle(fontSize: 10, color: AppColors.success, fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.phoneCall, size: 18, color: AppColors.primary),
            tooltip: 'Chat on WhatsApp',
            onPressed: () async {
              final uri = Uri.parse('https://wa.me/923390103262?text=Hello%20MY%20EYES%2C%20I%20need%20help%20choosing%20glasses.');
              if (await canLaunchUrl(uri)) {
                await launchUrl(uri, mode: LaunchMode.externalApplication);
              }
            },
          ),
          IconButton(
            icon: const Icon(LucideIcons.rotateCcw, size: 18, color: AppColors.slate500),
            tooltip: 'New Chat',
            onPressed: () {
              setState(() {
                _messages.clear();
                _messages.add(
                  ChatMessage(
                    id: 'init-0',
                    isUser: false,
                    text: "Hi! How can I help you find your next pair of glasses?",
                    timestamp: DateTime.now(),
                  ),
                );
              });
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final message = _messages[index];
                return _buildMessageItem(message, catalog.allProducts);
              },
            ),
          ),

          if (_isLoading)
            Padding(
              padding: const EdgeInsets.only(left: 16, bottom: 8),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.slate200),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        SizedBox(
                          width: 12,
                          height: 12,
                          child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                        ),
                        SizedBox(width: 8),
                        Text(
                          'Looking up the best options...',
                          style: TextStyle(fontSize: 11, color: AppColors.slate500),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

          if (!_isLoading && _suggestedQuestions.isNotEmpty)
            Container(
              height: 42,
              margin: const EdgeInsets.only(bottom: 6),
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                scrollDirection: Axis.horizontal,
                itemCount: _suggestedQuestions.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, index) {
                  final q = _suggestedQuestions[index];
                  return ActionChip(
                    label: Text(q, style: const TextStyle(fontSize: 11, color: AppColors.slate700)),
                    backgroundColor: Colors.white,
                    side: const BorderSide(color: AppColors.slate200),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    onPressed: () => _sendMessage(q),
                  );
                },
              ),
            ),

          Container(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: AppColors.slate200)),
            ),
            child: SafeArea(
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _inputController,
                      textInputAction: TextInputAction.send,
                      onSubmitted: _sendMessage,
                      decoration: InputDecoration(
                        hintText: 'Ask about frames, lenses, or delivery...',
                        hintStyle: const TextStyle(fontSize: 13, color: AppColors.slate400),
                        filled: true,
                        fillColor: AppColors.slate50,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: const BorderSide(color: AppColors.slate200),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: const BorderSide(color: AppColors.slate200),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    decoration: const BoxDecoration(
                      color: AppColors.primary,
                      shape: BoxShape.circle,
                    ),
                    child: IconButton(
                      icon: const Icon(LucideIcons.send, color: Colors.white, size: 18),
                      onPressed: () => _sendMessage(_inputController.text),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageItem(ChatMessage message, List<Product> catalog) {
    if (message.isUser) {
      return Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.end,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Container(
              constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: AppColors.slate900,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(18),
                  topRight: Radius.circular(18),
                  bottomLeft: Radius.circular(18),
                  bottomRight: Radius.circular(4),
                ),
              ),
              child: Text(
                message.text,
                style: const TextStyle(color: Colors.white, fontSize: 13, height: 1.35),
              ),
            ),
            const SizedBox(width: 8),
            const CircleAvatar(
              radius: 14,
              backgroundColor: AppColors.slate200,
              child: Icon(LucideIcons.user, size: 14, color: AppColors.slate700),
            ),
          ],
        ),
      );
    } else {
      final matchedProducts = catalog.where((p) => message.productIds.contains(p.id)).toList();

      return Padding(
        padding: const EdgeInsets.only(bottom: 16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: const BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
              ),
              child: const Icon(LucideIcons.sparkles, size: 14, color: Colors.white),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(4),
                        topRight: Radius.circular(18),
                        bottomLeft: Radius.circular(18),
                        bottomRight: Radius.circular(18),
                      ),
                      border: Border.all(color: AppColors.slate200),
                    ),
                    child: _buildRichText(message.text),
                  ),

                  if (matchedProducts.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    const Text(
                      'Matching Frames:',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.slate500),
                    ),
                    const SizedBox(height: 6),
                    SizedBox(
                      height: 160,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: matchedProducts.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 10),
                        itemBuilder: (context, idx) {
                          final product = matchedProducts[idx];
                          return Container(
                            width: 135,
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppColors.slate200),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(8),
                                  child: CachedNetworkImage(
                                    imageUrl: product.firstImage,
                                    height: 70,
                                    width: double.infinity,
                                    fit: BoxFit.cover,
                                    errorWidget: (_, __, ___) => Container(height: 70, color: AppColors.slate100),
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  product.name,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: AppColors.slate900),
                                ),
                                Text(
                                  product.formattedPrice,
                                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 11, color: AppColors.primary),
                                ),
                                const Spacer(),
                                SizedBox(
                                  width: double.infinity,
                                  child: ElevatedButton(
                                    style: ElevatedButton.styleFrom(
                                      padding: EdgeInsets.zero,
                                      minimumSize: const Size(0, 26),
                                      backgroundColor: AppColors.slate900,
                                      foregroundColor: Colors.white,
                                    ),
                                    onPressed: () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (_) => ProductDetailScreen(product: product),
                                        ),
                                      );
                                    },
                                    child: const Text('View', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      );
    }
  }

  Widget _buildRichText(String text) {
    final lines = text.split('\n');
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: lines.map((line) {
        final trimmed = line.trim();
        if (trimmed.isEmpty) return const SizedBox(height: 6);

        final spans = <InlineSpan>[];
        final parts = trimmed.split('**');
        for (int i = 0; i < parts.length; i++) {
          if (i % 2 == 1) {
            spans.add(TextSpan(
              text: parts[i],
              style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.slate900),
            ));
          } else {
            spans.add(TextSpan(
              text: parts[i],
              style: const TextStyle(color: AppColors.slate700),
            ));
          }
        }

        return Padding(
          padding: const EdgeInsets.only(bottom: 2),
          child: RichText(
            text: TextSpan(
              style: const TextStyle(fontSize: 13, height: 1.4),
              children: spans,
            ),
          ),
        );
      }).toList(),
    );
  }
}
