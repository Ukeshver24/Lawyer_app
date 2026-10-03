import 'package:flutter/material.dart';
import 'home_screen.dart';
import 'search_screen.dart';
import 'contact_screen.dart';
import 'profile_screen.dart';

class MainNavigationScreen extends StatefulWidget {
  final int initialIndex;

  const MainNavigationScreen({super.key, this.initialIndex = 0});

  /// Navigates back to the Home tab from any descendant screen or route
  static void navigateToHome(BuildContext context) {
    setTab(context, 0);
  }

  /// Switches to any tab directly without rebuilding the main app shell
  static void setTab(BuildContext context, int index) {
    final state = context.findAncestorStateOfType<_MainNavigationScreenState>();
    if (state != null) {
      state.setIndex(index);
    } else if (Navigator.canPop(context)) {
      Navigator.pop(context);
      final parentState = context.findAncestorStateOfType<_MainNavigationScreenState>();
      parentState?.setIndex(index);
    } else {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => MainNavigationScreen(initialIndex: index),
        ),
      );
    }
  }

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  late int _currentIndex;

  final List<Widget> _screens = const [
    HomeScreen(),
    SearchScreen(),
    ContactScreen(),
    ProfileScreen(),
  ];

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
  }

  void setIndex(int index) {
    if (mounted && _currentIndex != index) {
      setState(() {
        _currentIndex = index;
      });
    }
  }

  @override
  void didUpdateWidget(covariant MainNavigationScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.initialIndex != oldWidget.initialIndex) {
      setIndex(widget.initialIndex);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(
            top: BorderSide(color: Color(0xFFF1F5F9), width: 1.0),
          ),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) {
            setIndex(index);
          },
          type: BottomNavigationBarType.fixed,
          backgroundColor: Colors.white,
          elevation: 0,
          selectedItemColor: const Color(0xFF1D4ED8),
          unselectedItemColor: const Color(0xFF64748B),
          selectedFontSize: 11.5,
          unselectedFontSize: 11.5,
          selectedLabelStyle: const TextStyle(
            fontWeight: FontWeight.w700,
            letterSpacing: -0.2,
          ),
          unselectedLabelStyle: const TextStyle(
            fontWeight: FontWeight.w500,
            letterSpacing: -0.2,
          ),
          items: const [
            BottomNavigationBarItem(
              icon: Padding(
                padding: EdgeInsets.only(bottom: 3.0),
                child: Icon(Icons.home_outlined, size: 22),
              ),
              activeIcon: Padding(
                padding: EdgeInsets.only(bottom: 3.0),
                child: Icon(Icons.home_rounded, size: 22),
              ),
              label: 'Home',
            ),
            BottomNavigationBarItem(
              icon: Padding(
                padding: EdgeInsets.only(bottom: 3.0),
                child: Icon(Icons.search_rounded, size: 22),
              ),
              activeIcon: Padding(
                padding: EdgeInsets.only(bottom: 3.0),
                child: Icon(Icons.search_rounded, size: 22),
              ),
              label: 'Search',
            ),
            BottomNavigationBarItem(
              icon: Padding(
                padding: EdgeInsets.only(bottom: 3.0),
                child: Icon(Icons.support_agent_outlined, size: 22),
              ),
              activeIcon: Padding(
                padding: EdgeInsets.only(bottom: 3.0),
                child: Icon(Icons.support_agent_rounded, size: 22),
              ),
              label: 'Contact',
            ),
            BottomNavigationBarItem(
              icon: Padding(
                padding: EdgeInsets.only(bottom: 3.0),
                child: Icon(Icons.person_outline_rounded, size: 22),
              ),
              activeIcon: Padding(
                padding: EdgeInsets.only(bottom: 3.0),
                child: Icon(Icons.person_rounded, size: 22),
              ),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }
}
