# MeetingFlow - AI-Powered Meeting Transcription Platform

## Overview

MeetingFlow is a real-time meeting transcription platform that provides AI-powered live transcription with automatic action item extraction. The system is designed specifically for newsletter publishers and content creators, offering WebSocket-based streaming transcription, intelligent conversation analysis, and seamless integration with productivity tools.

The platform combines a React frontend with shadcn/ui components, an Express.js backend with WebSocket support, PostgreSQL database with Drizzle ORM, and OpenAI integration for natural language processing and conversation enhancement.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and hot module replacement
- **UI Components**: shadcn/ui component library built on Radix UI primitives for accessibility and consistency
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **State Management**: TanStack Query for server state management and custom hooks for WebSocket connections
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Communication**: Custom WebSocket client with automatic reconnection and connection state management

### Backend Architecture
- **Framework**: Express.js with TypeScript for RESTful API endpoints
- **Real-time Communication**: WebSocket server using 'ws' library for streaming transcription data
- **Database ORM**: Drizzle ORM with PostgreSQL for type-safe database operations
- **AI Integration**: OpenAI API integration for transcription processing and conversation enhancement
- **Development**: In-memory storage fallback for development with interface-based storage abstraction

### Database Design
- **Users Table**: Authentication and user profile management with role-based access
- **Meetings Table**: Meeting session tracking with status, duration, and metadata
- **Transcriptions Table**: Real-time speech-to-text results with speaker identification and color coding
- **Action Items Table**: Automatically extracted tasks with assignment and completion tracking
- **Meeting Insights Table**: AI-generated summaries, sentiment analysis, and key topics

### WebSocket Communication
- **Connection Management**: Automatic reconnection with exponential backoff and connection state tracking
- **Message Types**: Structured message protocol for transcriptions, action items, insights, and connection status
- **Error Handling**: Comprehensive error handling with timeout management and graceful degradation
- **Scalability**: Support for concurrent connections with per-meeting isolation

### AI and Natural Language Processing
- **OpenAI Integration**: GPT model integration for conversation processing and enhancement
- **Brand-Specific Prompting**: Customized system prompts for newsletter publisher context and tone
- **Conversation Memory**: Session-based context maintenance for coherent multi-turn interactions
- **Action Item Extraction**: Intelligent parsing of meeting content to identify actionable tasks
- **Sentiment Analysis**: Real-time mood and collaboration assessment

## External Dependencies

### Core Services
- **OpenAI API**: GPT models for transcription enhancement, action item extraction, and conversation processing
- **Neon Database**: Serverless PostgreSQL hosting for production data persistence
- **WebSocket Protocol**: Real-time bidirectional communication for live transcription streaming

### Development and Deployment
- **Vite**: Frontend build tool with TypeScript support and hot module replacement
- **Replit Integration**: Development environment with runtime error handling and cartographer support
- **ESBuild**: Backend bundling for production deployment

### UI and Design System
- **Radix UI**: Headless component primitives for accessibility and keyboard navigation
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide Icons**: SVG icon library for consistent visual language
- **Google Fonts**: Typography with Inter font family for readability

### Productivity Integrations
- **Notion**: Action item export capability for project management
- **Trello**: Task board integration for workflow management
- **Slack**: Team communication and notification system
- **Email**: Summary distribution and follow-up communication

### Form and Validation
- **React Hook Form**: Form state management with validation
- **Zod**: TypeScript-first schema validation for data integrity
- **Hookform Resolvers**: Integration between form handling and validation schemas