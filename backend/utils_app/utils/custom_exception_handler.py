from rest_framework.exceptions import (
    AuthenticationFailed, NotAuthenticated, PermissionDenied,
    ValidationError, Throttled, ErrorDetail
)
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

from utils_app.utils.custom_api_response import api_response
from .custom_messages import ERROR_MESSAGES


def convert_error_detail(error):
    """
    Recursively converts ErrorDetail objects into strings.
    """
    if isinstance(error, ErrorDetail):
        return str(error)
    elif isinstance(error, list):
        return [convert_error_detail(item) for item in error]
    elif isinstance(error, dict):
        return {key: convert_error_detail(value) for key, value in error.items()}
    return error


def custom_exception_handler(exc, context):
    """
    Custom exception handler to properly format errors using standardized message format.
    """


    # Simplify error detail extraction
    if isinstance(exc, (InvalidToken, TokenError)):
        errors = {"detail": "Token is invalid or expired"}
        response_type = ERROR_MESSAGES["TOKEN_INVALID"]
    elif isinstance(exc, ValidationError):
        errors = convert_error_detail(exc.detail) if hasattr(exc, 'detail') else {"detail": "Validation error"}
        response_type = ERROR_MESSAGES["VALIDATION"]
    elif isinstance(exc, PermissionDenied):
        errors = {"detail": "Permission denied"}
        response_type = ERROR_MESSAGES["FORBIDDEN"]
    elif isinstance(exc, (NotAuthenticated, AuthenticationFailed)):
        errors = {"detail": "Authentication required"}
        response_type = ERROR_MESSAGES["UNAUTHORIZED"]
    elif isinstance(exc, Throttled):
        errors = {"detail": "Too many requests"}
        response_type = ERROR_MESSAGES["THROTTLED"]
    else:
        errors = {"detail": str(exc)}
        response_type = ERROR_MESSAGES["SERVER_ERROR"]

    return api_response(
        response_type=response_type,
        errors=errors
    )

