# FAAN VEMTAP SYSTEM – FULL STRUCTURE & FLOW (SIMPLE EXPLANATION FOR DEVELOPERS)

---

# 1. INTRODUCTION

This document explains in simple English how the FAAN system should be structured inside VEMTAP.

We are building a system where:

• FAAN Headquarters (HQ) controls everything  
• Each Airport is a Location  
• Each Location has Departments  
• Each Department handles its own operations  

---

# 2. SYSTEM HIERARCHY (VERY IMPORTANT)

We have 3 main levels:

1. Super Admin (HQ Level)  
2. Location Admin (Airport Level)  
3. Department Admin (Department Level)  

---

# 3. LEVEL 1 – SUPER ADMIN (HQ)

This is the highest level.

Who uses this:
• FAAN Headquarters team

What they can do:

• See ALL locations (all airports)
• See ALL departments inside every location
• Create new locations
• Create location admins
• Create departments under locations
• Create department admins
• View all reports (feedback + internal reports)
• Switch between locations
• View overall dashboard (everything combined)

---

## SUPER ADMIN DASHBOARD

Should show:

• Total interactions across all airports  
• Total complaints  
• Total resolved issues  
• Overall satisfaction score  

They can also:

• Filter by location  
• Filter by department  

---

# 4. LEVEL 2 – LOCATION ADMIN (AIRPORT LEVEL)

Each airport is a Location.

Examples:
• Lagos Airport  
• Abuja Airport  
• Ibadan Airport  

---

## LOCATION ADMIN ROLE

Who uses this:
• Airport manager

What they can do:

• See everything happening in their airport only  
• See all departments inside their airport  
• View all feedback and issues in that airport  
• Manage departments under their location  
• Assign staff to departments  

---

## LOCATION DASHBOARD

Shows:

• Total interactions for that airport  
• Complaints in that airport  
• Department performance  
• Top problem areas in that airport  

---

# 5. LEVEL 3 – DEPARTMENT ADMIN

Each location has departments.

Examples:

• Customer Service  
• Operations  
• Security  
• Facilities  
• Commercial  

---

## DEPARTMENT ADMIN ROLE

Who uses this:
• Department managers

What they can do:

• See only their department data  
• See complaints related to their department  
• Respond to issues  
• Update issue status  
• Create reports  

---

## DEPARTMENT DASHBOARD

Shows:

• Issues assigned to the department  
• Status (Pending / In Progress / Resolved)  
• Response time  
• Performance summary  

---

# 6. LOCATION → DEPARTMENT STRUCTURE

Each Location contains multiple Departments.

Example:

Lagos Airport
  → Customer Service
  → Operations
  → Security
  → Facilities

Each department works independently but still belongs to that location.

---

# 7. TOUCHPOINT & FORM ASSIGNMENT

Each form (QR/NFC) must be linked to:

• A Location  
• A Department  

Example:

“Report Issue – Restroom”
→ Location: Lagos Airport  
→ Department: Facilities

---

# 8. PASSENGER FEEDBACK FLOW

1. Passenger scans QR or taps NFC  
2. Form opens  
3. Passenger submits feedback  
4. System assigns it automatically to:
   → Correct Location  
   → Correct Department

---

# 9. ISSUE FLOW (VERY IMPORTANT)

Once a submission is received:

1. Status = Pending  
2. Department sees it  
3. Department updates to In Progress  
4. Department resolves it → Status = Resolved

---

# 10. INTERNAL REPORT SYSTEM (VERY POWERFUL FEATURE)

This is NOT from passengers.

This is for staff.

---

## WHAT IS INTERNAL REPORT?

Departments can submit daily reports.

Examples:

• Flight delays  
• Equipment issues  
• Security incidents  
• Operational problems  

---

## INTERNAL REPORT FLOW

1. Department Admin creates report  
2. Report is saved under:
   → Location  
   → Department

---

## WHO CAN SEE IT?

• Department Admin → sees their own reports  
• Location Admin → sees all reports in their airport  
• Super Admin → sees everything

---

## FILTERING

Users can:

• View all reports  
• Filter by location  
• Filter by department  
• Filter by date

---

## REPORT EXPORT

System should allow:

• Download report (PDF)  
• Export report (Excel)

---

# 11. LOCATION SWITCHING (VERY IMPORTANT)

Super Admin can:

• Click “All Locations” → see everything  
• Select “Abuja Airport” → see only Abuja  
• Select department inside Abuja → see only that department

---

# 12. WHAT MAKES THE SYSTEM POWERFUL (ADD THESE)

---

## 1. REAL-TIME UPDATES

Dashboard updates instantly when new submission comes in.

---

## 2. STATUS TRACKING

Each issue must have:

• Pending  
• In Progress  
• Resolved

---

## 3. ROLE-BASED ACCESS

• HQ sees everything  
• Location sees only their airport  
• Department sees only their department

---

## 4. DATA VISIBILITY

Everything must be traceable by:

• Location  
• Department  
• Time

---

## 5. PRINTABLE REPORTS

For meetings and presentations.

---

# 13. FINAL UNDERSTANDING

The system is NOT random.

It is structured like this:

HQ (Super Admin)
  → Locations (Airports)
      → Departments
          → Reports & Issues

---

# END

