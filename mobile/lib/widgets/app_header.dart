import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../screens/login_screen.dart';
import '../screens/main_navigation_screen.dart';

class AppHeader extends StatelessWidget implements PreferredSizeWidget {
  final bool showBackButton;
  final VoidCallback? onBackTap;
  final String? backTooltip;
  final VoidCallback? onNotificationTap;
  final List<Widget>? customActions;

  const AppHeader({
    super.key,
    this.showBackButton = false,
    this.onBackTap,
    this.backTooltip,
    this.onNotificationTap,
    this.customActions,
  });

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final isLoggedIn = authProvider.isAuthenticated;
    return AppBar(
      backgroundColor: Colors.white,
      elevation: 0,
      scrolledUnderElevation: 0.5,
      surfaceTintColor: Colors.transparent,
      automaticallyImplyLeading: false,
      leadingWidth: showBackButton ? 48 : 52,
      leading: showBackButton
          ? Padding(
              padding: const EdgeInsets.only(left: 6.0),
              child: Material(
                color: Colors.transparent,
                shape: const CircleBorder(),
                clipBehavior: Clip.antiAlias,
                child: InkWell(
                  onTap: () {
                    FocusManager.instance.primaryFocus?.unfocus();
                    if (onBackTap != null) {
                      onBackTap!();
                    } else if (Navigator.canPop(context)) {
                      Navigator.pop(context);
                    }
                  },
                  child: const Center(
                    child: Icon(
                      Icons.arrow_back_rounded,
                      color: Color(0xFF0F172A),
                      size: 22,
                    ),
                  ),
                ),
              ),
            )
          : Padding(
              padding: const EdgeInsets.only(left: 16.0),
              child: Center(
                child: Container(
                  width: 34,
                  height: 34,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFDBEAFE)),
                  ),
                  child: const Icon(Icons.balance_rounded,
                      color: Color(0xFF1D4ED8), size: 18),
                ),
              ),
            ),
      titleSpacing: showBackButton ? 0 : 8,
      title: RichText(
        text: const TextSpan(
          style: TextStyle(
            fontFamily: 'Inter',
            fontSize: 16.5,
            fontWeight: FontWeight.w800,
            letterSpacing: -0.3,
          ),
          children: [
            TextSpan(
                text: 'Digi Law ', style: TextStyle(color: Color(0xFF0F172A))),
            TextSpan(
                text: 'Reporter', style: TextStyle(color: Color(0xFF1D4ED8))),
          ],
        ),
      ),
      bottom: const PreferredSize(
        preferredSize: Size.fromHeight(1.0),
        child: Divider(height: 1, thickness: 1, color: Color(0xFFF1F5F9)),
      ),
      actions: customActions ??
          [
            Padding(
              padding: const EdgeInsets.only(right: 12.0),
              child: Center(
                child: !isLoggedIn
                    ? InkWell(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => const LoginScreen(),
                            ),
                          );
                        },
                        borderRadius: BorderRadius.circular(10),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFF2563EB), Color(0xFF1D4ED8)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(10),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF2563EB)
                                    .withValues(alpha: 0.28),
                                blurRadius: 6,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.login_rounded,
                                  size: 13, color: Colors.white),
                              SizedBox(width: 4),
                              Text(
                                'Login',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white,
                                  letterSpacing: -0.1,
                                ),
                              ),
                            ],
                          ),
                        ),
                      )
                    : InkWell(
                        onTap: () {
                          MainNavigationScreen.setTab(context, 3);
                        },
                        borderRadius: BorderRadius.circular(10),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEFF6FF),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: const Color(0xFFDBEAFE)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 20,
                                height: 20,
                                decoration: const BoxDecoration(
                                  color: Color(0xFF2563EB),
                                  shape: BoxShape.circle,
                                ),
                                child: Center(
                                  child: Text(
                                    authProvider.userName.isNotEmpty
                                        ? authProvider.userName[0].toUpperCase()
                                        : 'U',
                                    style: const TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w800,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 5),
                              Text(
                                authProvider.userName.isNotEmpty
                                    ? authProvider.userName.split(' ').first
                                    : 'Profile',
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFF1D4ED8),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
              ),
            ),
          ],
    );
  }
}
