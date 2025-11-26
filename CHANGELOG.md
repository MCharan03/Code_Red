# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2025-11-26

### Added
- Initialized Django project `convoy_optimizer`.
- Created `navigation`, `operations`, and `communications` Django apps.
- Installed Django and Django Rest Framework.
- Configured project settings to include new apps.
- Implemented initial structure for Smart Route & Terrain Intelligence (AI Feature 1).
  - Defined `Checkpoint`, `Route`, and `RouteSegment` models in `navigation/models.py`.
  - Created `navigation/services.py` with placeholder `get_smart_route` AI logic.
  - Developed `navigation/views.py` with `SmartRouteAPIView` to expose API endpoint.
  - Configured URLs in `navigation/urls.py` and `convoy_optimizer/urls.py`.
  - Verified API endpoint functionality with `curl`.
- Implemented Offline-First Navigation (Non-AI USP 4).
  - Created `navigation/serializers.py` for `Checkpoint`, `Route`, and `RouteSegment`.
  - Added `OfflineDataAPIView` and `/api/offline-data/` endpoint for bulk data download.
  - Added `updated_at` field to `Checkpoint` and `Route` models for change tracking.
  - Created `SyncDataAPIView` and `/api/sync/` endpoint for delta synchronization.

## [Unreleased]