# Blood Link Server - A Real-time Blood Donation Management API

Blood Link Server is a comprehensive API that facilitates blood donation management by connecting blood donors with those in need. The system enables real-time blood donation requests, donor matching within geographical proximity, and push notification capabilities to quickly respond to urgent blood needs.

The server provides authentication, user management, and donation coordination features. It supports both personal and third-party blood donation requests with varying urgency levels, geographical tracking of donors, and automated notification systems to alert potential donors. The API is designed to streamline the blood donation process by efficiently matching available donors with recipients based on blood type compatibility and location.

## Repository Structure
```
blood-link-server/
└── docs/                      # API documentation and integration files
    ├── api.md                 # General API documentation
    ├── auth.postman_collection.json       # Authentication endpoints collection
    ├── database.md            # Database schema and configuration
    ├── deployment.md          # Deployment instructions
    ├── development.md         # Development setup and guidelines
    ├── donation.postman_collection.json   # Blood donation management endpoints
    └── user.postman_collection.json       # User management endpoints
```

## Usage Instructions
### Prerequisites
- Node.js runtime environment
- `POSTGIS` or `POSTGRESQL with postgis extension` database
- Postman for API testing

### Installation
1. Clone the repository:
```bash
git clone [repository-url]
cd blood-link-server
```

2. Install dependencies:
```bash
pnpm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

### Quick Start
1. Start the server:
```bash
pnpm start
```

2. Test the API endpoints using the provided Postman collections in the `docs` folder.

### More Detailed Examples

#### Authentication Flow
```javascript
// 1. Register a new user
POST /auth/signup
{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "password": "Password#1",
    "bloodGroup": "O-",
    "primaryLocation": {
        "latitude": 40.2628,
        "longitude": -74.7060
    }
}

// 2. Sign in
POST /auth/signin
{
    "email": "john@example.com",
    "password": "Password#1"
}
```

#### Creating a Blood Donation Request
```javascript
POST /donation/request
{
    "units": 8,
    "urgency": "low",
    "requestLocation": {
        "latitude": -3.7128,
        "longitude": 36.0060
    }
}
```
