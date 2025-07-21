# Replit.md - Decentralized Mesh Network Chat Application

## Overview

This is a decentralized mesh network chat application built with React, Express.js, and TypeScript. The application enables peer-to-peer messaging through WebRTC connections, Bluetooth discovery, and encrypted communications in a mesh network topology. It features a cyberpunk-inspired UI with real-time messaging, network visualization, and ephemeral stories functionality.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **UI Library**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with custom cyberpunk theme and CSS variables
- **State Management**: React Query for server state, React hooks for local state
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM (schema defined, using Neon serverless)
- **Real-time Communication**: WebSocket server for signaling
- **Session Management**: Express sessions with PostgreSQL storage
- **API Design**: RESTful endpoints with WebSocket for real-time features

### Database Schema
The application uses four main tables:
- `users`: Store user profiles with wallet addresses and public keys
- `messages`: Encrypted peer-to-peer messages with mesh routing info
- `meshNodes`: Track network nodes and their connection status
- `stories`: Ephemeral content with expiration timestamps

## Key Components

### Peer-to-Peer Communication
- **WebRTC Manager**: Handles direct peer connections and data channels
- **Bluetooth Integration**: Web Bluetooth API for device discovery
- **Encryption Layer**: RSA-OAEP and AES-GCM for message encryption
- **Mesh Routing**: Multi-hop message delivery through network nodes

### User Interface Components
- **Chat Interface**: Real-time messaging with encryption indicators
- **Network Explorer**: Visual representation of mesh network topology
- **Radar View**: Animated radar display showing nearby nodes
- **Sidebar Navigation**: Tabbed interface for different app sections
- **Right Panel**: Stories feed and network statistics

### Real-time Features
- **WebSocket Signaling**: Coordinates WebRTC connections between peers
- **Live Network Status**: Shows connected peers and signal strength
- **Ephemeral Stories**: Time-limited content sharing
- **Message Encryption**: End-to-end encryption for all communications

## Data Flow

1. **User Authentication**: Users connect with wallet addresses and generate key pairs
2. **Network Discovery**: Bluetooth and WebRTC discovery of nearby nodes
3. **Mesh Connection**: Establish encrypted connections with discovered peers
4. **Message Routing**: Messages hop through mesh network to reach recipients
5. **Content Sharing**: Stories and messages propagate through the network
6. **Data Persistence**: Critical data stored in PostgreSQL, ephemeral content expires

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database queries and migrations
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/react-***: Accessible UI component primitives
- **ws**: WebSocket server implementation

### Development Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety across the entire application
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Fast JavaScript bundler for production

### Browser APIs
- **Web Bluetooth**: Device discovery and connection
- **WebRTC**: Peer-to-peer communication
- **Web Crypto API**: Client-side encryption and key generation

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with Express backend
- **Hot Reloading**: React Fast Refresh and server restart on changes
- **Database**: Uses DATABASE_URL environment variable for connection
- **Build Process**: Vite builds frontend, ESBuild bundles backend

### Production Deployment
- **Build Command**: `npm run build` - compiles both frontend and backend
- **Start Command**: `npm start` - runs the production server
- **Static Assets**: Frontend builds to `dist/public` directory
- **Server Bundle**: Backend compiles to `dist/index.js`

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **NODE_ENV**: Controls development vs production behavior
- **Session Configuration**: Uses connect-pg-simple for session storage

The application is designed to work in environments with intermittent connectivity, making it ideal for decentralized communication scenarios where traditional server-client architectures might fail.

## Current Project Status - July 21, 2025

### ✅ Working Features
- **Express Backend Server**: Fully operational REST API with all endpoints responding correctly
- **Database Integration**: PostgreSQL with Drizzle ORM working properly for user management, network analytics, and data persistence
- **User Registration System**: Device-based authentication with RSA key generation and profile management functioning
- **Network Analytics**: Real-time network monitoring with performance metrics and connection statistics
- **File Transfer Infrastructure**: Backend file transfer system with chunked uploads and progress tracking
- **Modern UI Components**: Complete shadcn/ui interface with cyberpunk theme and fully responsive design
- **Chat Interface**: Real-time messaging interface with encryption indicators and user avatars
- **Profile Management**: User profile system with image upload, username, and bio editing capabilities
- **Responsive Design**: Mobile-first responsive design with proper viewport handling and mobile navigation

### ✅ Recently Fixed Issues (July 21, 2025)
- **UI/UX Display Problems**: Fixed critical display issues on both mobile and desktop devices
- **CSS Overflow Issues**: Resolved body overflow:hidden that prevented proper scrolling
- **Mobile Navigation**: Implemented mobile-bottom navigation with proper responsive breakpoints
- **Form Layouts**: Enhanced mobile form layouts with proper sizing and touch targets
- **Card Components**: Fixed responsive card layouts and container sizing for better mobile display
- **Viewport Configuration**: Added proper mobile viewport meta tags for consistent device rendering

