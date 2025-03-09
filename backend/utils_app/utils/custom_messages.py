# Standard Response Messages
SUCCESS_MESSAGES = {
    "CREATE": {
        "message": "Data created successfully",
        "status_code": 201,
        "action": "created"
    },
    "UPDATE": {
        "message": "Data updated successfully",
        "status_code": 200,
        "action": "updated"
    },
    "DELETE": {
        "message": "Data deleted successfully",
        "status_code": 200,
        "action": "deleted"
    },
    "RETRIEVE": {
        "message": "Data retrieved successfully",
        "status_code": 200,
        "action": "retrieved"
    }
}

# Error Messages
ERROR_MESSAGES = {
    "NOT_FOUND": {
        "message": "Data not found",
        "status_code": 404,
        "action": "not_found"
    },
    "VALIDATION": {
        "message": "Validation error occurred",
        "status_code": 400,
        "action": "validation_error"
    },
    "UNAUTHORIZED": {
        "message": "Authentication required",
        "status_code": 401,
        "action": "unauthorized"
    },
    "FORBIDDEN": {
        "message": "Permission denied",
        "status_code": 403,
        "action": "forbidden"
    },
    "SERVER_ERROR": {
        "message": "Internal server error",
        "status_code": 500,
        "action": "server_error"
    },
    "TOKEN_INVALID": {
        "message": "Invalid or expired token",
        "status_code": 401,
        "action": "token_invalid"
    }
}

# Auth Messages
AUTH_MESSAGES = {
    "LOGIN_SUCCESS": {
        "message": "Login successful",
        "status_code": 200,
        "action": "login_success"
    },
    "LOGOUT_SUCCESS": {
        "message": "Logout successful",
        "status_code": 200,
        "action": "logout_success"
    },
    "SIGNUP_SUCCESS": {
        "message": "Registration successful",
        "status_code": 201,
        "action": "signup_success"
    }
} 