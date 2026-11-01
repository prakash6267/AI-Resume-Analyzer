import time
import logging
from collections import defaultdict
from typing import Dict, List, Tuple
from fastapi import Request, HTTPException

from app.config import settings

logger = logging.getLogger(__name__)

class RateLimiter:
    def __init__(self):
        # Maps IP -> list of request timestamps in the last 60 seconds
        self._minute_requests: Dict[str, List[float]] = defaultdict(list)
        # Maps IP -> (day_key, count)
        self._daily_ip_requests: Dict[str, Tuple[str, int]] = {}
        # Global daily requests: (day_key, count)
        self._global_daily_requests: Tuple[str, int] = ("", 0)

    def _get_current_day_key(self) -> str:
        return time.strftime("%Y-%m-%d", time.gmtime())

    def get_client_ip(self, request: Request) -> str:
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # Take first IP in chain
            return forwarded_for.split(",")[0].strip()
        if request.client and request.client.host:
            return request.client.host
        return "127.0.0.1"

    def check_and_record(self, request: Request) -> None:
        client_ip = self.get_client_ip(request)
        now = time.time()
        current_day = self._get_current_day_key()

        # 1. Global Daily Cap Check
        g_day, g_count = self._global_daily_requests
        if g_day != current_day:
            self._global_daily_requests = (current_day, 0)
            g_count = 0

        if g_count >= settings.GLOBAL_DAILY_CAP:
            logger.warning(f"Global daily AI request limit reached ({settings.GLOBAL_DAILY_CAP}).")
            raise HTTPException(
                status_code=429,
                detail="AI service is busy, please try again in a minute."
            )

        # 2. Per-IP Daily Cap Check
        ip_day, ip_count = self._daily_ip_requests.get(client_ip, (current_day, 0))
        if ip_day != current_day:
            ip_count = 0

        if ip_count >= settings.DAILY_CAP_PER_IP:
            logger.warning(f"Client IP {client_ip} reached daily limit ({settings.DAILY_CAP_PER_IP}).")
            raise HTTPException(
                status_code=429,
                detail="AI service is busy, please try again in a minute."
            )

        # 3. Per-IP Per-Minute Rate Limit Check
        minute_window = [t for t in self._minute_requests[client_ip] if now - t < 60.0]
        self._minute_requests[client_ip] = minute_window

        if len(minute_window) >= settings.RATE_LIMIT_PER_MINUTE_PER_IP:
            logger.warning(f"Client IP {client_ip} exceeded per-minute rate limit ({settings.RATE_LIMIT_PER_MINUTE_PER_IP}/min).")
            raise HTTPException(
                status_code=429,
                detail="AI service is busy, please try again in a minute."
            )

        # Record valid request
        self._minute_requests[client_ip].append(now)
        self._daily_ip_requests[client_ip] = (current_day, ip_count + 1)
        self._global_daily_requests = (current_day, g_count + 1)

rate_limiter = RateLimiter()
