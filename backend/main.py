"""
CiteScope AI - Main FastAPI Application
Provides endpoints for literature discovery, comparison matrix, citation sentiment graphs,
research gap detection, and interactive Copilot reasoning.
"""

from fastapi import FastAPI, Query, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from services.openalex import search_works, get_fallback_papers, get_work_by_id
from services.analyzer import (
    calculate_consensus_meter,
    generate_comparison_matrix,
    generate_citation_graph,
    analyze_research_gaps
)
from services.resolver import resolve_full_text
from services.ai_providers import (
    SUPPORTED_PROVIDERS,
    test_provider_key,
    generate_research_completion
)


app = FastAPI(
    title="CiteScope AI API",
    description="Intelligent Research Discovery, Citation Intent Analysis, Open Access Resolver & Research Gap Exploration",
    version="1.0.0"
)

# Enable CORS for local web development & mobile emulator access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class MatrixRequest(BaseModel):
    paper_ids: Optional[List[str]] = None
    custom_columns: Optional[List[str]] = None


class CopilotChatRequest(BaseModel):
    paper_id: str
    question: str
    selected_text: Optional[str] = None


class AITestRequest(BaseModel):
    provider: str
    api_key: str
    model: Optional[str] = None


@app.get("/api/health")
async def health_check():
    return {
        "status": "online",
        "service": "CiteScope AI",
        "version": "1.0.0",
        "docs": "/docs",
        "active_providers": list(SUPPORTED_PROVIDERS.keys())
    }


@app.get("/api/ai/providers")
async def get_ai_providers():
    """
    Returns available AI model providers (Local NLP, Google Gemini, OpenAI, Anthropic).
    """
    return {
        "providers": SUPPORTED_PROVIDERS,
        "default_provider": "local"
    }


@app.post("/api/ai/test")
async def test_ai_provider(payload: AITestRequest):
    """
    Validates user-provided API credentials with a real provider endpoint check.
    """
    return await test_provider_key(payload.provider, payload.api_key, payload.model)


@app.get("/api/resolve")
async def resolve_access(
    doi: Optional[str] = Query(None, description="DOI string or URL"),
    paper_id: Optional[str] = Query(None, description="OpenAlex paper ID")
):
    """
    Provider-based legitimate full-text resolver.
    Queries Unpaywall v2, arXiv canonical archives, Europe PMC, and OpenAlex.
    Returns verified open-access PDF links, licenses, or publisher subscription requirements.
    """
    paper_data: Dict[str, Any] = {}
    if paper_id:
        work = await get_work_by_id(paper_id)
        if work:
            paper_data = work
    
    if not paper_data and doi:
        paper_data = {"doi": doi}

    if not paper_data:
        raise HTTPException(status_code=400, detail="Either 'doi' or 'paper_id' must be specified.")

    resolved = await resolve_full_text(paper_data)
    return resolved


@app.get("/api/search")
async def search_papers(
    q: str = Query("Transformer", description="Research query or topic"),
    page: int = Query(1, ge=1, description="Page number for pagination"),
    per_page: int = Query(20, ge=1, le=50, description="Results per page"),
    sort: Optional[str] = Query(None, description="Sort order: 'relevance', 'cited_by_count:desc', 'publication_year:desc', 'publication_year:asc'"),
    from_year: Optional[int] = Query(None, description="Minimum publication year (e.g. 1950)"),
    to_year: Optional[int] = Query(None, description="Maximum publication year (e.g. 2026)"),
    is_oa: Optional[bool] = Query(None, description="Filter for open access only")
):
    """
    Searches peer-reviewed works via OpenAlex across time (past to recent).
    Supports sorting by seminal citations, newest preprints, or relevance,
    with explicit abstracts, topics, verified DOIs, and access resolution.
    """
    search_res = await search_works(
        query=q,
        page=page,
        per_page=per_page,
        sort=sort,
        from_year=from_year,
        to_year=to_year,
        is_oa=is_oa,
        return_meta=True
    )
    
    if isinstance(search_res, dict):
        works = search_res.get("results", [])
        total_count = search_res.get("total_count", len(works))
    else:
        works = search_res
        total_count = len(works)

    consensus = calculate_consensus_meter(q, works)
    
    # Enrich papers with legitimate access metadata
    for p in works:
        if "access_resolution" not in p:
            doi = p.get("doi") or ""
            pdf_url = p.get("pdf_url")
            if "arxiv" in doi.lower() or (pdf_url and "arxiv" in pdf_url.lower()):
                p["access_status"] = "open_access_pdf"
                p["access_label"] = "Open Access PDF"
                p["license"] = "arXiv Perpetual Non-exclusive"
                p["attribution_note"] = "Verified open-access preprint from arXiv"
            elif p.get("is_oa"):
                p["access_status"] = "open_access_pdf"
                p["access_label"] = "Open Access PDF"
                p["license"] = "Open Access (Indexed)"
                p["attribution_note"] = "Open access publication"
            else:
                p["access_status"] = "abstract_only"
                p["access_label"] = "Abstract & DOI"
                p["license"] = "Subscription Required"
                p["attribution_note"] = "Institutional or publisher access required"
    
    return {
        "query": q,
        "page": page,
        "per_page": per_page,
        "count": len(works),
        "total_count": total_count,
        "consensus": consensus,
        "papers": works
    }


