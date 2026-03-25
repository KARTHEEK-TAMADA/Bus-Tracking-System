# Implementation Plan - Fix All Issues & Remove Live Map

This plan outlines the steps to resolve the 27+ identified issues and remove the "Live Map" feature from the Student Dashboard.

## Proposed Changes

### [Backend] Data & Security
- **[MODIFY] [db.js](file:///c:/Users/tamad/OneDrive/Desktop/BTS/backend/db.js)**: Fix table creation order (Routes before Buses).
- **[MODIFY] [seed61.js](file:///c:/Users/tamad/OneDrive/Desktop/BTS/backend/seed61.js)**: Add sample data for the [Stops](file:///c:/Users/tamad/OneDrive/Desktop/BTS/frontend/src/pages/StudentDashboard.jsx#84-92) table to enable the timeline view.
- **[MODIFY] [auth.js](file:///c:/Users/tamad/OneDrive/Desktop/BTS/backend/routes/auth.js)**: Fix `JWT_SECRET` export to be more robust.
- **[MODIFY] [student.js](file:///c:/Users/tamad/OneDrive/Desktop/BTS/backend/routes/student.js)**: Add JWT authentication middleware to all student routes.
- **[MODIFY] [server.js](file:///c:/Users/tamad/OneDrive/Desktop/BTS/backend/server.js)**: Implement `trip_ended` websocket broadcast when a driver stops a trip.

### [Frontend] Admin Dashboard
- **[MODIFY] [AdminDashboard.jsx](file:///c:/Users/tamad/OneDrive/Desktop/BTS/frontend/src/pages/AdminDashboard.jsx)**:
  - Fix race conditions (use `await`) in [handleAddRoute](file:///c:/Users/tamad/OneDrive/Desktop/BTS/frontend/src/pages/AdminDashboard.jsx#34-41) and [handleDeleteRoute](file:///c:/Users/tamad/OneDrive/Desktop/BTS/frontend/src/pages/AdminDashboard.jsx#50-58).
  - Add a form to manage **Stops** (add/delete stops for a route).
  - Add **Edit Bus** functionality (reassign driver/route).
  - Use `capacity` from DB instead of hardcoding "40".
  - Add error message displays for form failures.

### [Frontend] Student Dashboard
- **[MODIFY] [StudentDashboard.jsx](file:///c:/Users/tamad/OneDrive/Desktop/BTS/frontend/src/pages/StudentDashboard.jsx)**:
  - **Remove Live Map** component and tab logic.
  - Simplify UI to focus solely on the **Timeline View**.
  - Add real-time counter for "Updated Xs ago".
  - Ensure all API calls include the Authorization header.

### [Frontend] Driver Dashboard
- **[MODIFY] [DriverDashboard.jsx](file:///c:/Users/tamad/OneDrive/Desktop/BTS/frontend/src/pages/DriverDashboard.jsx)**:
  - Fix `driver_id` type mismatch (`===` vs `==` or casting).
  - Improve "Select Bus" dropdown styling to match the theme.

### [Frontend] Global & Styles
- **[MODIFY] [App.jsx](file:///c:/Users/tamad/OneDrive/Desktop/BTS/frontend/src/App.jsx)**: Add user name/role display to header for mobile view.
- **[MODIFY] [Login.jsx](file:///c:/Users/tamad/OneDrive/Desktop/BTS/frontend/src/pages/Login.jsx)**: Fix missing background image path and mobile title scaling.
- **[MODIFY] [index.html](file:///c:/Users/tamad/OneDrive/Desktop/BTS/frontend/index.html)**: Update favicon placeholder.
- **[MODIFY] [index.css](file:///c:/Users/tamad/OneDrive/Desktop/BTS/frontend/src/index.css)**: Fix mobile input narrowing and inconsistent branding colors.
- **[DELETE] [App.css](file:///c:/Users/tamad/OneDrive/Desktop/BTS/frontend/src/App.css)**: Remove unused Vite boilerplate styles.

## Verification Plan

### Automated Tests
- Refresh all dashboards to ensure no "undefined" or "null" errors.
- Test Admin flow: Create route -> Add stops -> Create bus -> Assign driver.
- Test Driver flow: Login -> Select assigned bus -> Start trip -> Stop trip.
- Test Student flow: Search bus -> View timeline -> Verify "trip ended" status.

### Manual Verification
- Resize browser to 375px width to verify all mobile styling fixes.
- Check browser console for any "401 Unauthorized" or socket connection errors.
