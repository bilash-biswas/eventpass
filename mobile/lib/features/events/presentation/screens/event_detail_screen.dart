import 'package:flutter/material.dart';

class EventDetailScreen extends StatelessWidget {
  final String slug;

  const EventDetailScreen({super.key, required this.slug});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Event Details'),
      ),
      body: Center(
        child: Text('Event Slug: $slug'),
      ),
    );
  }
}
