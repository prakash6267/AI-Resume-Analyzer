"""
Backward compatibility wrapper - routes all legacy gemini_service calls 
to the new multi-provider LLMOrchestrator.
"""
from app.services.llm_orchestrator import llm_orchestrator, LLMOrchestrator

gemini_service = llm_orchestrator
GeminiService = LLMOrchestrator
