import 'package:flutter/material.dart';

class ScannerScreen extends StatelessWidget {
  const ScannerScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Organizer Ticket Scanner'),
      ),
      body: const Center(
        child: Text('Camera QR Scanner Screen'),
      ),
    );
  }
}
