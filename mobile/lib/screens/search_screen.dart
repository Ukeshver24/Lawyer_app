import 'package:flutter/material.dart';
import '../widgets/app_toast.dart';
import 'main_navigation_screen.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../theme/app_colors.dart';
import '../widgets/app_header.dart';
import 'search_detail_screen.dart';

class SearchScreen extends StatefulWidget {
  final VoidCallback? onBackToHome;

  const SearchScreen({super.key, this.onBackToHome});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  void _handleBack(BuildContext context) {
    if (widget.onBackToHome != null) {
      widget.onBackToHome!();
    } else {
      MainNavigationScreen.navigateToHome(context);
    }
  }

  static const List<Map<String, dynamic>> _searchOptions = [
    {
      'key': 'keyword',
      'title': 'Keyword Search',
      'desc': 'Search by legal terms, principles, or subjects',
      'icon': Icons.search_rounded,
      'hint': 'Enter keywords (e.g. Basic Structure, Article 21)...',
    },
    {
      'key': 'act',
      'title': 'Find by Act',
      'desc': 'Search by statutory Acts & provisions',
      'icon': Icons.menu_book_rounded,
      'hint': 'Enter Act or Section (e.g. NI Act, Section 138, IPC 302)...',
    },
    {
      'key': 'citation',
      'title': 'Find by Citation',
      'desc': 'Search official reporter citations (AIR, SCC, DLR)',
      'icon': Icons.description_rounded,
      'hint': 'Enter official citation (e.g. AIR 1973 SC 1461)...',
    },
    {
      'key': 'party',
      'title': 'Find by Party Name',
      'desc': 'Search by Petitioner, Appellant, or Respondent name',
      'icon': Icons.people_alt_rounded,
      'hint': 'Enter party name (e.g. Kesavananda Bharati, Maneka Gandhi)...',
    },
  ];

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final authProvider = Provider.of<AuthProvider>(context);

    // If user is NOT logged in, show direct login form
    if (!authProvider.isAuthenticated) {
      return Scaffold(
        appBar: AppHeader(
          showBackButton: true,
          backTooltip: 'Back to Home',
          onBackTap: () => _handleBack(context),
        ),
        backgroundColor: AppColors.surfaceWhite,
        body: const _SearchPortalLoginForm(),
      );
    }

    // Authenticated: Legal Research Dashboard with Side-by-Side Cards Grid
    return Scaffold(
      appBar: AppHeader(
        showBackButton: true,
        backTooltip: 'Back to Home',
        onBackTap: () => _handleBack(context),
      ),
      backgroundColor: const Color(0xFFF8FAFC),
      body: SingleChildScrollView(
        physics: const ClampingScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // 1. Dashboard Header Section (Matching Reference Design)
            const Center(
              child: Text(
                'LEGAL RESEARCH DASHBOARD',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontFamily: 'Times New Roman',
                  fontSize: 21,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.8,
                  color: Color(0xFF0F172A),
                ),
              ),
            ),
            const SizedBox(height: 6),
            const Center(
              child: Text(
                'Select a search method to begin your research',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 12.5,
                  color: Color(0xFF64748B),
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            const SizedBox(height: 22),

            // 2. Full-Width Search Methods
            Column(
              children: List.generate(_searchOptions.length, (index) {
                final opt = _searchOptions[index];
                return Padding(
                  padding: EdgeInsets.only(
                    bottom: index == _searchOptions.length - 1 ? 0 : 14,
                  ),
                  child: SizedBox(
                    width: double.infinity,
                    child: _SearchMethodGridCard(
                      title: opt['title'],
                      icon: opt['icon'],
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => SearchDetailScreen(
                              modeKey: opt['key'],
                              title: opt['title'],
                              desc: opt['desc'],
                              icon: opt['icon'],
                              hint: opt['hint'],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                );
              }),
            ),
          ],
        ),
      ),
    );
  }
}

/// Side-by-Side Royal Blue Grid Card (Clean Title & Centered Circular Icon)
class _SearchMethodGridCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final VoidCallback onTap;

