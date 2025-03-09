from rest_framework.response import Response


def api_response(response_type, data=None, errors=None):
    """
    Simple standardized API response
    
    Args:
        response_type (dict): Message dictionary from custom_messages.py
        data: Response data (optional)
        errors: Error details (optional)
    """
    response_body = {
        "message": response_type["message"],
        "status_code": response_type["status_code"],
        "action": response_type["action"],
        "data": data,
        "errors": errors
    }

    return Response(response_body, status=response_type["status_code"])

