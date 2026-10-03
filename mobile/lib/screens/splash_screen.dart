import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/search_provider.dart';
import 'main_navigation_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initializeApp();
    });
  }

  Future<void> _initializeApp() async {
    final searchProvider = Provider.of<SearchProvider>(context, listen: false);
    
    // Initial data fetch & minimum 1.5s delay for smooth brand logo display
    await Future.wait([
      searchProvider.performSearch(),
      Future.delayed(const Duration(milliseconds: 1600)),
    ]);

    if (mounted) {
      Navigator.pushReplacement(
        context,
        PageRouteBuilder(
          pageBuilder: (context, animation, secondaryAnimation) => const MainNavigationScreen(),
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            return FadeTransition(opacity: animation, child: child);
          },
          transitionDuration: const Duration(milliseconds: 350),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white, // Clean Light Theme Splash Screen
      body: SafeArea(
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Spacer(),

              // 1. Official Logo Image / Badge
              Image.asset(
                'assets/logo.png',
                height: 96,
                errorBuilder: (context, error, stackTrace) {
                  return Container(
                    width: 88,
                    height: 88,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF2563EB), Color(0xFF1D4ED8)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x332563EB),
                          blurRadius: 28,
                          offset: Offset(0, 10),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.balance_rounded,
                      color: Colors.white,
                      size: 48,
                    ),
                  );
                },
              ),
              const SizedBox(height: 24),

              // 2. Official Brand Name: "Digi Law Reporter"
              RichText(
                textAlign: TextAlign.center,
                text: const TextSpan(
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.5,
                  ),
                  children: [
                    TextSpan(
                      text: 'Digi Law ',
                      style: TextStyle(color: Color(0xFF0F172A)), // Crisp Slate 950
                    ),
                    TextSpan(
                      text: 'Reporter',
                      style: TextStyle(color: Color(0xFF2563EB)), // Royal Brand Blue
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'AUTHENTIC JUDICIAL DATABASE & PRECEDENTS',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.5,
                  color: Color(0xFF64748B),
                ),
              ),

              const Spacer(),

              // 3. Smooth Loading Indicator at bottom
              const Padding(
                padding: EdgeInsets.only(bottom: 40.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF2563EB)),
                        strokeWidth: 2.5,
                      ),
                    ),
                    SizedBox(height: 12),
                    Text(
                      'Loading verified judgments...',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFF94A3B8),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
