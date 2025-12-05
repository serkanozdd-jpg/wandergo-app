# WanderGo - Design Guidelines

## Authentication & Onboarding

**Authentication Required** - Social/community features with reviews, user profiles, and following system.

### Implementation
- **Primary Auth**: Apple Sign-In (iOS required), Google Sign-In (Android/cross-platform)
- **Screens Required**:
  - Welcome/Login screen with SSO buttons
  - Profile creation (username, avatar selection)
  - Privacy policy & terms links (placeholder URLs)
  - Account settings with logout (confirmation alert) and delete account (nested: Settings > Account > Delete, double confirmation)

### Onboarding Flow
1. Welcome screen with app benefits
2. Location permission request with clear explanation
3. Optional: Select travel interests (nature, culture, food, nightlife)
4. Quick tutorial: swipe through key features (discover, routes, reviews)

---

## Navigation Architecture

**Root Navigation**: Tab Bar (5 tabs)
- **Tab 1**: Discover (home) - Browse nearby places
- **Tab 2**: Routes - Saved and suggested routes
- **Tab 3**: Explore (center, emphasized) - Main map view with FAB for "Create Route"
- **Tab 4**: Reviews - Community feed
- **Tab 5**: Profile - User stats and settings

**Modal Screens**:
- Place Details
- Create Review
- Edit Profile
- Route Planner
- AI Article Reader

---

## Screen Specifications

### 1. Discover Screen (Tab 1)
**Purpose**: Browse nearby places and popular destinations
- **Header**: Transparent, search bar integrated, location dropdown (right button)
- **Layout**: 
  - Scrollable content
  - Top inset: headerHeight + Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl
- **Sections**:
  - "Near You" horizontal scroll (cards with image, name, distance, rating)
  - "Popular This Week" vertical list
  - "Categories" grid (Museums, Parks, Restaurants, etc.)
- **Components**: Search bar, filter chips, place cards with images

### 2. Routes Screen (Tab 2)
**Purpose**: View saved routes and daily itineraries
- **Header**: Default navigation, title "My Routes", "+" button (right)
- **Layout**:
  - List view
  - Top inset: Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl
- **Components**:
  - Route cards showing: route name, type icon (walk/run/car/transit), duration, places count
  - "AI Daily Plan" banner at top
  - Empty state: "Create your first route"

### 3. Explore (Map) Screen (Tab 3 - Center)
**Purpose**: Interactive map with place markers and route creation
- **Header**: Transparent, back button (left), map layers button (right)
- **Layout**:
  - Full screen map
  - Floating search bar at top
  - Bottom sheet for place preview (draggable)
- **FAB**: "Create Route" button (bottom right)
  - Shadow: offset (0, 2), opacity 0.10, radius 2
  - Position: bottom: tabBarHeight + Spacing.xl, right: Spacing.xl
- **Components**: Map view, place markers, route polylines, current location indicator

### 4. Reviews Screen (Tab 4)
**Purpose**: Community feed of recent reviews
- **Header**: Default navigation, title "Community"
- **Layout**:
  - Scrollable feed
  - Top inset: Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl
- **Components**:
  - Review cards: user avatar, username, place name, rating, photo grid, text, timestamp
  - Like/comment icons

### 5. Profile Screen (Tab 5)
**Purpose**: User statistics, badges, and settings
- **Header**: Transparent, settings gear icon (right)
- **Layout**:
  - Scrollable content
  - Top inset: headerHeight + Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl
- **Sections**:
  - Profile header: avatar, name, edit button
  - Stats row: Places Visited, Countries, Reviews
  - World map with visited countries highlighted
  - Badge collection grid
  - Recent reviews list
- **Components**: Stat cards, badges, map visualization

### 6. Place Details (Modal)
**Purpose**: Comprehensive info about a location
- **Header**: Custom transparent with large image background, back button (left), favorite icon (right)
- **Layout**:
  - Scrollable content with parallax image header
  - Top inset: insets.top + Spacing.xl
  - Bottom inset: insets.bottom + Spacing.xl
- **Sections**:
  - Hero image
  - Name, rating, distance
  - Quick actions: Directions, Save, Share, Review
  - AI-generated article (collapsible)
  - Visit info: entry fee, suggested duration, best time
  - Photo gallery
  - Reviews section
- **Components**: Image carousel, action buttons, rating display, review cards

### 7. Route Planner (Modal)
**Purpose**: Create custom multi-stop routes
- **Header**: Default, "Cancel" (left), "Create" (right, disabled until valid)
- **Layout**:
  - Scrollable form
  - Top inset: Spacing.xl
  - Bottom inset: insets.bottom + Spacing.xl
- **Form Fields**:
  - Route type selector (walk/run/car/transit)
  - Starting point (current location or search)
  - Destination points (drag to reorder)
  - "Add stop" button
  - Time constraint toggle
  - Optimize route checkbox
