from rest_framework.views import exception_handler


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None and isinstance(response.data, dict) and "code" not in response.data:
        response.data = {
            "code": "validation_error" if response.status_code == 400 else "request_error",
            "details": response.data,
        }
    return response
