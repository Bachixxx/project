# Mobile Optimization for Coach Interface

- [x] Audit Coach Interface for Mobile Issues <!-- id: 0 -->
    - [x] Identify key Coach pages <!-- id: 1 -->
    - [x] Analyze Layout and Navigation <!-- id: 2 -->
    - [x] Analyze Dashboard and Widgets <!-- id: 3 -->
    - [x] Analyze Client List and Details <!-- id: 4 -->
    - [x] Analyze Scheduling/Agenda Views <!-- id: 5 -->
- [x] Create detailed Audit Report (`audit_mobile_coach.md`) <!-- id: 6 -->
- [x] Plan and Implement Fixes <!-- id: 7 -->
    - [x] **Phase 1: General UX & Dashboard**
        - [x] Dashboard: Show Coach Code on mobile
        - [x] Header: Simplify spacing and layout
        - [x] Global: Increase touch targets (min 44px)
    - [x] **Phase 2: Modal System Overhaul**
        - [x] Create standardized `ResponsiveModal` component (Full screen on mobile)
        - [x] Refactor `ClientModal` to use `ResponsiveModal`
        - [x] Refactor `AppointmentModal` (`Calendar.tsx`) to use `ResponsiveModal`
        
- [x] Refactor `ProgramModal` to use `ResponsiveModal`
- [x] Refactor `SessionModal` (in `Sessions.tsx`) to use `ResponsiveModal`
- [x] Refactor `ExerciseSelector` to use `ResponsiveModal`
- [x] Refactor `GroupModal` to use `ResponsiveModal`
- [x] **Phase 3: Session UX Refactor (Mobile)**
    - [x] Implement Tabbed Interface (Details/Exercises) in `SessionModal`
    - [x] Move Action Buttons to Sticky Footer in `SessionModal`
- [x] **Phase 4: Native Features (iOS)**
    - [x] Install `onesignal-cordova-plugin`
    - [x] Implement Native OneSignal Initialization in `NotificationsContext`
    - [x] Sync Capacitor Project (Resolved via Manual CocoaPods Setup)
    - [ ] **Verify Push Notifications (BLOCKED: Requires Paid Apple Developer Account)**

## Bug Fixes
- [x] Fix Sidebar Overlap on Mobile (Header covers sidebar top) <!-- id: 8 -->
