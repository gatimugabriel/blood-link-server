# API Documentation

## Base URL
```
https://api.blood-link.ke/v1
```

## Authentication
API endpoints that require auth use an issued accessToken(JWT) during signin. These endpoints are marked to help you know they require auth

```
Authorization: Bearer <your_accessToken>
```

## API Endpoints

### Authentication

#### Register User
```http
POST /auth/signup
Content-Type: application/json

{
    "email": "user@example.com",
    "password": "securepassword",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890"
}
```

Response:
```json
{
    "status": "success",
    "data": {
        "userId": "uuid-here",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe"
    }
}
```

#### Login
```http
POST /auth/signin
Content-Type: application/json

{
    "email": "user@example.com",
    "password": "securepassword"
}
```

Response:
```json
{
    "status": "success",
    "data": {
        "accessToken": "jwttoken",
        "refreshToken": "jwttoken",
    }
}
```

