import time

from .metrics import HTTP_ERRORS, HTTP_LATENCY, HTTP_REQUESTS


class PrometheusMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        started = time.perf_counter()
        response = self.get_response(request)
        route = getattr(getattr(request, "resolver_match", None), "route", None) or "unmatched"
        labels = {"method": request.method, "route": route, "status": str(response.status_code)}
        HTTP_REQUESTS.labels(**labels).inc()
        HTTP_LATENCY.labels(method=request.method, route=route).observe(
            time.perf_counter() - started
        )
        if response.status_code >= 400:
            HTTP_ERRORS.labels(**labels).inc()
        return response