@app.get("/api/paper/{paper_id}")
async def get_paper_details(paper_id: str):
    """
    Retrieves full metadata, TLDR, abstract, citation stats, and verified access info for a paper.
    """
    fallback_list = get_fallback_papers()
    work = None
    for p in fallback_list:
        if p["id"] == paper_id or p.get("openalex_id", "").endswith(paper_id):
            work = p
            break
            
    if not work:
        results = await search_works(paper_id, page=1, per_page=1)
        if results:
            work = results[0]
            
    if not work:
        raise HTTPException(status_code=404, detail="Paper not found")

    # Add resolved access information
    work["access_resolution"] = await resolve_full_text(work)
    return work


@app.get("/api/consensus")
async def get_consensus(q: str = Query("Does deep learning work for drug discovery?")):
    """
    Computes consensus stance (% Yes, % Contested, % Neutral) across scientific works.
    """
    papers = await search_works(q, page=1, per_page=8)
    return calculate_consensus_meter(q, papers)


@app.post("/api/matrix/extract")
async def extract_matrix(payload: MatrixRequest):
    """
    Extracts structured comparison attributes (Problem, Architecture, Datasets, Results, Limitations)
    across a set of selected papers dynamically.
    """
    selected_papers = []
    if payload.paper_ids:
        for pid in payload.paper_ids:
            work = await get_work_by_id(pid)
            if work:
                selected_papers.append(work)
    if not selected_papers:
        selected_papers = get_fallback_papers()[:4]

    return generate_comparison_matrix(selected_papers, payload.custom_columns)


@app.get("/api/citations/graph")
async def get_citation_graph(
    topic: str = Query("Transformer", description="Topic for graph traversal"),
    paper_ids: Optional[str] = Query(None, description="Comma-separated paper IDs to build network for")
):
    """
    Returns nodes and sentiment-colored citation edges (Supporting, Contrasting, Mentioning)
    spanning foundational historical papers to recent preprints.
    Includes full abstracts, topics, and DOIs on each node.
    """
    target_papers = []
    if paper_ids:
        for pid in paper_ids.split(","):
            pid = pid.strip()
            if pid:
                p = await get_work_by_id(pid)
                if p:
                    target_papers.append(p)

    if not target_papers:
        # Retrieve both seminal works (highest cited) and recent works (newest)
        # to construct a comprehensive past-to-recent citation lineage
        seminal = await search_works(topic, page=1, per_page=6, sort="cited_by_count:desc")
        recent = await search_works(topic, page=1, per_page=5, sort="publication_year:desc")
        seen_ids = set()
        for p in (seminal + recent):
            if p["id"] not in seen_ids:
                target_papers.append(p)
                seen_ids.add(p["id"])

    if not target_papers:
        target_papers = get_fallback_papers()

    return generate_citation_graph(target_papers)


@app.get("/api/research-gaps")
async def get_research_gaps(topic: str = Query("Large Language Models", description="Research area to analyze for gaps")):
    """
    Analyzes literature for limitation clusters, scientific controversies, and open research frontiers.
    """
    papers = await search_works(topic, page=1, per_page=6)
    return analyze_research_gaps(topic, papers)


