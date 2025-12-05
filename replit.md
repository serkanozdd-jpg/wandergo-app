# WanderGo - Smart Travel Discovery Application

## Overview

WanderGo is a mobile travel discovery and planning application built with React Native (Expo) that helps users explore destinations, plan routes, share reviews, and leverage AI for personalized travel recommendations. The app combines location-based discovery, social features, and AI-powered content generation to enhance the travel experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React Native with Expo SDK 54
- **Navigation**: React Navigation v7 with native stack and bottom tabs
- **UI Components**: Custom themed components with light/dark mode support
- **State Management**: TanStack Query (React Query) for server state, React Context for auth state
- **Styling**: StyleSheet API with custom theme system (spacing, colors, typography)
- **Animations**: React Native Reanimated for smooth interactions
- **Forms**: React Native Keyboard Controller for keyboard-aware scrolling

**Key Design Patterns**:
- Component composition with reusable UI primitives (Card, Button, ThemedText/View)
- Custom hooks for theme, screen options, and color scheme
- Path aliasing (@/ for client, @shared/ for shared code)
- Platform-specific adaptations (iOS blur effects, Android edge-to-edge)

**Navigation Structure**:
- Root stack contains auth flow and main app
- Main app uses bottom tabs (Discover, Routes, Explore, Community, Profile)
- Modal screens for place details, reviews, route creation, settings
- Authenticated vs unauthenticated routing handled at root level

### Backend Architecture

**Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Design**: RESTful endpoints with JWT authentication
- **Middleware**: CORS handling, body parsing, authentication middleware
- **Error Handling**: Centralized error responses with proper HTTP status codes

**Authentication System**:
- JWT-based authentication with 30-day expiration
- bcryptjs for password hashing
- Bearer token authentication via Authorization header
- Session secret stored in environment variables
- User context propagated through Express Request object

**Data Access Layer**:
- Storage abstraction interface (IStorage) for database operations
- Type-safe queries using Drizzle ORM with PostgreSQL dialect
- Relationship mapping between users, places, reviews, routes, itineraries
- Connection pooling via node-postgres

**Database Schema**:
- **users**: Authentication, profile data (avatar presets, bio, display name)
- **places**: Destination data with geolocation, categories, AI-generated articles
- **reviews**: User ratings and content with photo support
- **favorites**: User's saved places
- **visitedPlaces**: Travel history tracking
- **routes**: Custom route planning with multiple waypoints
- **itineraries**: AI-generated daily schedules
- **achievements**: Gamification system
- **follows**: Social following relationships

### AI Integration

**Provider**: OpenAI (via Replit AI Integrations)
- Model: gpt-4o-mini for cost-effective generation
- Use cases:
  - Generate travel articles for places (150-250 words)
  - Create daily itineraries based on available time and preferences
- Content formatted as engaging, informative travel guide material
- Error handling with graceful fallbacks

**Key Features**:
- Context-aware article generation using place metadata
- Structured prompts for consistent output quality
- Billing through Replit credits (no external API key required)

### External Dependencies

**Cloud Services**:
- **Google Cloud Storage**: Image and object storage with ACL-based permissions
  - Custom object access control system with owner/visibility policies
  - Replit sidecar integration for credential management
  - Support for public/private object visibility
  
**Location Services**:
- **Expo Location**: GPS access, permission handling, nearby place detection
- Geospatial queries for radius-based search using lat/lng coordinates

**Image Handling**:
- **Expo Image**: Optimized image loading with contentFit
- **Expo Image Picker**: Camera and photo library access
- **Expo Camera**: Direct camera integration for review photos

**Authentication Providers** (Planned):
- Apple Sign-In (iOS requirement)
- Google Sign-In (Android/cross-platform)
- Currently using username/password with manual registration

**Other Integrations**:
- Expo modules for native functionality (haptics, web browser, blur effects)
- React Native Gesture Handler for smooth interactions
- Safe Area Context for notch/status bar handling

### Deployment Configuration

**Environment**:
- Replit-hosted with internal app domain routing
- Dual-mode operation: development (Metro bundler) and production (static build)
- CORS configured for Replit domains
- Express server serves both API and static assets in production

**Build Process**:
- Expo static export for web deployment
- Server bundling with esbuild (ESM format, external packages)
- Asset optimization and minification for production builds
- Landing page generation with QR code for mobile testing

**Database**:
- PostgreSQL (provisioned via DATABASE_URL environment variable)
- Drizzle Kit for migrations and schema management
- Migration files stored in `/migrations` directory