- **Components**: Transport type chips, location search, draggable list, toggle switches

### 8. Create Review (Modal)
**Purpose**: Submit review with rating and photos
- **Header**: Default, "Cancel" (left), "Post" (right)
- **Layout**:
  - Scrollable form
  - Top inset: Spacing.xl
  - Bottom inset: insets.bottom + Spacing.xl
- **Form Elements**:
  - Star rating selector
  - Photo upload (up to 5 images)
  - Text area for review
  - Visit date picker
  - Submit button below form
- **Components**: Star rating input, image picker, text input, date picker

---

## Design System

### Color Palette
**Primary**: Vibrant teal (#00B4A0) - Adventure, exploration
**Secondary**: Warm orange (#FF6B35) - Energy, discovery
**Accent**: Deep purple (#6C5CE7) - Premium, AI features
**Neutrals**: 
- Background: #FFFFFF
- Surface: #F8F9FA
- Border: #E1E8ED
- Text Primary: #2C3E50
- Text Secondary: #6C757D

**Semantic Colors**:
- Success: #27AE60 (verified places)
- Warning: #F39C12 (busy times)
- Error: #E74C3C
- Info: #3498DB

### Typography
**Font Family**: System default (San Francisco for iOS, Roboto for Android)
- **Heading 1**: 32px, Bold - Screen titles
- **Heading 2**: 24px, SemiBold - Section headers
- **Heading 3**: 18px, SemiBold - Card titles
- **Body**: 16px, Regular - Main content
- **Caption**: 14px, Regular - Meta info
- **Small**: 12px, Regular - Timestamps, labels

### Spacing Scale
- xs: 4px
- sm: 8px
- md: 12px
- lg: 16px
- xl: 24px
- xxl: 32px

### Component Specifications

**Place Cards**:
- Border radius: 16px
- Image aspect ratio: 16:9
- No shadow, border: 1px solid #E1E8ED
- Pressed: scale 0.98, opacity 0.9

**Buttons**:
- Primary: Fill with primary color, white text, radius 12px
- Secondary: Border 2px primary color, primary text, radius 12px
- Pressed: opacity 0.85
- Height: 48px (minimum touch target)

**Tab Bar**:
- Height: 60px
- Active tab: Primary color
- Inactive: Text Secondary
- Icons: Feather icons, 24px

**FAB (Create Route)**:
- Size: 56px diameter
- Background: Secondary color
- Icon: Plus or Route icon, white
- Shadow: offset (0, 2), opacity 0.10, radius 2
- Pressed: scale 0.95

**Rating Stars**:
- Size: 20px
- Fill color: #FFB800
- Empty: #E1E8ED

---

## Required Assets

### Critical Content Assets
1. **Place Category Icons** (8 total):
   - Museum, Park, Restaurant, Nightlife, Beach, Mountain, Historical, Shopping
   - Style: Line icons, 32px, primary color
   
2. **Transport Mode Icons** (4 total):
   - Walking, Running, Car, Public Transit
   - Style: Filled icons, consistent with map UI

3. **User Avatars** (6 preset options):
   - Travel-themed illustrations (backpacker, globe, compass, camera, map, airplane)
   - Style: Flat, colorful, circular 80px
   - Aesthetic: Adventurous, friendly, modern

4. **Badge Icons** (10 total):
   - "First Steps" (bronze), "Explorer" (silver), "Globe Trotter" (gold)
   - "Nature Lover", "City Hunter", "Culture Enthusiast"
   - "Social Butterfly" (reviews), "Early Bird", "Night Owl", "Foodie"
   - Style: Illustrated medallions with unique colors

5. **Empty State Illustrations** (3 total):
   - No routes yet - Simple compass/map illustration
   - No reviews - Speech bubble with star
   - No places visited - World map outline
   - Style: Minimal line art, single accent color

### UI Elements
- Map markers: Custom pin with primary color
- Current location: Pulsing blue dot
- Logo: "WanderGo" wordmark with compass icon (generate if not provided)

---

## Interaction Design

- **All touchable elements**: Opacity 0.85 on press, 150ms transition
- **Cards**: Scale 0.98 on press
- **Floating elements**: Subtle elevation change on press
- **Lists**: Swipe gestures for delete/favorite actions
- **Maps**: Pinch to zoom, drag to pan, tap marker for preview
- **Bottom sheets**: Drag handle, snap points at 30%, 60%, 90%
- **Image galleries**: Horizontal scroll with page indicators

## Accessibility
- Minimum touch target: 44x44px
- Color contrast ratio: 4.5:1 for text
- Screen reader labels for all interactive elements
- Dynamic type support (respect system font size)
- VoiceOver/TalkBack optimized navigation