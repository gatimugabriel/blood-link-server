# Data Seeding Guide

This doc explains how to do seeding to populate test database with dummy data for testing & development.

## Overview

The data seeding system provides endpoints to create:
- users with diverse blood types and locations 
- Donation requests from different users
- Donations (both scheduled and completed)

## Available Endpoints

### 1. Seed Users
```bash
POST /api/v1/data/seed/users
```
### 2. Seed Donation Requests
```bash
POST /api/v1/data/seed/requests
```

### 3. Seed Donations
```bash
POST /api/v1/data/seed/donations
```

### 4. Seed All Data at Once
```bash
POST /api/v1/data/seed/all
```
Runs all three seeding operations in sequence.


## Usage Instructions

1. **Start server** and ensure the database is running.

2. **Seed users first**:
   ```bash
   curl -X POST http://localhost:3000/api/v1/data/seed/users
   ```

3. **Seed donation requests**:
   ```bash
   curl -X POST http://localhost:3000/api/v1/data/seed/requests
   ```

4. **Seed donations**:
   ```bash
   curl -X POST http://localhost:3000/api/v1/data/seed/donations
   ```

5. **Or seed everything at once**:
   ```bash
   curl -X POST http://localhost:3000/api/v1/data/seed/all
   ```

## Notes

- Running the seeding process is multiple times will create duplicate data
- The system automatically handles blood type compatibility when creating donations
- All locations are structured to be within a 50km radius of Nairobi for realistic proximity-based matching