# PRD: Teams Section UI Improvements

## Overview
This document outlines the UI/UX improvements needed for the Teams section based on user feedback and review.

## Current State Issues

Based on the review, the following issues have been identified:

### 1. Navigation Structure
- **Issue**: Teams has an unnecessary submenu with only "Team List" as a child item
- **Recommendation**: Merge into a single "Teams" menu item without submenu

### 2. Missing Page Header
- **Issue**: The right-hand panel lacks a proper header/title
- **Recommendation**: Add "Team Capacity Management" as the page header

### 3. Inconsistent Action Buttons
- **Issue**: Edit buttons in the Actions column are inconsistent in styling
- **Recommendation**: Standardize all action buttons with consistent styling

### 4. Content Alignment
- **Issue**: Team content is right-aligned instead of left-aligned
- **Recommendation**: Left-align content for better readability

### 5. Redundant UI Elements
- **Issue**: "Setup Wizard" and "Quick Add" buttons are redundant since team setup is handled in Settings
- **Recommendation**: Remove these buttons from the Teams page

## Requirements

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Remove Teams submenu, make it a single menu item | High |
| FR-2 | Add page header "Team Capacity Management" | High |
| FR-3 | Standardize action buttons (Edit, Delete) with consistent icons and styling | High |
| FR-4 | Left-align team table content | High |
| FR-5 | Remove "Setup Wizard" button | High |
| FR-6 | Remove "Quick Add" button | High |

### UI/UX Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| UX-1 | Page header should follow existing design patterns (e.g., Settings pages) | High |
| UX-2 | Action buttons should use Ant Design Button with consistent type and size | High |
| UX-3 | Table columns should be left-aligned (except numeric columns which can be right-aligned) | High |
| UX-4 | Maintain List/Dashboard toggle tabs | Medium |

## Acceptance Criteria

1. **Navigation**: Teams appears as a single menu item in the sidebar (no submenu)
2. **Page Header**: "Team Capacity Management" header is visible at the top of the page
3. **Action Buttons**: All action buttons have consistent styling:
   - Edit: Primary link button with EditOutlined icon
   - Delete: Danger link button with DeleteOutlined icon
4. **Content Alignment**: Team names and other text content are left-aligned
5. **Clean UI**: No "Setup Wizard" or "Quick Add" buttons visible

## Out of Scope
- Team creation/editing functionality (handled in Settings)
- Backend API changes
- Data model changes

## Success Metrics
- Improved visual consistency with other sections
- Cleaner, more focused UI for capacity management
- Reduced user confusion from redundant options

## Timeline
- Estimated effort: 2-4 hours
- Priority: High (UI polish)
