"""
CiteScope AI - Multi-Provider AI Architecture
Supports:
1. Google Gemini API (gemini-1.5-flash, gemini-1.5-pro)
2. OpenAI API (gpt-4o-mini, gpt-4o)
3. Anthropic Claude API (claude-3-5-sonnet, claude-3-haiku)
4. Local Rule-Based NLP Provider (always free, offline, transparently marked)

Provides timeouts, retries, and provider-agnostic completion interfaces.
"""

import os
import httpx
from typing import Dict, Any, Optional

SUPPORTED_PROVIDERS = {
    "local": {
        "name": "Local Rule-Based NLP",
        "description": "Built-in offline extractor. 100% Free, zero external API keys needed.",
        "models": ["local-deterministic-extractor"]
    },
    "gemini": {
        "name": "Google Gemini",
        "description": "Fast and multimodal scholarly analysis via Google AI Studio.",
        "models": ["gemini-1.5-flash", "gemini-1.5-pro"]
    },
    "openai": {
        "name": "OpenAI",
        "description": "High-accuracy synthesis via OpenAI GPT-4o models.",
        "models": ["gpt-4o-mini", "gpt-4o"]
    },
    "anthropic": {
        "name": "Anthropic Claude",
        "description": "Deep academic reasoning via Claude 3.5 models.",
        "models": ["claude-3-5-sonnet-20241022", "claude-3-haiku-20240307"]
    }
}


async def test_provider_key(provider: str, api_key: str, model: Optional[str] = None) -> Dict[str, Any]:
    """
    Tests an API key against the provider with a 1-token test prompt.
    Returns validation status, latency, and detailed error messages.
    """
    if not api_key and provider != "local":
        return {"valid": False, "message": "API key cannot be empty."}

    if provider == "local":
        return {"valid": True, "message": "Local NLP provider is always available and active."}

    elif provider == "gemini":
        target_model = model or "gemini-1.5-flash"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{target_model}:generateContent?key={api_key}"
        payload = {
            "contents": [{"parts": [{"text": "Reply with 'OK'."}]}],
            "generationConfig": {"maxOutputTokens": 5}
        }
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    return {"valid": True, "provider": "gemini", "model": target_model, "message": f"Successfully connected to Gemini ({target_model})"}
                else:
                    err = res.json().get("error", {}).get("message", res.text)
                    return {"valid": False, "message": f"Gemini Error ({res.status_code}): {err}"}
        except Exception as e:
            return {"valid": False, "message": f"Connection failed: {str(e)}"}

    elif provider == "openai":
        target_model = model or "gpt-4o-mini"
        url = "https://api.openai.com/v1/chat/completions"
        headers = {"Authorization": f"Bearer {api_key}"}
        payload = {
            "model": target_model,
            "messages": [{"role": "user", "content": "Reply with 'OK'."}],
            "max_tokens": 5
        }
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.post(url, json=payload, headers=headers)
                if res.status_code == 200:
                    return {"valid": True, "provider": "openai", "model": target_model, "message": f"Successfully connected to OpenAI ({target_model})"}
                else:
                    err = res.json().get("error", {}).get("message", res.text)
                    return {"valid": False, "message": f"OpenAI Error ({res.status_code}): {err}"}
        except Exception as e:
            return {"valid": False, "message": f"Connection failed: {str(e)}"}

    elif provider == "anthropic":
        target_model = model or "claude-3-haiku-20240307"
        url = "https://api.anthropic.com/v1/messages"
        headers = {
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
        payload = {
            "model": target_model,
            "max_tokens": 5,
            "messages": [{"role": "user", "content": "Reply with 'OK'."}]
        }
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.post(url, json=payload, headers=headers)
                if res.status_code == 200:
                    return {"valid": True, "provider": "anthropic", "model": target_model, "message": f"Successfully connected to Anthropic ({target_model})"}
                else:
                    err = res.json().get("error", {}).get("message", res.text)
                    return {"valid": False, "message": f"Anthropic Error ({res.status_code}): {err}"}
        except Exception as e:
            return {"valid": False, "message": f"Connection failed: {str(e)}"}

    return {"valid": False, "message": f"Unknown provider: {provider}"}


async def generate_research_completion(
    prompt: str,
    system_instruction: str = "You are an objective academic research assistant for CiteScope AI. Answer concisely, grounding every statement strictly in the provided paper context.",
    provider: str = "local",
    api_key: Optional[str] = None,
    model: Optional[str] = None
) -> Dict[str, Any]:
    """
    Executes a scholarly reasoning prompt against the specified AI provider.
    Falls back gracefully to local analysis if the provider call fails or rate-limits.
    """
    # Check environment variable fallbacks if api_key not directly passed
    if not api_key:
        if provider == "gemini":
            api_key = os.getenv("GEMINI_API_KEY")
        elif provider == "openai":
            api_key = os.getenv("OPENAI_API_KEY")
        elif provider == "anthropic":
            api_key = os.getenv("ANTHROPIC_API_KEY")

    # If no key available for cloud providers, seamlessly fall back to local
    if provider != "local" and not api_key:
        return {
            "text": None,
            "provider_used": "local",
            "model_used": "local-extractor",
            "fallback": True,
            "note": f"No {provider} API key configured. Using local rule-based extractor."
        }

    try:
        if provider == "gemini" and api_key:
            target_model = model or "gemini-1.5-flash"
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{target_model}:generateContent?key={api_key}"
            payload = {
                "contents": [{"parts": [{"text": f"System Context: {system_instruction}\n\nTask:\n{prompt}"}]}],
                "generationConfig": {"temperature": 0.2, "maxOutputTokens": 1024}
            }
            async with httpx.AsyncClient(timeout=12.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    candidates = res.json().get("candidates", [])
                    if candidates:
                        text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        return {"text": text.strip(), "provider_used": "gemini", "model_used": target_model, "fallback": False}

        elif provider == "openai" and api_key:
            target_model = model or "gpt-4o-mini"
            url = "https://api.openai.com/v1/chat/completions"
            headers = {"Authorization": f"Bearer {api_key}"}
            payload = {
                "model": target_model,
                "messages": [
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.2,
                "max_tokens": 800
            }
            async with httpx.AsyncClient(timeout=12.0) as client:
                res = await client.post(url, json=payload, headers=headers)
                if res.status_code == 200:
                    text = res.json().get("choices", [{}])[0].get("message", {}).get("content", "")
                    return {"text": text.strip(), "provider_used": "openai", "model_used": target_model, "fallback": False}

        elif provider == "anthropic" and api_key:
            target_model = model or "claude-3-5-sonnet-20241022"
            url = "https://api.anthropic.com/v1/messages"
            headers = {
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            }
            payload = {
                "model": target_model,
                "system": system_instruction,
                "max_tokens": 800,
                "messages": [{"role": "user", "content": prompt}]
            }
            async with httpx.AsyncClient(timeout=12.0) as client:
                res = await client.post(url, json=payload, headers=headers)
                if res.status_code == 200:
                    text_parts = res.json().get("content", [])
                    text = "".join(p.get("text", "") for p in text_parts)
                    return {"text": text.strip(), "provider_used": "anthropic", "model_used": target_model, "fallback": False}

    except Exception as e:
        print(f"[AI Provider {provider} failed]: {e}, falling back to local NLP extraction.")

    return {
        "text": None,
        "provider_used": "local",
        "model_used": "local-extractor",
        "fallback": True,
        "note": f"{provider} call timed out or failed. Defaulted to local rule-based extraction."
    }
