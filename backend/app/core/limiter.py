import time
from collections import defaultdict
from threading import Lock
from fastapi import HTTPException, Request, status


class SimpleRateLimiter:
    def __init__(self, requests_per_minute: int = 10):
        self.requests_per_minute = requests_per_minute
        self.requests = defaultdict(list)
        self.lock = Lock()

    def check(self, key: str):
        now = time.time()
        with self.lock:
            # Clean up records older than 60 seconds
            self.requests[key] = [t for t in self.requests[key] if now - t < 60]
            if len(self.requests[key]) >= self.requests_per_minute:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many requests. Please wait a moment before trying again."
                )
            self.requests[key].append(now)

    def reset(self):
        with self.lock:
            self.requests.clear()


# Global limiter instances
login_limiter = SimpleRateLimiter(requests_per_minute=10)
reset_limiter = SimpleRateLimiter(requests_per_minute=5)


def rate_limit_login(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    login_limiter.check(client_ip)


def rate_limit_reset(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    reset_limiter.check(client_ip)
