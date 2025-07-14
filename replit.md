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

## Recent Updates - January 14, 2025

### Enhanced UI Design & True Bluetooth Mesh Implementation
- **Advanced Cyberpunk Styling**: Implemented gradient backgrounds, neon effects, enhanced animations, and improved visual feedback
- **True Bluetooth Mesh Networking**: Created comprehensive BluetoothMeshManager with device discovery, connection management, and message routing
- **Fixed WebRTC Connection Issues**: Resolved signaling state errors and improved peer-to-peer communication reliability
- **Enhanced Components**: Updated NetworkExplorer, ChatInterface, and RadarView with better real-time status indicators
- **Bluetooth Control Panel**: Added dedicated interface for managing mesh connections and monitoring network health
- **Canvas-Based Radar View**: Implemented animated radar visualization with sweep effects and connection type indicators
- **Browser-Compatible Event System**: Replaced Node.js EventEmitter with custom implementation for browser compatibility