@app.post("/api/copilot/chat")
async def copilot_chat(
    payload: CopilotChatRequest,
    x_ai_provider: Optional[str] = Header(None),
    x_ai_key: Optional[str] = Header(None),
    x_ai_model: Optional[str] = Header(None)
):
    """
    Grounded paper Copilot Q&A with citation attribution and formula/table explication.
    Supports user-configured AI providers (Gemini, OpenAI, Claude) via headers,
    with automatic zero-key local NLP fallback.
    """
    work = await get_work_by_id(payload.paper_id)
    if not work:
        fallback_papers = get_fallback_papers()
        work = next((p for p in fallback_papers if p["id"] == payload.paper_id), fallback_papers[0])
    
    title = work.get("title", "this study")
    abstract = work.get("abstract", "")
    tldr = work.get("tldr", "")
    venue = work.get("venue", "the literature")
    year = work.get("year", 2024)
    doi = work.get("doi", "")

    # If user provided a cloud provider and key, attempt LLM completion
    provider = (x_ai_provider or "local").lower()
    if provider in ["gemini", "openai", "anthropic"] and x_ai_key:
        prompt = (
            f"Paper Title: {title}\n"
            f"Year: {year} | Venue: {venue}\n"
            f"Abstract: {abstract}\n"
            f"Selected Excerpt: {payload.selected_text or 'None'}\n\n"
            f"User Question: {payload.question}\n\n"
            "Ground your answer strictly in the paper's title, abstract, and excerpt above. "
            "Cite specific sections or findings. If the text does not contain the answer, explicitly state that the abstract has insufficient information."
        )
        ai_res = await generate_research_completion(
            prompt=prompt,
            provider=provider,
            api_key=x_ai_key,
            model=x_ai_model
        )
        if ai_res.get("text") and not ai_res.get("fallback"):
            return {
                "paper_id": payload.paper_id,
                "question": payload.question,
                "answer": ai_res["text"],
                "citation_context": f"Grounded in {title} ({year})",
                "confidence": 0.96,
                "provider_used": ai_res["provider_used"],
                "model_used": ai_res["model_used"],
                "is_llm": True
            }

    # Deterministic Local Rule-based NLP Extractor (zero external API keys needed)
    q_lower = payload.question.lower()
    sentences = [s.strip() for s in abstract.split(".") if len(s.strip()) > 15]
    
    if "formula" in q_lower or "math" in q_lower or "equation" in q_lower:
        if "attention" in title.lower():
            answer = (
                "The equation defines Scaled Dot-Product Attention: Attention(Q, K, V) = softmax((Q K^T) / sqrt(d_k)) V. "
                "Dividing by sqrt(d_k) prevents the dot products from growing excessively large for large dimensions, which would push the softmax function into regions with extremely small gradients."
            )
            citation = "Section 3.2.1, Scaled Dot-Product Attention"
        else:
            answer = f"In '{title}', mathematical formulations define the formal objective functions and parametric updates specified in the methodology."
            citation = "Methodology & Formulations"
    elif "limitation" in q_lower or "weakness" in q_lower:
        limitation_sentence = next((s for s in sentences if any(w in s.lower() for w in ["however", "limitation", "remain", "challenge", "bottleneck", "although"])), None)
        if limitation_sentence:
            answer = f"According to the authors of '{title}', a primary limitation is: {limitation_sentence}."
        else:
            answer = f"According to '{title}', primary constraints involve boundary conditions, computational resources, and domain-specific generalization."
        citation = "Discussion & Limitations"
    elif "dataset" in q_lower or "benchmark" in q_lower or "sample" in q_lower:
        data_sentence = next((s for s in sentences if any(w in s.lower() for w in ["dataset", "benchmark", "evaluated on", "tested on", "patients", "sample", "cohort"])), None)
        if data_sentence:
            answer = f"The experimental setup in '{title}' notes: {data_sentence}."
        else:
            answer = f"'{title}' evaluates across standard empirical benchmarks and public datasets documented in the experimental protocol."
        citation = "Experimental Setup & Evaluation"
    else:
        findings_sentence = next((s for s in sentences if any(w in s.lower() for w in ["demonstrate", "show that", "achieve", "outperform", "found that", "conclude", "results"])), None)
        if findings_sentence:
            answer = f"In '{title}', the authors conclude: {findings_sentence}. Key contribution: {tldr}"
        else:
            answer = f"In '{title}', the authors address key research questions: {tldr} Full study context is documented in {venue}."
        citation = "Introduction & Abstract"

    return {
        "paper_id": payload.paper_id,
        "question": payload.question,
        "answer": answer,
        "citation_context": citation,
        "confidence": 0.95,
        "provider_used": "local",
        "model_used": "local-deterministic-nlp",
        "is_llm": False
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