### ⚠️ Current Issues & Limitations

#### WebSocket Connectivity Challenges
- **Connection Instability**: WebSocket connections still experience intermittent drops but with improved reconnection logic
- **Mesh Network Functionality**: Advanced mesh connection established but needs stability improvements for sustained P2P communication
- **Real-Time Optimization**: WebSocket throttling implemented but requires fine-tuning for optimal performance

#### Technical Enhancements Needed
- **WebRTC Implementation**: Peer-to-peer connections framework ready but needs full WebSocket stability
- **Bluetooth Integration**: Web Bluetooth API integration present but requires comprehensive testing
- **Stories Feature**: Ephemeral content system built and ready for real-time connectivity improvements
- **File Transfer UI**: Backend infrastructure complete, frontend interface needs WebSocket reliability optimization

### 🔧 Next Development Priorities

#### 1. WebSocket Optimization
- Fine-tune connection throttling and reconnection logic
- Implement heartbeat monitoring and connection quality metrics
- Add graceful fallback mechanisms for offline functionality

#### 2. Feature Enhancement
- Complete WebRTC P2P communication implementation
- Test and optimize Bluetooth device discovery integration  
- Enhance stories system with better real-time synchronization

#### 3. User Experience Polish
- Add connection quality indicators in the UI
- Implement offline mode notifications
- Optimize mobile navigation animations and transitions

### 📊 Performance Metrics (Current Session)
- **API Response Times**: All REST endpoints responding in 0-2ms (excellent)
- **Database Queries**: PostgreSQL queries executing efficiently
- **WebSocket Attempts**: 20+ connection attempts per minute (indicates critical issue)
- **User Registration**: Working properly despite connection issues
- **Network Analytics**: Real-time data collection functioning correctly

### 🏗️ Architecture Status

#### Backend Infrastructure ✅
- Express.js server with TypeScript fully operational
- PostgreSQL database with Drizzle ORM working correctly
- REST API endpoints for all major features functional
- File transfer system backend implementation complete
- Network analytics and monitoring systems active

#### Frontend Application ⚠️
- React 18 with TypeScript and Vite build system working
- UI components and responsive design fully implemented
- Real-time features dependent on WebSocket connectivity
- User interface functional but limited by connection issues

#### Real-Time Systems ❌
- WebSocket server implementation needs critical fixes
- WebRTC signaling impaired by connection instability
- Mesh networking functionality exists but unreliable
- Live chat and network discovery severely limited

### Recent Implementation History

#### Comprehensive Demo Data Removal and Real User System Implementation
- **Removed All Wallet Dependencies**: Completely eliminated wallet system and demo users from the entire application
- **Device-Based Authentication**: Implemented device ID-based user authentication using browser fingerprinting for unique device identification
- **Modern User Profile System**: Created comprehensive user profile management with image upload, username, bio editing, and device tracking
- **Real User Database Schema**: Updated database schema to support real user profiles with profileImage, username, bio, and deviceId fields
- **Enhanced User Registration**: Built modern authentication flow with RSA key generation, device fingerprinting, and secure onboarding
- **Mobile-Responsive UI**: Redesigned home page with mobile-first approach and real user communication features
- **Advanced Scanner Animation**: Created realistic user detection simulation with signal strength, distance, and connection type indicators
- **Modern Chat Interface**: Built real-time chat with end-to-end encryption, user avatars, and mobile-responsive design
- **Complete Storage Overhaul**: Updated storage interface to use deviceId instead of wallet addresses with proper user CRUD operations
- **Real User API Endpoints**: Added profile update endpoints, device-based user lookup, and modern user management routes

#### Previous Advanced Mesh Network Implementation
- **Complete Server Architecture**: Built modular server infrastructure with ConnectionManager, MeshRouter, CryptoManager, FileTransferManager, and NetworkAnalytics
- **Advanced Analytics Dashboard**: Implemented real-time network monitoring with performance metrics, connection quality tracking, and health indicators
- **Secure File Transfer System**: Created chunked, resumable file transfer with encryption, progress tracking, and bandwidth management
- **Cryptographic Security Monitor**: Built comprehensive security interface with key generation, wallet addresses, and security health monitoring
- **Enhanced WebSocket Infrastructure**: Improved connection stability with throttling, exponential backoff, and proper error handling (currently experiencing issues)
- **Modular Tab Interface**: Integrated all advanced features into organized tabs (Chat, Analytics, Transfers, Security, Network, Stories, Bluetooth)
- **Real-time Mesh Routing**: Implemented Dijkstra's algorithm for optimal path finding and dynamic route adaptation
- **Enhanced Connection Management**: Added connection quality monitoring, health checks, and automatic failure recovery
- **Advanced Encryption**: Implemented AES-256-GCM encryption with RSA key pairs and secure message authentication