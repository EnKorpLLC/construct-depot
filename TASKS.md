# Construct Depot Tasks

## Task Status Legend
- 🔴 Critical
- 🟡 In Progress
- 🟢 Completed
- ⚪ Planned

## User Interface and Navigation
- 🔴 Fix role-based menu access controls across dashboards
- 🔴 Remove incorrect service settings appearances in admin navigation
- 🔴 Restore super admin dashboard selector button
- 🔴 Standardize logo click behavior based on login status
- 🔴 Update color scheme to balance blue and orange (50/50)
- 🔴 Implement new logo from `logos/CDLogoUpdated.jpeg` and `CDLogoUpdated-removebg-preview.png`

## Dashboard Functionality
- 🔴 Fix client-side exception on product page
- 🔴 Implement accurate dashboard statistics (remove hardcoded values)
- 🔴 Add example/placeholder images for products and categories
- 🔴 Implement missing functionality for dashboard links
- 🔴 Fix overview block counts to show accurate data

## Example Data Creation
- 🔴 Create seed data for users across different roles
- 🔴 Generate realistic construction job examples
- 🔴 Create sample bid data with various statuses
- 🔴 Add material quotes with different suppliers
- 🔴 Generate product catalog with categories and variants
- 🔴 Create example order history and pool purchases
- 🔴 Add project timelines and milestones
- 🔴 Generate realistic contractor-subcontractor relationships

## API Implementation
- ⚪ Implement actual API calls in `dashboardService.ts`:
  - Project fetching
  - Budget summary
  - Timeline events
  - Dashboard data
  - Notifications
- ⚪ Complete order workflow implementation in `OrderWorkflowService.ts`
- ⚪ Implement pool joining logic in `order.service.ts`

## Testing and Quality Assurance
- ⚪ Add comprehensive error handling
- ⚪ Implement proper loading states
- ⚪ Add error boundaries
- ⚪ Enhance error messaging for users
- ⚪ Complete test coverage for order management

## Data Management
- ⚪ Implement real-time data fetching for dashboard statistics
- ⚪ Add proper calculation logic for metrics
- ⚪ Implement proper image handling and optimization
- ⚪ Add lazy loading for images

## Documentation
- 🟢 Create centralized task tracking system (this file)
- ⚪ Document all API endpoints
- ⚪ Add setup instructions for new developers
- ⚪ Document role-based access controls

## Task History

### February 4, 2024
- Created centralized task tracking system
- Identified critical UI/UX issues
- Documented existing API implementation TODOs
- Added example data creation tasks

## Notes
- Priority is given to user-facing issues and critical functionality
- All critical items marked with 🔴 should be addressed first
- Regular updates to this file should be made as tasks progress
- Each completed task should be moved to Task History with completion date 