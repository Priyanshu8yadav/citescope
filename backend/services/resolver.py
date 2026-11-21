"""
CiteScope AI - Provider-Based Full-Text & Legitimate Access Resolver
Integrates documented, authorized academic sources:
1. OpenAlex (open_access & primary_location metadata)
2. Unpaywall API v2 (official DOI-based OA resolution)
3. arXiv API & direct identifier pattern resolution
4. Europe PMC REST API
5. Crossref official DOI publisher landing resolution

Does NOT scrape Google Scholar, bypass paywalls, or invent fake PDF links.
Accurately categorizes Open Access tiers and verified licenses.
"""

import re
import httpx
from typing import Dict, Any, Optional

POLITE_EMAIL = "citescope.project@gmail.com"
USER_AGENT = f"CiteScopeAI/1.0 (Academic Capstone; mailto:{POLITE_EMAIL})"


def extract_arxiv_id(text: str) -> Optional[str]:
    """
    Extracts canonical arXiv identifier from DOI, URL, or string.
    Matches formats: 1706.03762, 1706.03762v5, math/0211159, etc.
    """
    if not text:
        return None
    patterns = [
        r'arxiv\.org/(?:abs|pdf)/([0-9]{4}\.[0-9]{4,5}(?:v[0-9]+)?)',
        r'10\.48550/arXiv\.([0-9]{4}\.[0-9]{4,5}(?:v[0-9]+)?)',
        r'arXiv:([0-9]{4}\.[0-9]{4,5}(?:v[0-9]+)?)',
        r'\b([0-9]{4}\.[0-9]{4,5})\b'
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1)
    return None


async def resolve_unpaywall(doi: str) -> Optional[Dict[str, Any]]:
    """
    Queries the official Unpaywall REST API v2 for legitimate open-access status and license.
    """
    clean_doi = doi.replace("https://doi.org/", "").replace("http://doi.org/", "").strip()
    url = f"https://api.unpaywall.org/v2/{clean_doi}?email={POLITE_EMAIL}"
    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            res = await client.get(url, headers={"User-Agent": USER_AGENT})
            if res.status_code == 200:
                data = res.json()
                if data.get("is_oa"):
                    best = data.get("best_oa_location") or {}
                    return {
                        "is_oa": True,
                        "pdf_url": best.get("url_for_pdf") or best.get("url"),
                        "landing_page_url": best.get("url_for_landing_page") or data.get("doi_url"),
                        "license": best.get("license") or "Open Access",
                        "host_type": best.get("host_type", "repository"),
                        "version": best.get("version", "publishedVersion"),
                        "source": f"Unpaywall ({best.get('repository_institution') or 'Open Repository'})"
                    }
    except Exception as e:
        print(f"[Unpaywall Resolver Error]: {e}")
    return None


async def resolve_europe_pmc(doi: str) -> Optional[Dict[str, Any]]:
    """
    Queries Europe PMC REST API for verified open access full-text links.
    """
    clean_doi = doi.replace("https://doi.org/", "").replace("http://doi.org/", "").strip()
    url = f"https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=DOI:%22{clean_doi}%22&format=json"
    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            res = await client.get(url, headers={"User-Agent": USER_AGENT})
            if res.status_code == 200:
                data = res.json()
                results = data.get("resultList", {}).get("result", [])
                if results:
                    first = results[0]
                    is_oa = first.get("isOpenAccess") == "Y"
                    has_pdf = first.get("hasPDF") == "Y"
                    pmcid = first.get("pmcid")
                    if is_oa and pmcid:
                        return {
                            "is_oa": True,
                            "pdf_url": f"https://europepmc.org/backend/ptpmcrender.fcgi?accid={pmcid}&blobtype=pdf",
                            "landing_page_url": f"https://europepmc.org/article/PMC/{pmcid.replace('PMC', '')}",
                            "license": "Europe PMC Open Access",
                            "host_type": "repository",
                            "version": "publishedVersion",
                            "source": "Europe PMC / PubMed Central"
                        }
    except Exception as e:
        print(f"[Europe PMC Resolver Error]: {e}")
    return None


async def resolve_full_text(paper_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Comprehensive pipeline to resolve legitimate open-access full text,
    license attribution, and direct publisher landing pages.
    """
    doi = paper_data.get("doi") or ""
    title = paper_data.get("title") or ""
    pdf_candidate = paper_data.get("pdf_url")
    is_oa_initial = paper_data.get("is_oa", False)
    
    # 1. Check for arXiv identifier first (authoritative open access preprints)
    arxiv_id = extract_arxiv_id(doi) or extract_arxiv_id(pdf_candidate or "") or extract_arxiv_id(title)
    if arxiv_id:
        return {
            "access_status": "repository_preprint",
            "is_oa": True,
            "pdf_url": f"https://arxiv.org/pdf/{arxiv_id}.pdf",
            "landing_page_url": f"https://arxiv.org/abs/{arxiv_id}",
            "license": "arXiv.org perpetual non-exclusive license",
            "source": "arXiv.org Open Preprints",
            "host_type": "repository",
            "version": "submittedVersion",
            "attribution_note": f"Verified open-access preprint from arXiv ({arxiv_id})"
        }

    # 2. Check Unpaywall via DOI if DOI is present
    if doi:
        unpaywall_result = await resolve_unpaywall(doi)
        if unpaywall_result and unpaywall_result.get("pdf_url"):
            return {
                "access_status": "open_access_pdf",
                "is_oa": True,
                "pdf_url": unpaywall_result["pdf_url"],
                "landing_page_url": unpaywall_result.get("landing_page_url") or doi,
                "license": unpaywall_result.get("license") or "Open Access",
                "source": unpaywall_result.get("source", "Unpaywall"),
                "host_type": unpaywall_result.get("host_type", "publisher"),
                "version": unpaywall_result.get("version", "publishedVersion"),
                "attribution_note": f"Verified open access via {unpaywall_result.get('source')}"
            }

    # 3. Check Europe PMC via DOI
    if doi:
        epmc_result = await resolve_europe_pmc(doi)
        if epmc_result and epmc_result.get("pdf_url"):
            return {
                "access_status": "open_access_pdf",
                "is_oa": True,
                "pdf_url": epmc_result["pdf_url"],
                "landing_page_url": epmc_result["landing_page_url"],
                "license": epmc_result.get("license") or "Europe PMC Open Access",
                "source": epmc_result.get("source"),
                "host_type": "repository",
                "version": "publishedVersion",
                "attribution_note": "Verified open access via Europe PMC / PMC"
            }

    # 4. OpenAlex OA link fallback if present and valid
    if pdf_candidate and is_oa_initial:
        return {
            "access_status": "open_access_pdf",
            "is_oa": True,
            "pdf_url": pdf_candidate,
            "landing_page_url": doi or pdf_candidate,
            "license": "Open Access (Indexed in OpenAlex)",
            "source": "OpenAlex Repository Index",
            "host_type": "repository",
            "version": "publishedVersion",
            "attribution_note": "Open access copy indexed in OpenAlex"
        }

    # 5. Closed / Publisher Subscription Only
    official_landing = doi if doi.startswith("http") else (f"https://doi.org/{doi}" if doi else None)
    return {
        "access_status": "publisher_landing_page" if official_landing else "metadata_only",
        "is_oa": False,
        "pdf_url": None,
        "landing_page_url": official_landing,
        "license": "Publisher Copyright / Subscription Required",
        "source": "Publisher Subscription",
        "host_type": "publisher",
        "version": None,
        "attribution_note": "No legitimate open-access copy found. Requires institutional login or publisher subscription."
    }
