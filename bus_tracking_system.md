# 🚌 College Bus Tracking System

## 📌 Project Overview

A real-time bus tracking system for college transportation that allows
students to track buses live, drivers to share location, and admins to
manage routes and buses efficiently.

## 🎯 Problem Statement

-   Students don't know the exact location of the bus\
-   Buses may get delayed without any notice\
-   Students waste time waiting at stops

## 💡 Proposed Solution

A real-time tracking system that provides: - Live bus location on map\
- Estimated Time of Arrival (ETA)\
- Notifications for delays or arrival

## 🧩 System Modules

### 👨‍🎓 Student Module

-   Login/Register\
-   View live bus location on map\
-   Select bus stop\
-   View ETA\
-   Receive notifications

### 🧑‍✈️ Driver Module

-   Login\
-   Start Trip / Stop Trip\
-   Share live GPS location\
-   Select assigned route

### 🏫 Admin Module

-   Login\
-   Add/Edit/Delete buses\
-   Manage routes and stops\
-   Monitor all buses live\
-   View reports (delay, usage)

## 🛠️ Tech Stack

-   Frontend: React.js\
-   Backend: Node.js, Express.js\
-   Database: MySQL\
-   Real-Time: Socket.IO\
-   Maps: Google Maps API\
-   Notifications: Firebase Cloud Messaging (Optional)

## 🏗️ System Architecture

Driver App → Node.js Server → MySQL → Student/Admin App

## 🗄️ Database Tables

-   Users\
-   Buses\
-   Routes\
-   Stops\
-   Bus_Location

## 🔐 Authentication

-   JWT-based login\
-   Role-based access (Student, Driver, Admin)

## 🔌 APIs

### Auth

-   POST /register\
-   POST /login

### Admin

-   Add buses, routes, stops

### Driver

-   Start/Stop trip\
-   Send location

### Student

-   Get bus location\
-   Get routes/stops

## 📡 Real-Time Tracking

-   Driver sends GPS\
-   Server broadcasts via Socket.IO\
-   Students receive live updates

## 🗺️ Features

-   Live map tracking\
-   ETA calculation\
-   Notifications

## 🚀 Development Steps

1.  Setup project\
2.  Authentication\
3.  Admin panel\
4.  Driver tracking\
5.  Student tracking\
6.  Real-time updates

## 🌟 Future Enhancements

-   Attendance tracking\
-   AI route optimization\
-   Mobile app

## 📌 Conclusion

Improves transport efficiency and student convenience.

## 👨‍💻 Author

Your Name
