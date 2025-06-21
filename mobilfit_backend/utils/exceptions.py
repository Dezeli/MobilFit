from rest_framework.views import exception_handler
from rest_framework.exceptions import ValidationError, NotAuthenticated, AuthenticationFailed
from rest_framework import status

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        message = "요청 처리 중 오류가 발생했습니다."
        error_code = None

        if isinstance(exc, ValidationError):
            message = "입력값이 유효하지 않습니다."
            error_code = "VALIDATION_ERROR"
        elif isinstance(exc, NotAuthenticated):
            message = "인증 정보가 필요합니다."
            error_code = "NOT_AUTHENTICATED"
        elif isinstance(exc, AuthenticationFailed):
            message = "인증에 실패했습니다."
            error_code = "AUTH_FAILED"
        elif response.data.get('detail'):
            message = response.data['detail']
            error_code = "UNKNOWN_ERROR"

        response.data = {
            "success": False,
            "data": {
                "message": message,
                "error_code": error_code
            }
        }

    return response
