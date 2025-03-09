from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from .custom_messages import SUCCESS_MESSAGES

class CustomPagination(PageNumberPagination):
    """
    Custom pagination class that follows our standard response format
    """
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100
    page_query_param = 'page'

    def get_paginated_response(self, data):
        """
        Return paginated response with metadata at outer level
        """
        return Response({
            "message": SUCCESS_MESSAGES["RETRIEVE"]["message"],
            "status_code": SUCCESS_MESSAGES["RETRIEVE"]["status_code"],
            "action": SUCCESS_MESSAGES["RETRIEVE"]["action"],
            "count": self.page.paginator.count,
            "next": self.get_next_link(),
            "previous": self.get_previous_link(),
            "current_page": self.page.number,
            "total_pages": self.page.paginator.num_pages,
            "page_size": self.page_size,
            "data": data,
            "errors": None
        }, status=SUCCESS_MESSAGES["RETRIEVE"]["status_code"])

    def get_paginated_response_schema(self, schema):
        """
        Return schema with pagination fields at outer level
        """
        return {
            'type': 'object',
            'properties': {
                'message': {'type': 'string'},
                'status_code': {'type': 'integer'},
                'action': {'type': 'string'},
                'count': {
                    'type': 'integer',
                    'description': 'Total number of items'
                },
                'next': {
                    'type': 'string',
                    'format': 'uri',
                    'nullable': True,
                    'description': 'URL for next page'
                },
                'previous': {
                    'type': 'string',
                    'format': 'uri',
                    'nullable': True,
                    'description': 'URL for previous page'
                },
                'current_page': {
                    'type': 'integer',
                    'description': 'Current page number'
                },
                'total_pages': {
                    'type': 'integer',
                    'description': 'Total number of pages'
                },
                'page_size': {
                    'type': 'integer',
                    'description': 'Number of items per page'
                },
                'data': schema,
                'errors': {
                    'type': 'object',
                    'nullable': True
                }
            }
        } 