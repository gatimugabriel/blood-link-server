# BloodLink Server

## Overview
This is a real-time blood donation and connection app system built with Node, Typescript, PostgreSQL and Redis. The system provides functionalities for Donation Request, Real-Time Notifications(push, email and sms notifications), Donation Fufilling, user management, data forecasting(To be introduced once app matures).

## Table of Contents
- [BloodLink Server](#bloodlink-server)
  - [Overview](#overview)
  - [Table of Contents](#table-of-contents)
  - [Architecture](#architecture)
  - [Code Structure](#code-structure)
  - [Features](#features)
  - [Prerequisites](#prerequisites)
  - [Setup \& Installation](#setup--installation)
    - [Manual Setup](#manual-setup)
    - [Docker Setup](#docker-setup)
  - [Data Flow](#data-flow)
  - [Troubleshooting](#troubleshooting)
    - [Common Issues](#common-issues)
  - [API Documentation](#api-documentation)
  - [Database Schema](#database-schema)
  - [Development Guidelines](#development-guidelines)
  - [Deployment](#deployment)

## Architecture
![Architecture Diagram](docs/images/architecture.png)

The system follows a domain driven design (DDD) architecture with the following components:
- **API**: Handles routing and authentication
- **User Service**: Manages user accounts and authentication
- **Donation Service**: Handles blood donation requests and matching
- **Health Facility Service**: Manages health facility information
- **Report Service**: Handles data reporting and analytics
- **Notification Service**: Manages email and SMS(to be added later) notifications

## Code Structure
As explained above, the system adopts a domain driven design where each domain has its own entities(model(s) definition), repository(for database interaction & data persistence), service(business logic) 
. I adopted this structure as:
  1. It scales easily
  2. Easier to debug
  3. Not complex enough to be like them, but somehow separates concern like microservices

The structure
```plaintext
.
├── diagrams
├── docs
└── src
    ├── api
    │   ├── controller
    │   ├── middleware
    │   │   ├── auth
    │   │   └── inputValidation
    │   └── routes
    ├── application
    │   ├── config
    │   ├── dtos
    │   └── services
    ├── domain
    │   ├── aggregates
    │   ├── entity
    │   ├── repositories
    │   └── value-objects
    ├── infrastructure
    │   ├── bull
    │   │   ├── queues
    │   │   └── workers
    │   └── database
    │       ├── data
    │       ├── migrations
    │       └── raw_queries
    ├── security
    ├── types
    └── utils
```


## Features
- User Authentication and Profile Management
- Blood Donation Request Creation and Management
- Real-time Donor Matching
- Health Facility Management
- Push/Email/SMS Notifications
- Donation History Tracking
- Admin Dashboard and Reporting

## Prerequisites
- Node.js 14+
- PostgreSQL 14+
- Docker & Docker Compose (for containerized setup)
- pnpm (package manager)

## Setup & Installation

### Manual Setup
1. Clone the repository
```bash
git clone https://github.com/gatimiugabriel/blood-link-server
cd blood-link-server
```

2. Set up the database
```bash
psql -U postgres
CREATE DATABASE blood_link;
```

3. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Install dependencies
```bash
pnpm install
```

5. Run migrations
```bash
pnpm run migration
```

6. Start the server
```bash
pnpm run dev
```

### Docker Setup
1. Clone the repository
```bash
git clone https://github.com/gatimugabriel/blood-link-server
cd blood-link-server
```

2. Build and run with Docker Compose
```bash
docker-compose up --build
```

The application will be available at `http://localhost:8080`


## Data Flow
The Blood Link Server processes donation requests and matches them with potential donors through a location-based matching system.

```ascii
User Request -> Auth Layer -> Business Logic -> Notification System
     |              |             |                    |
     v              v             v                    v
  Location     Validation    Donor Match        Push Message
   Data          Layer        Algorithm         to Donors
```

Key Component Interactions:
1. Authentication service validates user credentials and manages sessions
2. Geolocation service tracks donor and request locations
3. Matching engine finds compatible donors within specified radius
4. Notification service alerts potential donors of nearby requests
5. Request management tracks donation status and updates
6. User service manages donor profiles and preferences
7. Security layer ensures data privacy and access control

## Troubleshooting

### Common Issues

1. Authentication Failures
- Error: "Invalid token"
  - Verify token expiration
  - Ensure proper token format in Authorization header
  - Use refresh token endpoint to get new access token

2. Geolocation Issues
- Error: "Invalid coordinates"
  - Ensure latitude is between -90 and 90
  - Ensure longitude is between -180 and 180
  - Check coordinate format (decimal degrees)

3. Push Notification Failures
  - Error: "FCM token invalid"
  - Verify FCM token is properly registered
  - On client-side, ensure device has proper permissions

## API Documentation
Detailed API documentation can be found in [docs/api.md](docs/api.md)

## Database Schema
Database schema and relationships are documented in [docs/database.md](docs/database.md)

## Development Guidelines
Please refer to [docs/development.md](docs/development.md) for coding standards, best practices, and contribution guidelines.

## Deployment
Deployment instructions and considerations can be found in [docs/deployment.md](docs/deployment.md)