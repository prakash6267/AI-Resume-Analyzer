import pytest
import io
from fastapi import Request, HTTPException
from fastapi.testclient import TestClient
from unittest.mock import MagicMock

from app.main import app
from app.config import settings
from app.security import RateLimiter

client = TestClient(app)

def test_health_check_does_not_leak_key():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert "ai_ready" in data
    assert isinstance(data["ai_ready"], bool)
    # Ensure no API key or sensitive environment variable is leaked in payload
    assert "GEMINI_API_KEY" not in data
    assert "key" not in data
    assert "api_key" not in data

def test_rate_limiter_per_minute_cap():
    limiter = RateLimiter()
    mock_request = MagicMock(spec=Request)
    mock_request.headers = {}
    mock_request.client.host = "192.168.1.100"

    # Make up to limit requests
    for _ in range(settings.RATE_LIMIT_PER_MINUTE_PER_IP):
        limiter.check_and_record(mock_request)

    # The next request should be rejected with 429
    with pytest.raises(HTTPException) as exc_info:
        limiter.check_and_record(mock_request)
    
    assert exc_info.value.status_code == 429
    assert exc_info.value.detail == "AI service is busy, please try again in a minute."

def test_rate_limiter_daily_ip_cap():
    limiter = RateLimiter()
    mock_request = MagicMock(spec=Request)
    mock_request.headers = {}
    mock_request.client.host = "192.168.1.101"

    # Simulate hitting the daily IP cap directly
    current_day = limiter._get_current_day_key()
    limiter._daily_ip_requests["192.168.1.101"] = (current_day, settings.DAILY_CAP_PER_IP)

    with pytest.raises(HTTPException) as exc_info:
        limiter.check_and_record(mock_request)
    
    assert exc_info.value.status_code == 429
    assert exc_info.value.detail == "AI service is busy, please try again in a minute."

def test_rate_limiter_global_daily_cap():
    limiter = RateLimiter()
    mock_request = MagicMock(spec=Request)
    mock_request.headers = {}
    mock_request.client.host = "192.168.1.102"

    current_day = limiter._get_current_day_key()
    limiter._global_daily_requests = (current_day, settings.GLOBAL_DAILY_CAP)

    with pytest.raises(HTTPException) as exc_info:
        limiter.check_and_record(mock_request)
    
    assert exc_info.value.status_code == 429
    assert exc_info.value.detail == "AI service is busy, please try again in a minute."

def test_rate_limiter_x_forwarded_for():
    limiter = RateLimiter()
    mock_request = MagicMock(spec=Request)
    mock_request.headers = {"X-Forwarded-For": "203.0.113.195, 70.41.3.18"}
    mock_request.client = None

    client_ip = limiter.get_client_ip(mock_request)
    assert client_ip == "203.0.113.195"

def test_file_size_limit_rejection():
    # Attempt to upload a file > 5MB
    large_payload = b"%PDF-1.4 " + b"0" * (6 * 1024 * 1024) # 6MB
    files = {"file": ("large_resume.pdf", io.BytesIO(large_payload), "application/pdf")}
    
    response = client.post("/api/ats/upload", files=files)
    assert response.status_code == 400
    assert "File size exceeds maximum allowed" in response.json()["detail"]