  const _SearchMethodGridCard({
    required this.title,
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF2563EB),
            Color(0xFF1D4ED8),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [
          BoxShadow(
            color: Color(0x281D4ED8),
            blurRadius: 10,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          splashColor: Colors.white.withValues(alpha: 0.15),
          highlightColor: Colors.white.withValues(alpha: 0.08),
          onTap: onTap,
          child: Padding(
            padding:
                const EdgeInsets.symmetric(horizontal: 10.0, vertical: 14.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Centered Circular Icon Badge
                Container(
                  width: 46,
                  height: 46,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withValues(alpha: 0.20),
                  ),
                  child: Icon(
                    icon,
                    color: Colors.white,
                    size: 22,
                  ),
                ),
                const SizedBox(height: 12),
                // Card Title (Max 2 lines, Bold, Centered)
                Text(
                  title,
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontFamily: 'Inter',
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    height: 1.25,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Direct Login Form component for Search Portal
class _SearchPortalLoginForm extends StatefulWidget {
  const _SearchPortalLoginForm();

  @override
  State<_SearchPortalLoginForm> createState() => _SearchPortalLoginFormState();
}

class _SearchPortalLoginFormState extends State<_SearchPortalLoginForm> {
  final _formKey = GlobalKey<FormState>();
  final _mobileController = TextEditingController();
  final _mpinController = TextEditingController();

  @override
  void dispose() {
    _mobileController.dispose();
    _mpinController.dispose();
    super.dispose();
  }

  void _handleLogin() async {
    if (_formKey.currentState!.validate()) {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final success = await authProvider.loginWithMobile(
        mobile: _mobileController.text.trim(),
        mpin: _mpinController.text.trim(),
      );

      if (success && mounted) {
        AppToast.showSuccess(
          context,
          'Welcome! Search portal unlocked.',
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);

    return SingleChildScrollView(
      physics: const ClampingScrollPhysics(),
      padding: const EdgeInsets.all(24.0),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Welcome Back',
              style: TextStyle(
                fontSize: 26,
                fontWeight: FontWeight.w900,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'Sign in to access the legal search portal & case repositories.',
              style: TextStyle(fontSize: 13, color: AppColors.textMuted),
            ),
            const SizedBox(height: 28),

            if (authProvider.errorMessage != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF2F2),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFFCA5A5)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline,
                        color: AppColors.errorRed, size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        authProvider.errorMessage!,
                        style: const TextStyle(
                            fontSize: 12, color: Color(0xFF991B1B)),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            const SizedBox(height: 18),

            // 2. Mobile Number Input
            const Text(
              'Mobile Number',
              style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF334155)),
            ),
            const SizedBox(height: 6),
            TextFormField(
              controller: _mobileController,
              keyboardType: TextInputType.phone,
              validator: (val) {
                if (val == null || !RegExp(r'^\d{10}$').hasMatch(val.trim())) {
                  return 'Please enter valid 10-digit mobile number';
                }
                return null;
              },
              decoration: InputDecoration(
                hintText: 'Enter 10-digit mobile number...',
                prefixIcon: const Icon(Icons.phone_android_outlined,
                    size: 20, color: AppColors.primaryBlue),
                border:
                    OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.borderSlate),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(
                      color: AppColors.primaryBlue, width: 1.5),
                ),
              ),
            ),

            const SizedBox(height: 18),

            const Text(
              '4-digit MPIN',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: Color(0xFF334155),
              ),
            ),
            const SizedBox(height: 6),
            TextFormField(
              controller: _mpinController,
              keyboardType: TextInputType.number,
              obscureText: true,
              maxLength: 4,
              validator: (val) {
                if (val == null || !RegExp(r'^\d{4}$').hasMatch(val.trim())) {
                  return 'Please enter 4-digit MPIN';
                }
                return null;
              },
              decoration: InputDecoration(
                hintText: 'Enter 4-digit MPIN...',
                counterText: '',
                prefixIcon: const Icon(
                  Icons.lock_outline,
                  size: 20,
                  color: AppColors.primaryBlue,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(
                    color: AppColors.borderSlate,
                  ),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(
                    color: AppColors.primaryBlue,
                    width: 1.5,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 28),

            // Sign In Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: authProvider.isLoading ? null : _handleLogin,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryBlue,
                  foregroundColor: AppColors.textWhite,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
                child: authProvider.isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                            color: Colors.white, strokeWidth: 2),
                      )
                    : const Text('Sign In to Unlock Search',
                        style: TextStyle(
                            fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
