import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Sparkles,
  Table as TableIcon,
  GitFork,
  Lightbulb,
  BookOpen,
  ExternalLink,
  Plus,
  Download,
  CheckCircle2,
  AlertCircle,
  Sliders,
  RefreshCw,
  X,
  Unlock,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ArrowUpDown,
  Settings,
  HelpCircle,
  FileSpreadsheet,
  Trash2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Calendar,
  Tag,
  Quote,
  Layers
} from 'lucide-react';

interface Paper {
  id: string;
  openalex_id?: string;
  doi?: string;
  landing_url?: string;
  title: string;
  authors: string[];
  year: number;
  venue: string;
  citation_count: number;
  influential_citations: number;
  abstract: string;
  tldr: string;
  pdf_url?: string;
  is_oa?: boolean;
  access_status?: string;
  access_label?: string;
  license?: string;
  attribution_note?: string;
  topics?: string[];
  concepts?: { name: string; score: number }[];
}

interface TraceableStudy {
  id: string;
  title: string;
  authors: string;
  year: number;
  venue: string;
  citation_count?: number;
  evidence: string;
  stance: string;
  doi?: string;
  landing_url?: string;
  pdf_url?: string;
  is_oa?: boolean;
  access_status?: string;
  access_label?: string;
}

interface ConsensusData {
  query: string;
  is_question?: boolean;
  sample_size: number;
  stance: {
    affirmative: number;
    neutral_or_mixed: number;
    negative_or_disputing: number;
  };
  stance_counts?: {
    affirmative: number;
    neutral_or_mixed: number;
    negative_or_disputing: number;
  };
  synthesis: string;
  rigor_rating: string;
  traceable_studies?: TraceableStudy[];
}

interface MatrixRow {
  paper_id: string;
  paper_title: string;
  year: number;
  authors: string;
  cells: Record<string, string>;
}

interface GraphData {
  nodes: Array<{
    id: string;
    title: string;
    short_label: string;
    year: number;
    citations: number;
    authors: string[];
    venue: string;
    doi?: string;
    landing_url?: string;
    pdf_url?: string;
    is_oa?: boolean;
    access_status?: string;
    access_label?: string;
    abstract?: string;
    tldr?: string;
    topics?: string[];
    radius?: number;
    x: number;
    y: number;
    timeline_x?: number;
    timeline_y?: number;
  }>;
  edges: Array<{
    source: string;
    target: string;
    intent: 'supporting' | 'contrasting' | 'mentioning';
    section: string;
    snippet: string;
    confidence: number;
  }>;
  metrics?: {
    total_nodes: number;
    total_edges: number;
    supporting_count: number;
    contrasting_count: number;
    mentioning_count: number;
  };
}

interface GapData {
  topic: string;
  limitation_clusters: Array<{
    cluster_name: string;
    severity: string;
    affected_papers: string[];
    description: string;
    emerging_solution: string;
  }>;
  contradiction_pairs: Array<{
    paper_a: string;
    paper_b: string;
    dispute_point: string;
    details: string;
  }>;
  unexplored_frontiers: Array<{
    title: string;
    untested_intersection: string;
    opportunity_score: string;
    thesis_feasibility: string;
    suggested_methodology: string;
  }>;
}

const DEFAULT_BENCHMARK_PAPERS: Paper[] = [
  {
    id: 'W3125678901',
    doi: 'https://doi.org/10.48550/arXiv.1706.03762',
    title: 'Attention Is All You Need',
    authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar', 'Jakob Uszkoreit', 'Llion Jones'],
    year: 2017,
    venue: 'Advances in Neural Information Processing Systems (NeurIPS)',
    citation_count: 134210,
    influential_citations: 18240,
    abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train.',
    tldr: 'Introduced the Transformer architecture, replacing recurrent and convolutional layers entirely with multi-head self-attention.',
    pdf_url: 'https://arxiv.org/pdf/1706.03762.pdf',
    is_oa: true,
    access_status: 'repository_preprint',
    license: 'arXiv Perpetual Non-exclusive',
    attribution_note: 'Verified open-access preprint from arXiv (1706.03762)'
  },
  {
    id: 'W2963403868',
    doi: 'https://doi.org/10.48550/arXiv.1810.04805',
    title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
    authors: ['Jacob Devlin', 'Ming-Wei Chang', 'Kenton Lee', 'Kristina Toutanova'],
    year: 2018,
    venue: 'NAACL-HLT 2019',
    citation_count: 98450,
    influential_citations: 12430,
    abstract: 'We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers. Unlike recent language representation models, BERT is designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers. As a result, the pre-trained BERT model can be fine-tuned with just one additional output layer to create state-of-the-art models for a wide range of tasks.',
    tldr: 'Developed deep bidirectional representation learning via masked language modeling and next sentence prediction.',
    pdf_url: 'https://arxiv.org/pdf/1810.04805.pdf',
    is_oa: true,
    access_status: 'repository_preprint',
    license: 'arXiv Perpetual Non-exclusive',
    attribution_note: 'Verified open-access preprint from arXiv'
  },
  {
    id: 'W3032549211',
    doi: 'https://doi.org/10.48550/arXiv.2005.14165',
    title: 'Language Models are Few-Shot Learners',
    authors: ['Tom B. Brown', 'Benjamin Mann', 'Nick Ryder', 'Melanie Subbiah', 'Jared Kaplan'],
    year: 2020,
    venue: 'NeurIPS 2020',
    citation_count: 52180,
    influential_citations: 8410,
    abstract: 'Recent work has demonstrated substantial gains on many NLP tasks and benchmarks by pre-training on a large corpus of text followed by fine-tuning on a specific task. While typically task-agnostic in architecture, this method still requires task-specific fine-tuning datasets of thousands or tens of thousands of examples. Here we show that scaling up language models greatly improves task-agnostic, few-shot performance, sometimes even reaching competitiveness with prior state-of-the-art fine-tuning approaches.',
    tldr: 'Demonstrated that scaling autoregressive language models (GPT-3, 175B parameters) enables in-context few-shot task adaptation without fine-tuning.',
    pdf_url: 'https://arxiv.org/pdf/2005.14165.pdf',
    is_oa: true,
    access_status: 'repository_preprint',
    license: 'arXiv Perpetual Non-exclusive'
  },
  {
    id: 'W4389201948',
    doi: 'https://doi.org/10.48550/arXiv.2312.00752',
    title: 'Mamba: Linear-Time Sequence Modeling with Selective State Spaces',
    authors: ['Albert Gu', 'Tri Dao'],
    year: 2023,
    venue: 'arXiv preprint',
    citation_count: 2840,
    influential_citations: 410,
    abstract: 'Foundation models, now powering most of the exciting applications in deep learning, are almost universally based on the Transformer architecture and its core attention module. Many subquadratic-time architectures such as linear attention, gated convolutions, and structured state space models (SSMs) have been developed to address Transformers computational inefficiency on long sequences. We present Mamba, a selective state space model achieving 5x higher inference throughput and linear O(N) scaling.',
    tldr: 'Introduced selective state space models (SSMs) achieving 5x throughput improvements and linear complexity in context length.',
    pdf_url: 'https://arxiv.org/pdf/2312.00752.pdf',
    is_oa: true,
    access_status: 'repository_preprint',
    license: 'arXiv Perpetual Non-exclusive'
  }
];

const SUGGESTED_QUESTIONS = [
  'Does AI forecasting reduce retail stockouts?',
  'Does deep learning work for drug discovery?',
  'Are state space models faster than Transformers?',
  'Does reinforcement learning improve robotic dexterity?',
  'Does CRISPR-Cas9 have significant off-target effects?'
];

const getApiBase = (): string => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.location.port === '5173') {
    return 'http://localhost:8000';
  }
  return '';
};
const API_BASE = getApiBase();

export function App() {
  const [activeTab, setActiveTab] = useState<'discovery' | 'matrix' | 'graph' | 'gaps' | 'copilot'>('discovery');
  const [searchQuery, setSearchQuery] = useState('Transformer');
  const [hasSearched, setHasSearched] = useState(true);
  const [papers, setPapers] = useState<Paper[]>(DEFAULT_BENCHMARK_PAPERS);
  const [consensus, setConsensus] = useState<ConsensusData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [backendOnline, setBackendOnline] = useState(true);
  const [showTraceableStudies, setShowTraceableStudies] = useState(false);

  // Filter & Sort for Supporting Papers Table
  const [stanceFilter, setStanceFilter] = useState<'all' | 'supported' | 'neutral' | 'disputing'>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'citations' | 'newest'>('relevance');
  const [expandedFindings, setExpandedFindings] = useState<Record<string, boolean>>({});

  // Discovery & Multi-criteria Search State
  const [searchPage, setSearchPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchSort, setSearchSort] = useState<'relevance' | 'cited_by_count:desc' | 'publication_year:desc' | 'publication_year:asc'>('relevance');
  const [eraPreset, setEraPreset] = useState<'all' | 'recent' | 'scaling' | 'foundational' | 'custom'>('all');
  const [fromYearInput, setFromYearInput] = useState<string>('');
  const [toYearInput, setToYearInput] = useState<string>('');
  const [activeFromYear, setActiveFromYear] = useState<number | null>(null);
  const [activeToYear, setActiveToYear] = useState<number | null>(null);
  const [oaOnlyFilter, setOaOnlyFilter] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [expandedAbstracts, setExpandedAbstracts] = useState<Record<string, boolean>>({});

  // Enhanced Citation Network State
  const [graphViewMode, setGraphViewMode] = useState<'network' | 'timeline'>('network');
  const [graphIntentFilter, setGraphIntentFilter] = useState<'all' | 'supporting' | 'contrasting'>('all');
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<any | null>(null);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [graphSearchQuery, setGraphSearchQuery] = useState<string>('');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [graphZoom, setGraphZoom] = useState<number>(1);
  const [graphPan, setGraphPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // AI Provider Settings State
  const [aiProvider, setAiProvider] = useState<string>(() => sessionStorage.getItem('cs_ai_provider') || 'local');
  const [aiApiKey, setAiApiKey] = useState<string>(() => sessionStorage.getItem('cs_ai_key') || '');
  const [aiModel, setAiModel] = useState<string>(() => sessionStorage.getItem('cs_ai_model') || 'gemini-1.5-flash');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [keyTesting, setKeyTesting] = useState(false);
  const [keyTestResult, setKeyTestResult] = useState<{ valid: boolean; message: string } | null>(null);

  // Matrix State
  const [matrixPapers, setMatrixPapers] = useState<string[]>(['W3125678901', 'W2963403868', 'W3032549211', 'W4389201948']);
  const [matrixData, setMatrixData] = useState<{ columns: string[]; rows: MatrixRow[] } | null>(null);
  const [newColumnName, setNewColumnName] = useState('');
  const [selectedCell, setSelectedCell] = useState<{ paperTitle: string; column: string; value: string; paperId?: string } | null>(null);
  const [matrixSearchFilter, setMatrixSearchFilter] = useState('');
  const [showAddPaperModal, setShowAddPaperModal] = useState(false);
  const [manualPaperIdInput, setManualPaperIdInput] = useState('');

  // Gap State
  const [gapData, setGapData] = useState<GapData | null>(null);
  const [gapActiveCategory, setGapActiveCategory] = useState<'all' | 'bottlenecks' | 'debates' | 'thesis'>('all');

  // Copilot State
  const [activeCopilotPaper, setActiveCopilotPaper] = useState<Paper>(DEFAULT_BENCHMARK_PAPERS[0]);
  const [readerSection, setReaderSection] = useState<'overview' | 'math' | 'findings' | 'abstract'>('overview');
  const [copilotMessages, setCopilotMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; citation?: string; is_llm?: boolean; provider?: string }>>([
    {
      sender: 'assistant',
      text: "Welcome to CiteScope Copilot. I am your scholarly assistant grounded strictly in 'Attention Is All You Need' (Vaswani et al., 2017). Highlight any passage, ask for methodology summaries, or inquire about mathematical formulations.",
      citation: "Document Loaded: NeurIPS 2017 • arXiv:1706.03762 (Verified Open Access)",
      is_llm: false,
      provider: 'local'
    }
  ]);
  const [copilotInput, setCopilotInput] = useState('');
  const [copilotLoading, setCopilotLoading] = useState(false);

  // Initial Fetch on load
  useEffect(() => {
    fetchSearchResults('Transformer', 1, false);
    fetchMatrix(['W3125678901', 'W2963403868', 'W3032549211', 'W4389201948']);
    fetchGraph('Transformer');
    fetchGaps('Transformer');
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const saveAiSettings = (prov: string, key: string, mod: string) => {
    setAiProvider(prov);
    setAiApiKey(key);
    setAiModel(mod);
    sessionStorage.setItem('cs_ai_provider', prov);
    sessionStorage.setItem('cs_ai_key', key);
    sessionStorage.setItem('cs_ai_model', mod);
    showToast(`AI Engine configured: ${prov.toUpperCase()}`);
  };

  const handleTestKey = async () => {
    setKeyTesting(true);
    setKeyTestResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/ai/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: aiProvider, api_key: aiApiKey, model: aiModel })
      });
      const data = await res.json();
      setKeyTestResult(data);
    } catch {
      setKeyTestResult({ valid: false, message: 'Could not connect to backend server' });
    } finally {
      setKeyTesting(false);
    }
  };

  const fetchSearchResults = async (
    query: string,
    page: number = 1,
    append: boolean = false,
    overrideSort?: string,
    overrideFromYear?: number | null,
    overrideToYear?: number | null,
    overrideOa?: boolean
  ) => {
    if (!query.trim()) return;
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setHasSearched(true);
    }

    const sortParam = overrideSort !== undefined ? overrideSort : searchSort;
    const fromY = overrideFromYear !== undefined ? overrideFromYear : activeFromYear;
    const toY = overrideToYear !== undefined ? overrideToYear : activeToYear;
    const oaVal = overrideOa !== undefined ? overrideOa : oaOnlyFilter;

    let url = `${API_BASE}/api/search?q=${encodeURIComponent(query)}&page=${page}&per_page=20`;
    if (sortParam && sortParam !== 'relevance') {
      url += `&sort=${encodeURIComponent(sortParam)}`;
    }
    if (fromY) {
      url += `&from_year=${fromY}`;
    }
    if (toY) {
      url += `&to_year=${toY}`;
    }
    if (oaVal) {
      url += `&is_oa=true`;
    }

    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const incomingPapers: Paper[] = data.papers || [];
        setTotalCount(data.total_count || incomingPapers.length);
        setSearchPage(page);

        if (append) {
          setPapers(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newUnique = incomingPapers.filter(p => !existingIds.has(p.id));
            return [...prev, ...newUnique];
          });
          showToast(`Loaded ${incomingPapers.length} more publications`);
        } else {
          setPapers(incomingPapers);
          setConsensus(data.consensus || null);
          setBackendOnline(true);
          fetchGraph(query);
          fetchGaps(query);
          if (incomingPapers.length > 0) {
            if (!incomingPapers.some(p => p.id === activeCopilotPaper.id)) {
              setActiveCopilotPaper(incomingPapers[0]);
            }
          }
        }
      } else {
        throw new Error('Backend offline');
      }
    } catch {
      setBackendOnline(false);
      if (!append) {
        setPapers(DEFAULT_BENCHMARK_PAPERS);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleEraSelect = (era: 'all' | 'recent' | 'scaling' | 'foundational') => {
    setEraPreset(era);
    let fromY: number | null = null;
    let toY: number | null = null;
    if (era === 'recent') {
      fromY = 2023;
      toY = 2026;
    } else if (era === 'scaling') {
      fromY = 2018;
      toY = 2022;
    } else if (era === 'foundational') {
      fromY = 1950;
      toY = 2017;
    }
    setActiveFromYear(fromY);
    setActiveToYear(toY);
    fetchSearchResults(searchQuery, 1, false, undefined, fromY, toY);
  };

  const handleApplyCustomYears = () => {
    const fY = fromYearInput ? parseInt(fromYearInput, 10) : null;
    const tY = toYearInput ? parseInt(toYearInput, 10) : null;
    setActiveFromYear(fY);
    setActiveToYear(tY);
    setEraPreset('custom');
    fetchSearchResults(searchQuery, 1, false, undefined, fY, tY);
  };

  const handleSortChange = (newSort: any) => {
    setSearchSort(newSort);
    fetchSearchResults(searchQuery, 1, false, newSort);
  };

  const handleToggleOa = () => {
    const newVal = !oaOnlyFilter;
    setOaOnlyFilter(newVal);
    fetchSearchResults(searchQuery, 1, false, undefined, undefined, undefined, newVal);
  };

  const handleSearchTopic = (topicName: string) => {
    setSearchQuery(topicName);
    fetchSearchResults(topicName, 1, false);
    showToast(`Filtering for topic: "${topicName}"`);
  };

  const handleCopyDoi = (doi: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const cleanDoi = doi.startsWith('http') ? doi : `https://doi.org/${doi}`;
    navigator.clipboard.writeText(cleanDoi);
    showToast('DOI URL copied to clipboard!');
  };

  const fetchMatrix = async (paperIds?: string[], customCols?: string[]) => {
    const ids = paperIds || matrixPapers;
    try {
      const res = await fetch(`${API_BASE}/api/matrix/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paper_ids: ids, custom_columns: customCols })
      });
      if (res.ok) {
        const data = await res.json();
        setMatrixData(data);
      }
    } catch {
      // Keep existing data
    }
  };

  const fetchGraph = async (topic: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/citations/graph?topic=${encodeURIComponent(topic)}`);
      if (res.ok) {
        const data = await res.json();
        setGraphData(data);
        if (data.nodes?.length > 0) {
          setSelectedNode(data.nodes[0]);
        }
        if (data.edges?.length > 0) {
          setSelectedEdge(data.edges[0]);
        }
      }
    } catch {
      // Keep existing data
    }
  };

  const fetchGaps = async (topic: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/research-gaps?topic=${encodeURIComponent(topic)}`);
      if (res.ok) {
        const data = await res.json();
        setGapData(data);
      }
    } catch {
      // Keep existing data
    }
  };

  // Matrix Actions: Add Paper, Delete Paper, Add Column, Delete Column, Reset
  const handleAddPaperToMatrix = (paperId: string) => {
    if (!matrixPapers.includes(paperId)) {
      const updated = [...matrixPapers, paperId];
      setMatrixPapers(updated);
      fetchMatrix(updated, matrixData?.columns.slice(5));
      showToast('Paper added to Comparison Matrix');
    } else {
      showToast('Paper is already in Comparison Matrix');
    }
  };

  const handleDeletePaperFromMatrix = (paperId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (matrixPapers.length <= 1) {
      showToast('Keep at least 1 paper in the comparison');
      return;
    }
    const updated = matrixPapers.filter(id => id !== paperId);
    setMatrixPapers(updated);
    fetchMatrix(updated, matrixData?.columns.slice(5));
    showToast('Removed paper from Comparison Matrix');
  };

  const handleResetMatrixToBenchmarks = () => {
    const defaults = ['W3125678901', 'W2963403868', 'W3032549211', 'W4389201948'];
    setMatrixPapers(defaults);
    fetchMatrix(defaults, []);
    showToast('Matrix reset to standard benchmark papers');
  };

  const handleClearMatrix = () => {
    if (papers.length > 0) {
      const single = [papers[0].id];
      setMatrixPapers(single);
      fetchMatrix(single, []);
      showToast('Matrix cleared');
    }
  };

  const handleAddColumn = () => {
    if (!newColumnName.trim() || !matrixData) return;
    const colName = newColumnName.trim();
    if (matrixData.columns.includes(colName)) {
      showToast('Column already exists');
      return;
    }
    const updatedCols = [...matrixData.columns, colName];
    fetchMatrix(matrixPapers, updatedCols.slice(5));
    setNewColumnName('');
    showToast(`Added custom column: ${colName}`);
  };

  const handleDeleteCustomColumn = (colName: string) => {
    if (!matrixData) return;
    const defaultCols = ['Core Problem', 'Methodology / Architecture', 'Datasets / Benchmarks', 'Key Findings / Metric', 'Key Stated Limitations'];
    if (defaultCols.includes(colName)) {
      showToast('Standard benchmark columns cannot be removed');
      return;
    }
    const remainingCustom = matrixData.columns.slice(5).filter(c => c !== colName);
    fetchMatrix(matrixPapers, remainingCustom);
    showToast(`Removed column: ${colName}`);
  };

  const handleCopyCitation = (study: TraceableStudy) => {
    const citation = `${study.authors} (${study.year}). "${study.title}." ${study.venue}. DOI: ${study.doi || '10.48550/arXiv.' + study.id}`;
    navigator.clipboard.writeText(citation);
    showToast('Citation copied to clipboard!');
  };

  const handleExportMatrixCSV = () => {
    if (!matrixData) return;
    const headers = ['Paper Title', 'Authors', 'Year', ...matrixData.columns].join(',');
    const rows = matrixData.rows.map(r => {
      const cells = matrixData.columns.map(c => `"${(r.cells[c] || '').replace(/"/g, '""')}"`);
      return `"${r.paper_title.replace(/"/g, '""')}","${r.authors}",${r.year},${cells.join(',')}`;
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `citescope_matrix_${searchQuery.toLowerCase().replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Matrix exported to CSV');
  };

  const handleOpenInCopilot = (paper: Paper) => {
    setActiveCopilotPaper(paper);
    setCopilotMessages([
      {
        sender: 'assistant',
        text: `Switched active reader to '${paper.title}' (${paper.year}). Ask any question about its methodology, datasets, or mathematical equations.`,
        citation: `Grounded in ${paper.venue} • ${paper.year}`,
        is_llm: false,
        provider: 'local'
      }
    ]);
    setActiveTab('copilot');
  };

  const handleAskCopilot = async (question: string) => {
    if (!question.trim()) return;
    const newMsgs = [...copilotMessages, { sender: 'user' as const, text: question }];
    setCopilotMessages(newMsgs);
    setCopilotInput('');
    setCopilotLoading(true);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (aiProvider !== 'local' && aiApiKey) {
        headers['X-AI-Provider'] = aiProvider;
        headers['X-AI-Key'] = aiApiKey;
        headers['X-AI-Model'] = aiModel;
      }

      const res = await fetch(`${API_BASE}/api/copilot/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ paper_id: activeCopilotPaper.id, question })
      });
      if (res.ok) {
        const data = await res.json();
        setCopilotMessages([...newMsgs, {
          sender: 'assistant',
          text: data.answer,
          citation: data.citation_context,
          is_llm: data.is_llm,
          provider: data.provider_used
        }]);
      } else {
        throw new Error();
      }
    } catch {
      let fallbackAnswer = `In '${activeCopilotPaper.title}', key conclusions are: ${activeCopilotPaper.tldr}`;
      let fallbackCitation = "Abstract & Introduction";

      if (question.toLowerCase().includes('formula') || question.toLowerCase().includes('math')) {
        fallbackAnswer = "Scaled Dot-Product Attention: Attention(Q, K, V) = softmax((Q K^T) / sqrt(d_k)) V. Scaling by 1/sqrt(d_k) counteracts extreme dot product growth.";
        fallbackCitation = "Section 3.2.1, Scaled Dot-Product Attention";
      }

      setCopilotMessages([...newMsgs, {
        sender: 'assistant',
        text: fallbackAnswer,
        citation: fallbackCitation,
        is_llm: false,
        provider: 'local'
      }]);
    } finally {
      setCopilotLoading(false);
    }
  };

  // Check if search query is a specific research question vs broad topic
  const isResearchQuestion = useMemo(() => {
    if (consensus?.is_question !== undefined) return consensus.is_question;
    const q = searchQuery.trim().toLowerCase();
    if (q.endsWith('?')) return true;
    const firstWord = q.split(' ')[0] || '';
    return ['does', 'do', 'is', 'are', 'can', 'will', 'should', 'would', 'could', 'has', 'have', 'whether', 'how', 'why', 'what', 'which'].includes(firstWord);
  }, [searchQuery, consensus]);

  // Normalized Stance Helper
  const getNormalizedStance = (rawStance: string): 'supported' | 'neutral' | 'disputing' => {
    const s = (rawStance || '').toLowerCase();
    if (s.includes('affirmative') || s.includes('supported') || s.includes('positive')) return 'supported';
    if (s.includes('disputing') || s.includes('negative') || s.includes('contrasting')) return 'disputing';
    return 'neutral';
  };

  // Filtered & Sorted Traceable Studies for the Table
  const filteredStudies = useMemo(() => {
    if (!consensus?.traceable_studies) return [];
    let list = [...consensus.traceable_studies];

    if (stanceFilter !== 'all') {
      list = list.filter(s => getNormalizedStance(s.stance) === stanceFilter);
    }

    if (sortBy === 'citations') {
      list.sort((a, b) => (b.citation_count || 0) - (a.citation_count || 0));
    } else if (sortBy === 'newest') {
      list.sort((a, b) => (b.year || 0) - (a.year || 0));
    }

    return list;
  }, [consensus, stanceFilter, sortBy]);

  // Stance Counts
  const stanceCounts = useMemo(() => {
    const counts = { all: 0, supported: 0, neutral: 0, disputing: 0 };
    if (!consensus?.traceable_studies) return counts;
    counts.all = consensus.traceable_studies.length;
    consensus.traceable_studies.forEach(s => {
      const norm = getNormalizedStance(s.stance);
      counts[norm]++;
    });
    return counts;
  }, [consensus]);

  // Filtered Matrix Rows
  const filteredMatrixRows = useMemo(() => {
    if (!matrixData?.rows) return [];
    if (!matrixSearchFilter.trim()) return matrixData.rows;
    const q = matrixSearchFilter.toLowerCase();
    return matrixData.rows.filter(r =>
      r.paper_title.toLowerCase().includes(q) ||
      r.authors.toLowerCase().includes(q)
    );
  }, [matrixData, matrixSearchFilter]);

  // Citation Canvas Drag & Pan Handlers
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - graphPan.x, y: e.clientY - graphPan.y });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setGraphPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
  };

  const handleCanvasWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setGraphZoom(z => Math.min(2.5, Math.max(0.5, z * zoomFactor)));
  };

  const resetNetworkTransform = () => {
    setGraphZoom(1);
    setGraphPan({ x: 0, y: 0 });
  };

  // Filtered Graph Edges
  const filteredGraphEdges = useMemo(() => {
    if (!graphData?.edges) return [];
    if (graphIntentFilter === 'all') return graphData.edges;
    return graphData.edges.filter(e => e.intent === graphIntentFilter);
  }, [graphData, graphIntentFilter]);

  // Nodes matching the graph search query
  const matchedNodeIds = useMemo(() => {
    if (!graphSearchQuery.trim() || !graphData?.nodes) return new Set<string>();
    const q = graphSearchQuery.toLowerCase();
    return new Set(
      graphData.nodes
        .filter(n =>
          n.title.toLowerCase().includes(q) ||
          n.authors.some(a => a.toLowerCase().includes(q)) ||
          n.short_label.toLowerCase().includes(q)
        )
        .map(n => n.id)
    );
  }, [graphData, graphSearchQuery]);

  // Connected edges for the currently hovered or selected node
  const activeFocusNodeId = hoveredNodeId || selectedNode?.id;

  // Upstream and Downstream nodes for the selected node inspector
  const inspectorConnections = useMemo(() => {
    if (!selectedNode || !graphData) return { upstream: [], downstream: [] };
    const upstream: Array<{ node: any; edge: any }> = []; // papers cited by selectedNode
    const downstream: Array<{ node: any; edge: any }> = []; // papers citing selectedNode

    graphData.edges.forEach(e => {
      if (e.source === selectedNode.id) {
        const targetN = graphData.nodes.find(n => n.id === e.target);
        if (targetN) upstream.push({ node: targetN, edge: e });
      } else if (e.target === selectedNode.id) {
        const sourceN = graphData.nodes.find(n => n.id === e.source);
        if (sourceN) downstream.push({ node: sourceN, edge: e });
      }
    });

    return { upstream, downstream };
  }, [selectedNode, graphData]);

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand-icon">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="brand-title">CiteScope AI</div>
            <span className="brand-badge">Academic Suite</span>
          </div>
        </div>

        {/* Core Research Workflow Navigation */}
        <nav className="nav-section">
          <button
            className={`nav-item ${activeTab === 'discovery' ? 'active' : ''}`}
            onClick={() => setActiveTab('discovery')}
          >
            <Search size={16} />
            <span className="nav-label">Literature Discovery</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'matrix' ? 'active' : ''}`}
            onClick={() => setActiveTab('matrix')}
          >
            <TableIcon size={16} />
            <span className="nav-label">Comparison Matrix</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'graph' ? 'active' : ''}`}
            onClick={() => setActiveTab('graph')}
          >
            <GitFork size={16} />
            <span className="nav-label">Citation Network</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'gaps' ? 'active' : ''}`}
            onClick={() => setActiveTab('gaps')}
          >
            <Lightbulb size={16} />
            <span className="nav-label">Research Gap Radar</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'copilot' ? 'active' : ''}`}
            onClick={() => setActiveTab('copilot')}
          >
            <BookOpen size={16} />
            <span className="nav-label">Split-View Copilot</span>
          </button>
        </nav>

        {/* Subtle Divider separating core tools from secondary */}
        <div className="sidebar-divider" />

        {/* Secondary Tools & Settings */}
        <div className="sidebar-bottom">
          <button
            className="nav-item"
            onClick={() => setShowSettingsModal(true)}
          >
            <Settings size={16} />
            <span className="nav-label">AI & Backend Settings</span>
          </button>
        </div>

        {/* Minimal Non-Intrusive Status Dot */}
        <div className="sidebar-footer">
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}
            onClick={() => setShowSettingsModal(true)}
            title="Click to view AI & API status"
          >
            <span className="status-dot-pulse" />
            <span style={{ fontWeight: 500, color: '#334155' }}>
              {backendOnline ? 'OpenAlex Live' : 'Offline Cache'}
            </span>
          </div>
          <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>v1.0</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-wrapper">
        {/* Top Header Bar */}
        <header className="top-header">
          <div className="header-left">
            <div className="mobile-brand-pill">
              <div className="brand-icon" style={{ width: 26, height: 26, borderRadius: 6 }}>
                <Sparkles size={14} />
              </div>
              <span className="mobile-brand-name">CiteScope</span>
            </div>
            <h1 className="header-title">
              {activeTab === 'discovery' && 'Literature Discovery & Consensus'}
              {activeTab === 'matrix' && 'Comparative Evidence Matrix'}
              {activeTab === 'graph' && 'Citation Lineage & Intent Network'}
              {activeTab === 'gaps' && 'Research Gap Radar & Frontiers'}
              {activeTab === 'copilot' && 'Split-View Paper Copilot'}
            </h1>
          </div>

          <div className="header-actions">
            {activeTab === 'matrix' && (
              <button
                className="btn-sm-secondary"
                onClick={handleExportMatrixCSV}
                title="Download table as CSV"
              >
                <FileSpreadsheet size={13} color="#059669" />
                <span className="hide-on-mobile">Export CSV</span>
              </button>
            )}

            <button
              className="btn-sm-secondary"
              onClick={() => setShowSettingsModal(true)}
              title="Configure AI Models & Keys"
            >
              <Sliders size={13} color="#2563eb" />
              <span>Settings</span>
            </button>
          </div>
        </header>

        {/* Tab 1: Literature Discovery */}
        {activeTab === 'discovery' && (
          <main className="page-container">

            {/* Search Bar: Transitions from Hero to Compact when results load */}
            {!hasSearched || papers.length === 0 ? (
              <div className="search-hero">
                <div className="search-hero-eyebrow">Academic Evidence Discovery</div>
                <h2 className="search-hero-title">What scholarly question are you investigating?</h2>
                <p className="search-hero-desc">
                  Analyze 250M+ peer-reviewed works across OpenAlex, arXiv, and Unpaywall with instant empirical consensus.
                </p>

                <div className="search-input-wrapper">
                  <Search size={18} color="#64748b" />
                  <input
                    type="text"
                    className="search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchSearchResults(searchQuery)}
                    placeholder="Ask a research question (e.g. Does AI forecasting reduce retail stockouts?) or enter a topic..."
                  />
                  <button
                    className="search-btn"
                    onClick={() => fetchSearchResults(searchQuery)}
                    disabled={isLoading}
                  >
                    {isLoading ? <RefreshCw size={14} className="animate-spin" /> : 'Search'}
                  </button>
                </div>

                <div className="topic-pills">
                  <span style={{ fontSize: '0.75rem', color: '#64748b', marginRight: 4 }}>Example Questions:</span>
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      className="topic-pill"
                      onClick={() => {
                        setSearchQuery(q);
                        fetchSearchResults(q);
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Compact Single-Row Search Bar (Loaded Results State - Saves Screen Space!) */
              <div className="compact-search-bar">
                <div className="compact-search-row">
                  <div className="search-input-wrapper" style={{ flex: 1 }}>
                    <Search size={16} color="#64748b" />
                    <input
                      type="text"
                      className="search-input"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchSearchResults(searchQuery)}
                      placeholder="Ask a research question (e.g. Does AI forecasting reduce stockouts?) or enter a topic..."
                    />
                  </div>
                  <button
                    className="search-btn"
                    onClick={() => fetchSearchResults(searchQuery)}
                    disabled={isLoading}
                  >
                    {isLoading ? <RefreshCw size={13} className="animate-spin" /> : 'Search'}
                  </button>
                </div>

                <div className="compact-topic-strip">
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginRight: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <HelpCircle size={11} /> Suggested:
                  </span>
                  {SUGGESTED_QUESTIONS.slice(0, 3).map((q) => (
                    <button
                      key={q}
                      className="topic-pill"
                      style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                      onClick={() => {
                        setSearchQuery(q);
                        fetchSearchResults(q);
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Consensus / Topic Synthesis Card */}
            {consensus && (
              <section className="consensus-card">
                <div className="consensus-header">
                  <div className="consensus-title-group">
                    <h2 className="consensus-title">
                      {isResearchQuestion ? 'Scientific Consensus Meter' : 'Topic Synthesis & Literature Trends'}
                    </h2>
                    <span className="confidence-badge">
                      {consensus.rigor_rating || `High Confidence • ${consensus.sample_size} Papers`}
                    </span>
                  </div>

                  {/* Lightweight Chevron Toggle */}
                  <button
                    onClick={() => setShowTraceableStudies(!showTraceableStudies)}
                    className="btn-toggle-evidence"
                  >
                    <span>{showTraceableStudies ? 'Collapse' : `Supporting Papers (${consensus.sample_size})`}</span>
                    {showTraceableStudies ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                {/* Focal 10px Progress Bar with rounded caps and subtle segment gaps */}
                <div className="consensus-meter-bar">
                  <div
                    className="meter-affirmative"
                    style={{ width: `${consensus.stance.affirmative}%` }}
                    title={`Supported: ${consensus.stance.affirmative}%`}
                  />
                  <div
                    className="meter-mixed"
                    style={{ width: `${consensus.stance.neutral_or_mixed}%` }}
                    title={`Neutral / Mixed: ${consensus.stance.neutral_or_mixed}%`}
                  />
                  <div
                    className="meter-disputing"
                    style={{ width: `${consensus.stance.negative_or_disputing}%` }}
                    title={`Disputing: ${consensus.stance.negative_or_disputing}%`}
                  />
                </div>

                {/* Responsive 3-Stat Metric Highlight Cards */}
                <div className="stat-highlight-grid">
                  <div className="stat-highlight-card stat-card-supported">
                    <div className="stat-card-top">
                      <span className="stat-dot" style={{ background: 'var(--stance-supported-bar)' }} />
                      <span className="stat-pct">{consensus.stance.affirmative}%</span>
                      <span className="stat-count">
                        ({consensus.stance_counts?.affirmative ?? Math.max(1, Math.round((consensus.stance.affirmative / 100) * consensus.sample_size))} {consensus.sample_size === 1 ? 'study' : 'studies'})
                      </span>
                    </div>
                    <div className="stat-card-label">
                      {isResearchQuestion ? 'Supported / Affirmative' : 'Positive Impact / Advances'}
                    </div>
                  </div>

                  <div className="stat-highlight-card stat-card-neutral">
                    <div className="stat-card-top">
                      <span className="stat-dot" style={{ background: 'var(--stance-neutral-bar)' }} />
                      <span className="stat-pct">{consensus.stance.neutral_or_mixed}%</span>
                      <span className="stat-count">
                        ({consensus.stance_counts?.neutral_or_mixed ?? Math.max(0, Math.round((consensus.stance.neutral_or_mixed / 100) * consensus.sample_size))} {consensus.sample_size === 1 ? 'study' : 'studies'})
                      </span>
                    </div>
                    <div className="stat-card-label">
                      {isResearchQuestion ? 'Neutral / Mixed Evidence' : 'Standard / Domain Baseline'}
                    </div>
                  </div>

                  <div className="stat-highlight-card stat-card-disputing">
                    <div className="stat-card-top">
                      <span className="stat-dot" style={{ background: 'var(--stance-disputing-bar)' }} />
                      <span className="stat-pct">{consensus.stance.negative_or_disputing}%</span>
                      <span className="stat-count">
                        ({consensus.stance_counts?.negative_or_disputing ?? Math.max(0, Math.round((consensus.stance.negative_or_disputing / 100) * consensus.sample_size))} {consensus.sample_size === 1 ? 'study' : 'studies'})
                      </span>
                    </div>
                    <div className="stat-card-label">
                      {isResearchQuestion ? 'Disputing / Counter-evidence' : 'Limitations & Trade-offs'}
                    </div>
                  </div>
                </div>

                <div className="consensus-narrative-box">
                  <p className="consensus-narrative">
                    {consensus.synthesis}
                  </p>
                </div>

                {/* Supporting Papers Table (Expandable with Filters & Merged Provenance) */}
                {showTraceableStudies && consensus.traceable_studies && (
                  <div className="evidence-table-container">
                    {/* Filter Strip above table */}
                    <div className="table-filter-strip" style={{ padding: '12px 16px 8px 16px', background: '#fafbfc' }}>
                      <div className="stance-filter-chips">
                        <button
                          className={`filter-chip ${stanceFilter === 'all' ? 'active' : ''}`}
                          onClick={() => setStanceFilter('all')}
                        >
                          All ({stanceCounts.all})
                        </button>
                        <button
                          className={`filter-chip ${stanceFilter === 'supported' ? 'active' : ''}`}
                          onClick={() => setStanceFilter('supported')}
                        >
                          Supported ({stanceCounts.supported})
                        </button>
                        <button
                          className={`filter-chip ${stanceFilter === 'neutral' ? 'active' : ''}`}
                          onClick={() => setStanceFilter('neutral')}
                        >
                          Neutral ({stanceCounts.neutral})
                        </button>
                        <button
                          className={`filter-chip ${stanceFilter === 'disputing' ? 'active' : ''}`}
                          onClick={() => setStanceFilter('disputing')}
                        >
                          Disputing ({stanceCounts.disputing})
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#64748b' }}>
                        <ArrowUpDown size={12} />
                        <span>Sort:</span>
                        <select
                          value={sortBy}
                          onChange={(e: any) => setSortBy(e.target.value)}
                          style={{
                            border: '1px solid #cbd5e1',
                            borderRadius: 4,
                            padding: '2px 6px',
                            fontSize: '0.75rem',
                            background: '#ffffff',
                            color: '#0f172a',
                            outline: 'none'
                          }}
                        >
                          <option value="relevance">Relevance</option>
                          <option value="citations">Most Cited</option>
                          <option value="newest">Newest First</option>
                        </select>
                      </div>
                    </div>

                    {/* Table Body */}
                    <div style={{ overflowX: 'auto' }}>
                      <table className="evidence-table">
                        <thead>
                          <tr>
                            <th style={{ width: '38%' }}>Paper & Provenance</th>
                            <th style={{ width: '42%' }}>Key Finding</th>
                            <th style={{ width: '10%' }}>Stance</th>
                            <th style={{ width: '10%', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudies.map((study, idx) => {
                            const norm = getNormalizedStance(study.stance);
                            const isExpanded = expandedFindings[study.id || idx];
                            const findingText = study.evidence || 'Evaluated in study experimental protocol.';
                            const isLong = findingText.length > 140;

                            return (
                              <tr key={study.id || idx}>
                                {/* Merged Title & Provenance Column */}
                                <td>
                                  <a
                                    className="study-title-link"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      const matched = papers.find(p => p.id === study.id || p.title === study.title);
                                      if (matched) {
                                        handleOpenInCopilot(matched);
                                      }
                                    }}
                                  >
                                    {study.title}
                                  </a>
                                  <div className="study-provenance">
                                    <span>{study.authors}</span> • <span>{study.year}</span> • <em>{study.venue}</em>
                                  </div>
                                </td>

                                {/* Key Finding with Read More toggle */}
                                <td>
                                  <div className="key-finding-text">
                                    {isLong && !isExpanded ? `${findingText.slice(0, 140)}...` : findingText}
                                  </div>
                                  {isLong && (
                                    <button
                                      onClick={() => setExpandedFindings(prev => ({ ...prev, [study.id || idx]: !isExpanded }))}
                                      style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#2563eb',
                                        fontSize: '0.72rem',
                                        fontWeight: 600,
                                        padding: 0,
                                        marginTop: 3,
                                        cursor: 'pointer'
                                      }}
                                    >
                                      {isExpanded ? 'Show less' : 'Read more'}
                                    </button>
                                  )}
                                </td>

                                {/* Soft Tinted Stance Pill */}
                                <td>
                                  <span className={`pill-stance pill-${norm}`}>
                                    {norm === 'supported' ? 'Supported' : norm === 'disputing' ? 'Disputing' : 'Neutral'}
                                  </span>
                                </td>

                                {/* Quick Interactive Row Actions */}
                                <td style={{ textAlign: 'right' }}>
                                  <div style={{ display: 'inline-flex', gap: 4 }}>
                                    <button
                                      className="btn-sm-secondary"
                                      style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                                      onClick={() => handleAddPaperToMatrix(study.id)}
                                      title="Add to Comparison Matrix"
                                    >
                                      + Matrix
                                    </button>
                                    <button
                                      className="btn-sm-secondary"
                                      style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                                      onClick={() => handleCopyCitation(study)}
                                      title="Copy Citation"
                                    >
                                      <Copy size={11} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Multi-Criteria Filters & Timeline Toolbar */}
            <div className="search-filters-toolbar">
              <div className="search-toolbar-row">
                {/* Era Presets */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={13} /> Publication Era:
                  </span>
                  <div className="era-pills">
                    <button
                      className={`era-pill ${eraPreset === 'all' ? 'active' : ''}`}
                      onClick={() => handleEraSelect('all')}
                    >
                      All Eras (1950–2026)
                    </button>
                    <button
                      className={`era-pill ${eraPreset === 'recent' ? 'active' : ''}`}
                      onClick={() => handleEraSelect('recent')}
                    >
                      Recent Frontiers (2023–2026)
                    </button>
                    <button
                      className={`era-pill ${eraPreset === 'scaling' ? 'active' : ''}`}
                      onClick={() => handleEraSelect('scaling')}
                    >
                      Scaling Era (2018–2022)
                    </button>
                    <button
                      className={`era-pill ${eraPreset === 'foundational' ? 'active' : ''}`}
                      onClick={() => handleEraSelect('foundational')}
                    >
                      Foundational (Pre-2018)
                    </button>
                  </div>
                </div>

                {/* Custom Year Inputs */}
                <div className="custom-year-inputs">
                  <span>Year:</span>
                  <input
                    type="number"
                    className="year-input"
                    placeholder="1950"
                    value={fromYearInput}
                    onChange={(e) => setFromYearInput(e.target.value)}
                  />
                  <span>to</span>
                  <input
                    type="number"
                    className="year-input"
                    placeholder="2026"
                    value={toYearInput}
                    onChange={(e) => setToYearInput(e.target.value)}
                  />
                  <button className="btn-year-apply" onClick={handleApplyCustomYears}>
                    Apply
                  </button>
                </div>
              </div>

              <div className="search-toolbar-row" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Showing <strong>{papers.length}</strong> of {totalCount > 0 ? <strong>{totalCount.toLocaleString()}</strong> : 'thousands of'} publications
                  {activeFromYear || activeToYear ? (
                    <span style={{ marginLeft: 6, color: '#2563eb' }}>
                      ({activeFromYear || 1950} – {activeToYear || 2026})
                    </span>
                  ) : ' across history'}
                </div>

                <div className="toolbar-controls-right">
                  {/* Open Access Toggle */}
                  <button
                    className={`oa-toggle-btn ${oaOnlyFilter ? 'active' : ''}`}
                    onClick={handleToggleOa}
                    title="Filter only papers with verified Open Access PDFs"
                  >
                    <Unlock size={12} />
                    <span>{oaOnlyFilter ? 'Open Access Only' : 'All Papers (Abstracts & DOIs)'}</span>
                  </button>

                  {/* Sort Order Selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: '#64748b' }}>
                    <ArrowUpDown size={12} />
                    <span>Sort:</span>
                    <select
                      className="filter-select"
                      value={searchSort}
                      onChange={(e) => handleSortChange(e.target.value)}
                    >
                      <option value="relevance">Relevance (Semantic Match)</option>
                      <option value="cited_by_count:desc">Most Cited (Foundational Papers)</option>
                      <option value="publication_year:desc">Newest First (2025–2026 Preprints)</option>
                      <option value="publication_year:asc">Oldest First (Historical Origins)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Papers List */}
            <div className="paper-list">
              {papers.map((paper) => {
                const isOA = paper.is_oa || paper.access_status === 'open_access_pdf' || paper.access_status === 'repository_preprint';
                const isAbstractExpanded = expandedAbstracts[paper.id];
                const doiUrl = paper.doi ? (paper.doi.startsWith('http') ? paper.doi : `https://doi.org/${paper.doi}`) : (paper.landing_url || `https://openalex.org/${paper.id}`);
                const topics = paper.topics || (paper.concepts || []).map(c => c.name);

                return (
                  <article key={paper.id} className="paper-card">
                    <div className="paper-card-header">
                      <div>
                        <h3
                          className="paper-title"
                          onClick={() => handleOpenInCopilot(paper)}
                          title="Click to open in Split-View Reader"
                        >
                          {paper.title}
                        </h3>
                        <div className="paper-meta">
                          <span className="meta-year-pill">{paper.year}</span>
                          <span className="meta-authors">{paper.authors.slice(0, 3).join(', ')}{paper.authors.length > 3 ? ' et al.' : ''}</span>
                          <span>•</span>
                          <span className="meta-venue">{paper.venue}</span>
                          <span>•</span>
                          <span className="meta-citation-badge">
                            <Quote size={10} /> <strong>{paper.citation_count.toLocaleString()}</strong> citations
                          </span>
                        </div>
                      </div>

                      {/* Explicit Access Status Badge */}
                      {isOA ? (
                        <span className="badge-oa" title="Verified Free Open Access Full Text Available">
                          <Unlock size={11} />
                          <span>Open Access PDF</span>
                        </span>
                      ) : (
                        <span className="badge-abstract" title="Abstract & Metadata Indexed. Full text via institutional publisher DOI.">
                          <BookOpen size={11} />
                          <span>Abstract & DOI</span>
                        </span>
                      )}
                    </div>

                    {/* Clickable Verified DOI Link */}
                    {paper.doi && (
                      <div className="paper-doi-line">
                        <span className="doi-tag">DOI</span>
                        <a href={doiUrl} target="_blank" rel="noreferrer" className="paper-doi-link">
                          {paper.doi.replace('https://doi.org/', '')}
                        </a>
                        <button
                          className="paper-doi-copy-btn"
                          onClick={(e) => handleCopyDoi(paper.doi || '', e)}
                          title="Copy DOI"
                        >
                          <Copy size={11} />
                        </button>
                        <a href={doiUrl} target="_blank" rel="noreferrer" className="paper-doi-ext" title="Open official publisher page">
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    )}

                    {/* Research Topics / Concepts Chips */}
                    {topics && topics.length > 0 && (
                      <div className="paper-topics-list">
                        <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Tag size={11} /> Topics:
                        </span>
                        {topics.slice(0, 5).map(topic => (
                          <button
                            key={topic}
                            className="topic-tag-chip"
                            onClick={() => handleSearchTopic(topic)}
                            title={`Search for topic "${topic}"`}
                          >
                            {topic}
                          </button>
                        ))}
                      </div>
                    )}

                    {paper.tldr && (
                      <div className="paper-tldr">
                        <strong>TL;DR: </strong>{paper.tldr}
                      </div>
                    )}

                    {/* Decoded Abstract with Expand/Collapse */}
                    <div className="paper-abstract">
                      {paper.abstract && (
                        <>
                          <p style={{ display: 'inline', color: 'var(--text-secondary)' }}>
                            {paper.abstract.length > 220 && !isAbstractExpanded
                              ? `${paper.abstract.slice(0, 220)}... `
                              : `${paper.abstract} `}
                          </p>
                          {paper.abstract.length > 220 && (
                            <button
                              className="abstract-toggle-btn"
                              onClick={() => setExpandedAbstracts(prev => ({ ...prev, [paper.id]: !isAbstractExpanded }))}
                            >
                              {isAbstractExpanded ? (
                                <><span>Collapse</span> <ChevronUp size={12} /></>
                              ) : (
                                <><span>Show full abstract</span> <ChevronDown size={12} /></>
                              )}
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="paper-actions">
                      <button
                        className="btn-sm-primary"
                        onClick={() => handleOpenInCopilot(paper)}
                        title="Open paper in split-view reader with grounded AI copilot"
                      >
                        <BookOpen size={13} />
                        <span>Read in Reader</span>
                      </button>

                      <button
                        className="btn-sm-secondary"
                        onClick={() => handleAddPaperToMatrix(paper.id)}
                        title="Add to Comparison Matrix"
                      >
                        <TableIcon size={13} />
                        <span>+ Matrix</span>
                      </button>

                      <button
                        className="btn-sm-secondary"
                        onClick={() => {
                          fetchGraph(paper.title);
                          setActiveTab('graph');
                        }}
                        title="Explore Citation Lineage Graph"
                      >
                        <GitFork size={13} />
                        <span>Citations</span>
                      </button>

                      <button
                        className="btn-sm-secondary"
                        onClick={() => handleCopyCitation({
                          id: paper.id,
                          title: paper.title,
                          authors: paper.authors.join(', '),
                          year: paper.year,
                          venue: paper.venue,
                          citation_count: paper.citation_count,
                          evidence: paper.tldr,
                          stance: 'supported',
                          doi: paper.doi
                        })}
                        title="Copy APA Citation"
                      >
                        <Copy size={12} />
                        <span>Cite</span>
                      </button>

                      {isOA && paper.pdf_url ? (
                        <a
                          href={paper.pdf_url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-sm-secondary"
                          style={{ color: '#047857', borderColor: '#a7f3d0', background: '#ecfdf5' }}
                          title="Download / View Free Open Access PDF"
                        >
                          <Download size={13} />
                          <span>PDF</span>
                        </a>
                      ) : (
                        <a
                          href={doiUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-sm-secondary"
                          title="Open official publisher page via verified DOI"
                        >
                          <ExternalLink size={12} />
                          <span>Publisher</span>
                        </a>
                      )}
                    </div>
                  </article>
                );
              })}

              {/* Load More Papers Button (Past & Recent Pagination) */}
              <button
                className="btn-load-more"
                onClick={() => fetchSearchResults(searchQuery, searchPage + 1, true)}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Retrieving More Publications from OpenAlex Index...</span>
                  </>
                ) : (
                  <>
                    <Plus size={14} />
                    <span>Load More Papers from Past & Recent (Page {searchPage + 1})</span>
                  </>
                )}
              </button>
            </div>
          </main>
        )}

        {/* Tab 2: Comparison Matrix (User-friendly with Delete, Add, and Column controls) */}
        {activeTab === 'matrix' && (
          <main className="page-container">
            {/* Context & Actions Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', fontFamily: 'var(--font-serif)' }}>
                  Multi-Paper Comparison Matrix
                </h2>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 2 }}>
                  Side-by-side benchmark comparison across {matrixPapers.length} selected studies. Click any cell to view extracted evidence.
                </p>
              </div>

              {/* Action Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <button
                  className="btn-sm-secondary"
                  onClick={() => setShowAddPaperModal(true)}
                  title="Add another paper to this matrix"
                >
                  <Plus size={14} color="#2563eb" />
                  <span>Add Paper</span>
                </button>

                <button
                  className="btn-sm-secondary"
                  onClick={handleResetMatrixToBenchmarks}
                  title="Reset to 4 canonical benchmark papers"
                >
                  <RotateCcw size={13} />
                  <span>Reset Default</span>
                </button>

                <button
                  className="btn-sm-secondary"
                  onClick={handleClearMatrix}
                  title="Clear all except first paper"
                >
                  <Trash2 size={13} color="#dc2626" />
                  <span>Clear</span>
                </button>

                {/* Add Custom Column Input */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 4 }}>
                  <input
                    type="text"
                    placeholder="New column (e.g. Latency)..."
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
                    style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      fontSize: '0.8125rem',
                      outline: 'none',
                      width: 170
                    }}
                  />
                  <button onClick={handleAddColumn} className="btn-sm-primary" style={{ padding: '0.35rem 0.6rem' }}>
                    <Plus size={13} /> Add
                  </button>
                </div>
              </div>
            </div>

            {/* In-Matrix Search & Stats Bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px 8px 0 0',
              padding: '10px 16px',
              borderBottom: 'none'
            }}>
              <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                Comparing <strong>{matrixData?.rows?.length || 0} papers</strong> across <strong>{matrixData?.columns?.length || 5} attributes</strong>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Search size={14} color="#94a3b8" />
                <input
                  type="text"
                  placeholder="Filter papers in matrix..."
                  value={matrixSearchFilter}
                  onChange={(e) => setMatrixSearchFilter(e.target.value)}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: 4,
                    padding: '3px 8px',
                    fontSize: '0.78rem',
                    outline: 'none',
                    width: 180
                  }}
                />
              </div>
            </div>

            {/* Comparison Table */}
            {matrixData && (
              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '0 0 8px 8px',
                overflowX: 'auto',
                boxShadow: 'var(--shadow-xs)'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a', width: 260, minWidth: 240 }}>
                        Paper & Authors
                      </th>
                      {matrixData.columns.map((col, idx) => {
                        const isCustom = idx >= 5;
                        return (
                          <th key={idx} style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a', minWidth: 200 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                              <span>{col}</span>
                              {isCustom && (
                                <button
                                  onClick={() => handleDeleteCustomColumn(col)}
                                  title="Delete custom column"
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#94a3b8',
                                    cursor: 'pointer',
                                    padding: 2
                                  }}
                                >
                                  <X size={13} />
                                </button>
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMatrixRows.map((row) => (
                      <tr key={row.paper_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        {/* Paper Title with Delete Paper button */}
                        <td style={{ padding: '12px 16px', verticalAlign: 'top', background: '#fafbfc', borderRight: '1px solid #f1f5f9' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                            <div>
                              <div
                                style={{ fontWeight: 600, color: '#0f172a', fontFamily: 'var(--font-serif)', fontSize: '0.92rem', cursor: 'pointer' }}
                                onClick={() => {
                                  const matched = papers.find(p => p.id === row.paper_id);
                                  if (matched) handleOpenInCopilot(matched);
                                }}
                                title="Click to open in Split-View Reader"
                              >
                                {row.paper_title}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 3 }}>
                                {row.authors} ({row.year})
                              </div>
                            </div>

                            {/* Delete Paper Action */}
                            <button
                              onClick={(e) => handleDeletePaperFromMatrix(row.paper_id, e)}
                              title="Remove paper from comparison matrix"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#94a3b8',
                                cursor: 'pointer',
                                padding: 2,
                                borderRadius: 4
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = '#dc2626')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </td>

                        {/* Attribute Cells */}
                        {matrixData.columns.map((col, colIdx) => {
                          const cellVal = row.cells[col] || 'Documented in publication methodology.';
                          return (
                            <td
                              key={colIdx}
                              onClick={() => setSelectedCell({ paperTitle: row.paper_title, column: col, value: cellVal, paperId: row.paper_id })}
                              style={{
                                padding: '12px 16px',
                                verticalAlign: 'top',
                                color: '#334155',
                                cursor: 'pointer',
                                transition: 'background 0.15s',
                                borderRight: colIdx < matrixData.columns.length - 1 ? '1px solid #f8fafc' : undefined
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                              title="Click to view full excerpt"
                            >
                              <div style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                lineHeight: 1.45,
                                fontSize: '0.82rem'
                              }}>
                                {cellVal}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Modal: Add Paper to Matrix */}
            {showAddPaperModal && (
              <div className="modal-overlay" onClick={() => setShowAddPaperModal(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>Add Paper to Comparison Matrix</h4>
                      <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Select from searched papers or input an OpenAlex ID/DOI</p>
                    </div>
                    <button onClick={() => setShowAddPaperModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                      <X size={18} color="#64748b" />
                    </button>
                  </div>
                  <div className="modal-body">
                    {/* Manual Input */}
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: 4 }}>
                        Enter DOI or OpenAlex ID:
                      </label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input
                          type="text"
                          placeholder="e.g. 10.48550/arXiv.1706.03762 or W3125678901"
                          value={manualPaperIdInput}
                          onChange={(e) => setManualPaperIdInput(e.target.value)}
                          style={{
                            flex: 1,
                            padding: '7px 10px',
                            borderRadius: 6,
                            border: '1px solid #cbd5e1',
                            fontSize: '0.82rem',
                            outline: 'none'
                          }}
                        />
                        <button
                          className="btn-sm-primary"
                          onClick={() => {
                            if (manualPaperIdInput.trim()) {
                              handleAddPaperToMatrix(manualPaperIdInput.trim());
                              setManualPaperIdInput('');
                              setShowAddPaperModal(false);
                            }
                          }}
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Available Searched Papers */}
                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 10 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>
                        From Active Search Results:
                      </div>
                      <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {papers.map((p) => {
                          const inMatrix = matrixPapers.includes(p.id);
                          return (
                            <div
                              key={p.id}
                              style={{
                                padding: '8px 10px',
                                border: '1px solid #e2e8f0',
                                borderRadius: 6,
                                background: inMatrix ? '#f8fafc' : '#ffffff',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}
                            >
                              <div style={{ fontSize: '0.8rem', color: '#0f172a', fontWeight: 500, maxWidth: 360 }}>
                                {p.title} ({p.year})
                              </div>
                              <button
                                className={inMatrix ? 'btn-sm-secondary' : 'btn-sm-primary'}
                                style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                                disabled={inMatrix}
                                onClick={() => {
                                  handleAddPaperToMatrix(p.id);
                                  setShowAddPaperModal(false);
                                }}
                              >
                                {inMatrix ? 'Added' : '+ Add'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button className="btn-sm-secondary" onClick={() => setShowAddPaperModal(false)}>Close</button>
                  </div>
                </div>
              </div>
            )}

            {/* Cell Inspection Drawer Modal */}
            {selectedCell && (
              <div className="modal-overlay" onClick={() => setSelectedCell(null)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>{selectedCell.column}</h4>
                      <p style={{ fontSize: '0.78rem', color: '#64748b' }}>{selectedCell.paperTitle}</p>
                    </div>
                    <button onClick={() => setSelectedCell(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                      <X size={18} color="#64748b" />
                    </button>
                  </div>
                  <div className="modal-body">
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2563eb', textTransform: 'uppercase', marginBottom: 4 }}>
                      Extracted Empirical Provenance:
                    </div>
                    <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.6, background: '#f8fafc', padding: 14, borderRadius: 6, border: '1px solid #e2e8f0' }}>
                      {selectedCell.value}
                    </p>
                  </div>
                  <div className="modal-footer">
                    {selectedCell.paperId && (
                      <button
                        className="btn-sm-primary"
                        onClick={() => {
                          const matched = papers.find(p => p.id === selectedCell.paperId);
                          if (matched) {
                            handleOpenInCopilot(matched);
                            setSelectedCell(null);
                          }
                        }}
                      >
                        <BookOpen size={13} />
                        <span>Open in Reader</span>
                      </button>
                    )}
                    <button className="btn-sm-secondary" onClick={() => setSelectedCell(null)}>Close</button>
                  </div>
                </div>
              </div>
            )}
          </main>
        )}

        {/* Tab 3: Citation Network (Vastly Superior Visuals, Interactive Zoom/Pan, Orbit & Timeline Layouts) */}
        {activeTab === 'graph' && (
          <main className="page-container">
            {/* Top Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', fontFamily: 'var(--font-serif)' }}>
                  Citation Lineage & Intent Network
                </h2>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Interactive lineage map spanning foundational roots to recent preprints with in-text citation sentiment.
                </p>
              </div>

              {/* View & Filter Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {/* Node Search Bar */}
                <div style={{ position: 'relative' }}>
                  <Search size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    className="network-search-input"
                    placeholder="Search node or author..."
                    value={graphSearchQuery}
                    onChange={(e) => setGraphSearchQuery(e.target.value)}
                  />
                  {graphSearchQuery && (
                    <button
                      onClick={() => setGraphSearchQuery('')}
                      style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* View Mode Toggle: Network Orbit vs Timeline */}
                <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: 6, overflow: 'hidden' }}>
                  <button
                    onClick={() => { setGraphViewMode('network'); resetNetworkTransform(); }}
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      border: 'none',
                      background: graphViewMode === 'network' ? '#2563eb' : '#ffffff',
                      color: graphViewMode === 'network' ? '#ffffff' : '#334155',
                      cursor: 'pointer'
                    }}
                  >
                    Orbit Lineage
                  </button>
                  <button
                    onClick={() => { setGraphViewMode('timeline'); resetNetworkTransform(); }}
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      border: 'none',
                      background: graphViewMode === 'timeline' ? '#2563eb' : '#ffffff',
                      color: graphViewMode === 'timeline' ? '#ffffff' : '#334155',
                      cursor: 'pointer'
                    }}
                  >
                    Timeline Flow
                  </button>
                </div>

                {/* Intent Legend / Filter Chips */}
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: '0.75rem' }}>
                  <button
                    onClick={() => setGraphIntentFilter(graphIntentFilter === 'supporting' ? 'all' : 'supporting')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      background: graphIntentFilter === 'supporting' ? '#ecfdf5' : '#ffffff',
                      border: '1px solid',
                      borderColor: graphIntentFilter === 'supporting' ? '#a7f3d0' : '#e2e8f0',
                      color: graphIntentFilter === 'supporting' ? '#065f46' : '#475569',
                      padding: '3px 8px',
                      borderRadius: 12,
                      cursor: 'pointer',
                      fontWeight: 500
                    }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a' }} /> Supporting
                  </button>
                  <button
                    onClick={() => setGraphIntentFilter(graphIntentFilter === 'contrasting' ? 'all' : 'contrasting')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      background: graphIntentFilter === 'contrasting' ? '#fee2e2' : '#ffffff',
                      border: '1px solid',
                      borderColor: graphIntentFilter === 'contrasting' ? '#fecaca' : '#e2e8f0',
                      color: graphIntentFilter === 'contrasting' ? '#991b1b' : '#475569',
                      padding: '3px 8px',
                      borderRadius: 12,
                      cursor: 'pointer',
                      fontWeight: 500
                    }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#dc2626' }} /> Contrasting
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Graph Canvas + Inspector */}
            <div className="network-canvas-container">
              {/* SVG Visual Canvas with Zoom & Pan */}
              <div
                className="network-svg-wrapper"
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                onWheel={handleCanvasWheel}
              >
                <svg
                  ref={svgRef}
                  width="100%"
                  height="520"
                  viewBox="0 0 900 520"
                  style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
                >
                  <defs>
                    {/* Shadow filter for nodes */}
                    <filter id="node-shadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1" />
                    </filter>

                    {/* Arrow markers */}
                    <marker id="arrow-supporting" markerWidth="9" markerHeight="9" refX="28" refY="4.5" orient="auto">
                      <polygon points="0 0, 9 4.5, 0 9" fill="#16a34a" />
                    </marker>
                    <marker id="arrow-contrasting" markerWidth="9" markerHeight="9" refX="28" refY="4.5" orient="auto">
                      <polygon points="0 0, 9 4.5, 0 9" fill="#dc2626" />
                    </marker>
                    <marker id="arrow-mentioning" markerWidth="9" markerHeight="9" refX="28" refY="4.5" orient="auto">
                      <polygon points="0 0, 9 4.5, 0 9" fill="#94a3b8" />
                    </marker>
                  </defs>

                  {/* Main Pannable / Zoomable Container */}
                  <g transform={`translate(${graphPan.x}, ${graphPan.y}) scale(${graphZoom})`} style={{ transformOrigin: '450px 250px' }}>
                    {/* Orbit Guides in Network Mode */}
                    {graphViewMode === 'network' && (
                      <g opacity="0.45" pointerEvents="none">
                        <circle cx="450" cy="250" r="165" fill="none" stroke="#cbd5e1" strokeDasharray="4 4" strokeWidth="1.2" />
                        <circle cx="450" cy="250" r="255" fill="none" stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1.2" />
                        <text x="450" y="78" fontSize="9.5" fill="#94a3b8" textAnchor="middle" fontWeight="500">
                          Downstream Extensions & Paradigms
                        </text>
                        <text x="450" y="102" fontSize="8.5" fill="#cbd5e1" textAnchor="middle">
                          Outer Orbit (R=255px)
                        </text>
                      </g>
                    )}

                    {/* Timeline Axis & Grid in Timeline Mode */}
                    {graphViewMode === 'timeline' && (
                      <g opacity="0.6" pointerEvents="none">
                        {/* Horizontal Time Baseline */}
                        <line x1="90" y1="420" x2="810" y2="420" stroke="#cbd5e1" strokeWidth="1.5" />
                        <text x="90" y="440" fontSize="10" fill="#475569" fontWeight="600" textAnchor="middle">Earlier Foundations</text>
                        <text x="810" y="440" fontSize="10" fill="#2563eb" fontWeight="600" textAnchor="middle">Recent (2025–2026)</text>
                        <text x="50" y="240" fontSize="10" fill="#64748b" textAnchor="middle" transform="rotate(-90 50 240)" fontWeight="600">
                          Higher Citation Impact (Log Scale) ↑
                        </text>
                        {/* Vertical Year Grid Dividers */}
                        {[2000, 2012, 2017, 2020, 2023, 2025].map(yr => {
                          const minYr = 1998;
                          const maxYr = 2026;
                          const xPos = 110 + ((yr - minYr) / (maxYr - minYr)) * 680;
                          return (
                            <g key={yr}>
                              <line x1={xPos} y1="70" x2={xPos} y2="420" stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth="1" />
                              <text x={xPos} y="438" fontSize="9" fill="#94a3b8" textAnchor="middle">{yr}</text>
                            </g>
                          );
                        })}
                      </g>
                    )}

                    {/* Citation Edges (Curved Bezier Paths) */}
                    {filteredGraphEdges.map((edge, idx) => {
                      const sourceNode = graphData?.nodes?.find(n => n.id === edge.source);
                      const targetNode = graphData?.nodes?.find(n => n.id === edge.target);
                      if (!sourceNode || !targetNode) return null;

                      const sx = graphViewMode === 'timeline' ? (sourceNode.timeline_x || sourceNode.x) : sourceNode.x;
                      const sy = graphViewMode === 'timeline' ? (sourceNode.timeline_y || sourceNode.y) : sourceNode.y;
                      const tx = graphViewMode === 'timeline' ? (targetNode.timeline_x || targetNode.x) : targetNode.x;
                      const ty = graphViewMode === 'timeline' ? (targetNode.timeline_y || targetNode.y) : targetNode.y;

                      const color = edge.intent === 'supporting' ? '#16a34a' : edge.intent === 'contrasting' ? '#dc2626' : '#94a3b8';
                      const marker = `url(#arrow-${edge.intent})`;
                      const isSelected = selectedEdge === edge;

                      // Focus / Hover dimming logic
                      let isHighlighted = isSelected;
                      let isDimmed = false;
                      if (activeFocusNodeId) {
                        const isConnected = edge.source === activeFocusNodeId || edge.target === activeFocusNodeId;
                        if (isConnected) {
                          isHighlighted = true;
                        } else {
                          isDimmed = true;
                        }
                      }

                      // Compute smooth curved Bezier path
                      let pathD = '';
                      if (graphViewMode === 'network') {
                        // Quadratic Bezier bending around center
                        const midX = (sx + tx) / 2;
                        const midY = (sy + ty) / 2;
                        const curveOffset = (idx % 2 === 0 ? 18 : -18);
                        const cx = midX + (sy - ty) * 0.12 + curveOffset;
                        const cy = midY + (tx - sx) * 0.12 + curveOffset;
                        pathD = `M ${sx} ${sy} Q ${cx} ${cy} ${tx} ${ty}`;
                      } else {
                        // Arching Bezier curve across time
                        const span = tx - sx;
                        const archHeight = Math.min(60, Math.max(25, Math.abs(span) * 0.15));
                        pathD = `M ${sx} ${sy} C ${sx + span * 0.3} ${Math.min(sy, ty) - archHeight}, ${sx + span * 0.7} ${Math.min(sy, ty) - archHeight}, ${tx} ${ty}`;
                      }

                      return (
                        <g key={idx} onClick={() => { setSelectedEdge(edge); setSelectedNode(null); }} style={{ cursor: 'pointer' }}>
                          <path
                            d={pathD}
                            fill="none"
                            stroke={color}
                            strokeWidth={isHighlighted ? 3.5 : (isSelected ? 3 : 2)}
                            strokeDasharray={edge.intent === 'contrasting' ? '5,4' : undefined}
                            markerEnd={marker}
                            opacity={isDimmed ? 0.12 : (isHighlighted ? 1 : 0.65)}
                            style={{ transition: 'opacity 0.2s ease, stroke-width 0.2s ease' }}
                          />
                        </g>
                      );
                    })}

                    {/* Nodes (Circles scaled by Log Citations) */}
                    {graphData?.nodes?.map((node, nodeIdx) => {
                      const nx = graphViewMode === 'timeline' ? (node.timeline_x || node.x) : node.x;
                      const ny = graphViewMode === 'timeline' ? (node.timeline_y || node.y) : node.y;
                      const isSelected = selectedNode?.id === node.id;
                      const isHovered = hoveredNodeId === node.id;
                      const isMatchedBySearch = matchedNodeIds.has(node.id);
                      const isSeedPaper = nodeIdx === 0;

                      // Focus / Hover dimming logic for nodes
                      let isNodeDimmed = false;
                      if (activeFocusNodeId && activeFocusNodeId !== node.id) {
                        const isConnected = graphData?.edges?.some(e =>
                          (e.source === activeFocusNodeId && e.target === node.id) ||
                          (e.target === activeFocusNodeId && e.source === node.id)
                        );
                        if (!isConnected && !isMatchedBySearch) {
                          isNodeDimmed = true;
                        }
                      }

                      const nodeRadius = node.radius || 24;

                      return (
                        <g
                          key={node.id}
                          transform={`translate(${nx}, ${ny})`}
                          onClick={() => { setSelectedNode(node); setSelectedEdge(null); }}
                          onMouseEnter={() => setHoveredNodeId(node.id)}
                          onMouseLeave={() => setHoveredNodeId(null)}
                          style={{
                            cursor: 'pointer',
                            opacity: isNodeDimmed ? 0.22 : 1,
                            transition: 'opacity 0.2s ease'
                          }}
                        >
                          {/* Pulsating outer ring for seed / focal paper */}
                          {isSeedPaper && (
                            <circle
                              r={nodeRadius + 8}
                              fill="none"
                              stroke="#3b82f6"
                              strokeWidth="2"
                              strokeDasharray="4 4"
                              opacity="0.8"
                            />
                          )}

                          {/* Glow ring for search match or hover */}
                          {(isMatchedBySearch || isHovered) && (
                            <circle
                              r={nodeRadius + 6}
                              fill="none"
                              stroke={isMatchedBySearch ? '#f59e0b' : '#3b82f6'}
                              strokeWidth="3"
                              opacity="0.9"
                            />
                          )}

                          {/* Main node circle */}
                          <circle
                            r={nodeRadius}
                            fill={isSelected ? '#2563eb' : (isSeedPaper ? '#eff6ff' : '#ffffff')}
                            stroke={isSelected ? '#1d4ed8' : (isSeedPaper ? '#2563eb' : '#cbd5e1')}
                            strokeWidth={isSelected || isSeedPaper ? '2.5' : '2'}
                            filter="url(#node-shadow)"
                          />

                          {/* Open access emerald indicator dot */}
                          {node.is_oa && (
                            <circle
                              cx={nodeRadius * 0.7}
                              cy={-nodeRadius * 0.7}
                              r="4.5"
                              fill="#10b981"
                              stroke="#ffffff"
                              strokeWidth="1.5"
                            />
                          )}

                          {/* Short Author Label */}
                          <text
                            textAnchor="middle"
                            dy=".35em"
                            fontSize={nodeRadius > 26 ? '10.5' : '9'}
                            fontWeight="700"
                            fill={isSelected ? '#ffffff' : '#0f172a'}
                          >
                            {node.short_label}
                          </text>

                          {/* Year & Citations Badge */}
                          <text
                            textAnchor="middle"
                            dy={nodeRadius + 14}
                            fontSize="8.5"
                            fill="#64748b"
                            fontWeight="600"
                          >
                            {node.year} • {node.citations >= 1000 ? `${(node.citations / 1000).toFixed(0)}k` : node.citations} cites
                          </text>
                        </g>
                      );
                    })}
                  </g>
                </svg>

                {/* Canvas Floating Zoom Toolbar */}
                <div className="network-zoom-toolbar">
                  <button
                    className="zoom-btn"
                    onClick={() => setGraphZoom(z => Math.min(2.5, z + 0.2))}
                    title="Zoom in (+)"
                  >
                    <ZoomIn size={13} />
                  </button>
                  <button
                    className="zoom-btn"
                    onClick={() => setGraphZoom(z => Math.max(0.5, z - 0.2))}
                    title="Zoom out (-)"
                  >
                    <ZoomOut size={13} />
                  </button>
                  <button
                    className="zoom-btn"
                    onClick={resetNetworkTransform}
                    title="Reset to 100%"
                  >
                    <RotateCcw size={13} />
                    <span>{(graphZoom * 100).toFixed(0)}%</span>
                  </button>
                </div>
              </div>

              {/* Inspector Panel on Right */}
              <div className="network-inspector-drawer">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a' }}>
                    Network Inspector
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    {graphData?.nodes?.length || 0} nodes • {graphData?.edges?.length || 0} citations
                  </span>
                </div>

                {/* Selected Node Details */}
                {selectedNode && (
                  <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Selected Paper
                      </span>
                      {selectedNode.is_oa ? (
                        <span className="badge-oa" style={{ padding: '1px 5px', fontSize: '0.68rem' }}>
                          <Unlock size={9} /> Open Access
                        </span>
                      ) : (
                        <span className="badge-abstract" style={{ padding: '1px 5px', fontSize: '0.68rem' }}>
                          <BookOpen size={9} /> Abstract Only
                        </span>
                      )}
                    </div>

                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', fontFamily: 'var(--font-serif)', lineHeight: 1.35 }}>
                      {selectedNode.title}
                    </h4>

                    <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.4 }}>
                      <span>{selectedNode.authors?.join(', ')}</span> • <span style={{ fontWeight: 600 }}>{selectedNode.year}</span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
                      {selectedNode.venue}
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Quote size={12} color="#2563eb" />
                      <span><strong>{selectedNode.citations?.toLocaleString()}</strong> total citations</span>
                    </div>

                    {/* Clickable Verified DOI Link */}
                    {selectedNode.doi && (
                      <div className="paper-doi-line" style={{ margin: '2px 0 4px 0' }}>
                        <ExternalLink size={10} />
                        <a
                          href={selectedNode.landing_url || (selectedNode.doi.startsWith('http') ? selectedNode.doi : `https://doi.org/${selectedNode.doi}`)}
                          target="_blank"
                          rel="noreferrer"
                          className="paper-doi-link"
                          style={{ fontSize: '0.72rem' }}
                        >
                          doi: {selectedNode.doi.replace('https://doi.org/', '')}
                        </a>
                        <button
                          className="paper-doi-copy-btn"
                          onClick={(e) => handleCopyDoi(selectedNode.doi, e)}
                          title="Copy DOI"
                        >
                          <Copy size={10} />
                        </button>
                      </div>
                    )}

                    {/* Research Topics Chips */}
                    {selectedNode.topics && selectedNode.topics.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
                        {selectedNode.topics.slice(0, 4).map((t: string) => (
                          <span
                            key={t}
                            className="topic-tag-chip"
                            style={{ fontSize: '0.68rem', padding: '1px 6px' }}
                            onClick={() => handleSearchTopic(t)}
                            title={`Search topic "${t}"`}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Decoded Abstract Preview in Inspector */}
                    {selectedNode.abstract && (
                      <div style={{ marginTop: 4, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', maxHeight: 110, overflowY: 'auto' }}>
                        <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748b', marginBottom: 2 }}>Abstract Preview:</div>
                        <p style={{ fontSize: '0.75rem', color: '#334155', lineHeight: 1.45 }}>
                          {selectedNode.abstract}
                        </p>
                      </div>
                    )}

                    {/* Connected Lineage Links (Upstream & Downstream) */}
                    <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {inspectorConnections.upstream.length > 0 && (
                        <div>
                          <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', marginBottom: 3 }}>
                            Foundational Works Cited ({inspectorConnections.upstream.length}):
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {inspectorConnections.upstream.map(({ node: upNode, edge: upEdge }) => (
                              <button
                                key={upNode.id}
                                className="connected-node-pill"
                                onClick={() => setSelectedNode(upNode)}
                              >
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  ← {upNode.short_label} ({upNode.year})
                                </span>
                                <span className={`pill-stance pill-${upEdge.intent === 'supporting' ? 'supported' : upEdge.intent === 'contrasting' ? 'disputing' : 'neutral'}`} style={{ fontSize: '0.62rem', padding: '1px 4px' }}>
                                  {upEdge.intent}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {inspectorConnections.downstream.length > 0 && (
                        <div>
                          <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', marginBottom: 3 }}>
                            Subsequent Papers Citing This ({inspectorConnections.downstream.length}):
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {inspectorConnections.downstream.map(({ node: downNode, edge: downEdge }) => (
                              <button
                                key={downNode.id}
                                className="connected-node-pill"
                                onClick={() => setSelectedNode(downNode)}
                              >
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  → {downNode.short_label} ({downNode.year})
                                </span>
                                <span className={`pill-stance pill-${downEdge.intent === 'supporting' ? 'supported' : downEdge.intent === 'contrasting' ? 'disputing' : 'neutral'}`} style={{ fontSize: '0.62rem', padding: '1px 4px' }}>
                                  {downEdge.intent}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Quick Row Actions */}
                    <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button
                        className="btn-sm-primary"
                        style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                        onClick={() => {
                          const matched = papers.find(p => p.id === selectedNode.id) || {
                            id: selectedNode.id,
                            title: selectedNode.title,
                            authors: selectedNode.authors,
                            year: selectedNode.year,
                            venue: selectedNode.venue,
                            citation_count: selectedNode.citations,
                            influential_citations: 100,
                            abstract: selectedNode.abstract || 'Paper details loaded from citation network.',
                            tldr: selectedNode.tldr || selectedNode.title,
                            pdf_url: selectedNode.pdf_url,
                            is_oa: selectedNode.is_oa
                          };
                          handleOpenInCopilot(matched);
                        }}
                      >
                        <BookOpen size={11} /> Open in Reader
                      </button>

                      <button
                        className="btn-sm-secondary"
                        style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                        onClick={() => handleAddPaperToMatrix(selectedNode.id)}
                      >
                        <TableIcon size={11} /> + Matrix
                      </button>

                      <button
                        className="btn-sm-secondary"
                        style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                        onClick={() => handleCopyCitation({
                          id: selectedNode.id,
                          title: selectedNode.title,
                          authors: selectedNode.authors?.join(', '),
                          year: selectedNode.year,
                          venue: selectedNode.venue,
                          citation_count: selectedNode.citations,
                          evidence: selectedNode.tldr || selectedNode.title,
                          stance: 'supported',
                          doi: selectedNode.doi
                        })}
                      >
                        <Copy size={11} /> Cite
                      </button>
                    </div>
                  </div>
                )}

                {/* Selected Edge / Citation Context */}
                {selectedEdge && (
                  <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>
                      Citation Intent & Supporting Excerpt
                    </div>
                    <div>
                      <span className={`pill-stance pill-${selectedEdge.intent === 'supporting' ? 'supported' : selectedEdge.intent === 'contrasting' ? 'disputing' : 'neutral'}`}>
                        {selectedEdge.intent.toUpperCase()}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#334155', fontStyle: 'italic', lineHeight: 1.45, background: '#ffffff', padding: '8px 10px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                      &quot;{selectedEdge.snippet}&quot;
                    </p>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Section: <strong>{selectedEdge.section}</strong> • Confidence: <strong>{(selectedEdge.confidence * 100).toFixed(0)}%</strong>
                    </div>
                  </div>
                )}

                {!selectedNode && !selectedEdge && (
                  <div style={{ padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                    <Layers size={24} color="#94a3b8" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                    <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.45 }}>
                      Click any node or citation arrow in the canvas to inspect citation context, sentiment, and connected papers.
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 6 }}>
                      Drag canvas to pan • Scroll to zoom • Hover over nodes to highlight connections.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </main>
        )}

        {/* Tab 4: Research Gap Radar (Actionable, Realistic & Clear) */}
        {activeTab === 'gaps' && (
          <main className="page-container">
            {/* Header with Category Filter */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', fontFamily: 'var(--font-serif)' }}>
                  Research Gap & Frontier Radar
                </h2>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 2 }}>
                  Automated discovery of published limitations, active scientific debates, and high-impact capstone thesis opportunities.
                </p>
              </div>

              {/* Category Pills */}
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  className={`filter-chip ${gapActiveCategory === 'all' ? 'active' : ''}`}
                  onClick={() => setGapActiveCategory('all')}
                >
                  All Insights
                </button>
                <button
                  className={`filter-chip ${gapActiveCategory === 'bottlenecks' ? 'active' : ''}`}
                  onClick={() => setGapActiveCategory('bottlenecks')}
                >
                  Limitations & Bottlenecks
                </button>
                <button
                  className={`filter-chip ${gapActiveCategory === 'debates' ? 'active' : ''}`}
                  onClick={() => setGapActiveCategory('debates')}
                >
                  Scientific Debates
                </button>
                <button
                  className={`filter-chip ${gapActiveCategory === 'thesis' ? 'active' : ''}`}
                  onClick={() => setGapActiveCategory('thesis')}
                >
                  Thesis Frontiers
                </button>
              </div>
            </div>

            {gapData && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* 1. Stated Literature Bottlenecks & Limitations */}
                {(gapActiveCategory === 'all' || gapActiveCategory === 'bottlenecks') && (
                  <section style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 20, boxShadow: 'var(--shadow-xs)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <AlertCircle size={18} color="#dc2626" />
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
                        Documented Limitations & Architectural Bottlenecks
                      </h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 14 }}>
                      {gapData.limitation_clusters.map((cluster, idx) => (
                        <div key={idx} style={{ background: '#fafbfc', border: '1px solid #edf2f7', borderRadius: 6, padding: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{cluster.cluster_name}</span>
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              padding: '2px 7px',
                              borderRadius: 4,
                              background: '#fee2e2',
                              color: '#b91c1c'
                            }}>
                              Severity: {cluster.severity}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.82rem', color: '#334155', marginTop: 8, lineHeight: 1.5 }}>
                            {cluster.description}
                          </p>
                          <div style={{ marginTop: 8, fontSize: '0.78rem', color: '#15803d', fontWeight: 500 }}>
                            <strong>Emerging Solution:</strong> {cluster.emerging_solution}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 2. Scientific Debates & Opposing Findings */}
                {(gapActiveCategory === 'all' || gapActiveCategory === 'debates') && (
                  <section style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 20, boxShadow: 'var(--shadow-xs)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <GitFork size={18} color="#d97706" />
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
                        Active Controversies & Disputed Claims
                      </h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {gapData.contradiction_pairs.map((dispute, idx) => (
                        <div key={idx} style={{ background: '#fafbfc', border: '1px solid #edf2f7', borderRadius: 6, padding: 14 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0f172a' }}>
                            Point of Contention: {dispute.dispute_point}
                          </div>
                          <p style={{ fontSize: '0.82rem', color: '#475569', marginTop: 4, lineHeight: 1.5 }}>
                            {dispute.details}
                          </p>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 6 }}>
                            Between: <strong>{dispute.paper_a}</strong> vs <strong>{dispute.paper_b}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 3. Actionable Capstone / Thesis Research Frontiers */}
                {(gapActiveCategory === 'all' || gapActiveCategory === 'thesis') && (
                  <section style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 20, boxShadow: 'var(--shadow-xs)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <Lightbulb size={18} color="#2563eb" />
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
                        Actionable Capstone & Semester Thesis Opportunities
                      </h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 14 }}>
                      {gapData.unexplored_frontiers.map((frontier, idx) => (
                        <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                            <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.92rem', fontFamily: 'var(--font-serif)' }}>
                              {frontier.title}
                            </span>
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: 4,
                              background: '#eff6ff',
                              color: '#2563eb',
                              flexShrink: 0
                            }}>
                              Score: {frontier.opportunity_score}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.8rem', color: '#334155', marginTop: 8 }}>
                            <strong>Untested Intersection:</strong> {frontier.untested_intersection}
                          </div>
                          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 6, lineHeight: 1.5 }}>
                            <strong>Suggested Methodology:</strong> {frontier.suggested_methodology}
                          </p>
                          <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: 8 }}>
                            Feasibility: {frontier.thesis_feasibility}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </main>
        )}

        {/* Tab 5: Split-View Paper Reader & Grounded Copilot (Intuitive with Paper Switcher) */}
        {activeTab === 'copilot' && (
          <div className="split-view-container">
            {/* Left Pane: Interactive Document Reader */}
            <div className="reader-pane">
              {/* Paper Switcher Topbar */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: 12,
                marginBottom: 16,
                borderBottom: '1px solid #e2e8f0',
                flexWrap: 'wrap',
                gap: 8
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>Switch Paper:</span>
                  <select
                    value={activeCopilotPaper.id}
                    onChange={(e) => {
                      const selected = papers.find(p => p.id === e.target.value);
                      if (selected) handleOpenInCopilot(selected);
                    }}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      fontSize: '0.8rem',
                      background: '#ffffff',
                      color: '#0f172a',
                      maxWidth: 320,
                      outline: 'none'
                    }}
                  >
                    {papers.map(p => (
                      <option key={p.id} value={p.id}>{p.title} ({p.year})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className="btn-sm-secondary"
                    onClick={() => handleAddPaperToMatrix(activeCopilotPaper.id)}
                    title="Add this paper to Comparison Matrix"
                  >
                    <TableIcon size={12} /> + Matrix
                  </button>
                  <button
                    className="btn-sm-secondary"
                    onClick={() => {
                      const citation = `${activeCopilotPaper.authors?.join(', ')} (${activeCopilotPaper.year}). "${activeCopilotPaper.title}." ${activeCopilotPaper.venue}.`;
                      navigator.clipboard.writeText(citation);
                      showToast('Citation copied to clipboard!');
                    }}
                    title="Copy APA Citation"
                  >
                    <Copy size={12} /> Cite
                  </button>
                </div>
              </div>

              {/* Active Paper Header */}
              <div style={{ marginBottom: 16 }}>
                <span className="badge-oa">
                  <Unlock size={11} /> {activeCopilotPaper.license || 'Open Access PDF'}
                </span>
                <h2 style={{ fontSize: '1.45rem', fontWeight: 600, color: '#0f172a', marginTop: 8, lineHeight: 1.3, fontFamily: 'var(--font-serif)' }}>
                  {activeCopilotPaper.title}
                </h2>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 6 }}>
                  {activeCopilotPaper.authors?.join(', ')} • {activeCopilotPaper.year} • <em>{activeCopilotPaper.venue}</em> • <strong>{activeCopilotPaper.citation_count?.toLocaleString()} citations</strong>
                </div>
              </div>

              {/* Reader Section Navigation Tabs */}
              <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #e2e8f0', paddingBottom: 6, marginBottom: 16 }}>
                {[
                  { id: 'overview', label: 'Structured Overview' },
                  { id: 'math', label: 'Formulations & Math' },
                  { id: 'findings', label: 'Results & Benchmarks' },
                  { id: 'abstract', label: 'Full Abstract' }
                ].map(sec => (
                  <button
                    key={sec.id}
                    onClick={() => setReaderSection(sec.id as any)}
                    style={{
                      background: readerSection === sec.id ? '#eff6ff' : 'transparent',
                      color: readerSection === sec.id ? '#2563eb' : '#64748b',
                      fontWeight: readerSection === sec.id ? 600 : 500,
                      border: 'none',
                      borderRadius: 4,
                      padding: '4px 10px',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    {sec.label}
                  </button>
                ))}
              </div>

              {/* Document Content View */}
              {readerSection === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ background: '#f8fafc', padding: 14, borderRadius: 6, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2563eb', textTransform: 'uppercase' }}>TL;DR Synthesis</div>
                    <p style={{ fontSize: '0.88rem', color: '#0f172a', marginTop: 4, lineHeight: 1.5 }}>
                      {activeCopilotPaper.tldr}
                    </p>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>1. Problem & Core Motivation</h4>
                    <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.55 }}>
                      Standard sequential architectures (e.g., LSTMs, recurrent models) present severe parallelization bottlenecks during training and struggle to maintain long-range gradient flow without catastrophic forgetting or high memory footprint.
                    </p>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>2. Primary Methodology</h4>
                    <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.55 }}>
                      The publication establishes an empirical framework utilizing multi-head self-attention and positional encodings, dispensing with sequential dependencies entirely.
                    </p>
                  </div>
                </div>
              )}

              {readerSection === 'math' && (
                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
                    Scaled Dot-Product Attention Equation
                  </h4>
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 6,
                    padding: '16px 20px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.95rem',
                    color: '#0f172a',
                    marginBottom: 10
                  }}>
                    Attention(Q, K, V) = softmax((Q K^T) / sqrt(d_k)) V
                  </div>
                  <p style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: 1.55 }}>
                    The scaling factor 1/sqrt(d_k) prevents the dot products from growing excessively large for higher dimensions d_k,
                    which would otherwise push softmax into regions with vanishingly small gradients.
                  </p>
                </div>
              )}

              {readerSection === 'findings' && (
                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
                    Empirical Benchmarks & BLEU Metrics
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.55 }}>
                    Evaluated on WMT 2014 English-to-German (28.4 BLEU) and English-to-French (41.8 BLEU) machine translation benchmarks.
                    Trained with significantly superior parallelization on 8 NVIDIA P100 GPUs for 3.5 days.
                  </p>
                </div>
              )}

              {readerSection === 'abstract' && (
                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
                    Complete Publication Abstract
                  </h4>
                  <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.6 }}>
                    {activeCopilotPaper.abstract}
                  </p>
                </div>
              )}
            </div>

            {/* Right Pane: Grounded AI Copilot */}
            <div className="copilot-pane">
              <div className="copilot-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <BookOpen size={16} color="#2563eb" />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>Grounded Research Copilot</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>
                    Querying: <strong>{activeCopilotPaper.title.slice(0, 32)}...</strong>
                  </div>
                </div>
                <button
                  className="btn-sm-secondary"
                  onClick={() => setShowSettingsModal(true)}
                  title="Configure AI Model"
                >
                  <Sliders size={12} />
                </button>
              </div>

              {/* Messages Container */}
              <div className="copilot-messages">
                {copilotMessages.map((msg, idx) => (
                  <div key={idx} className={msg.sender === 'user' ? 'copilot-msg-user' : 'copilot-msg-assistant'}>
                    <div>{msg.text}</div>
                    {msg.citation && (
                      <div className="copilot-citation-tag">
                        <CheckCircle2 size={12} />
                        <span>{msg.citation}</span>
                      </div>
                    )}
                  </div>
                ))}
                {copilotLoading && (
                  <div className="copilot-msg-assistant">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Extracting grounded evidence from paper...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area with Quick Prompts */}
              <div className="copilot-input-area">
                <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
                  <button
                    className="topic-pill"
                    onClick={() => handleAskCopilot('Explain the attention formula')}
                  >
                    Attention Formula
                  </button>
                  <button
                    className="topic-pill"
                    onClick={() => handleAskCopilot('What are the limitations of this method?')}
                  >
                    Limitations
                  </button>
                  <button
                    className="topic-pill"
                    onClick={() => handleAskCopilot('What datasets were evaluated?')}
                  >
                    Datasets Evaluated
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={copilotInput}
                    onChange={(e) => setCopilotInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAskCopilot(copilotInput)}
                    placeholder="Ask questions grounded in this paper..."
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                  <button
                    className="btn-sm-primary"
                    onClick={() => handleAskCopilot(copilotInput)}
                    disabled={copilotLoading}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Modern Mobile Bottom Navigation Bar (Fixed for phones) */}
      <nav className="mobile-bottom-nav">
        <button
          className={`mobile-nav-btn ${activeTab === "discovery" ? "active" : ""}`}
          onClick={() => setActiveTab("discovery")}
        >
          <Search size={19} />
          <span>Discovery</span>
        </button>

        <button
          className={`mobile-nav-btn ${activeTab === "matrix" ? "active" : ""}`}
          onClick={() => setActiveTab("matrix")}
        >
          <TableIcon size={19} />
          <span>Matrix</span>
        </button>

        <button
          className={`mobile-nav-btn ${activeTab === "graph" ? "active" : ""}`}
          onClick={() => setActiveTab("graph")}
        >
          <GitFork size={19} />
          <span>Network</span>
        </button>

        <button
          className={`mobile-nav-btn ${activeTab === "gaps" ? "active" : ""}`}
          onClick={() => setActiveTab("gaps")}
        >
          <Lightbulb size={19} />
          <span>Gaps</span>
        </button>

        <button
          className={`mobile-nav-btn ${activeTab === "copilot" ? "active" : ""}`}
          onClick={() => setActiveTab("copilot")}
        >
          <BookOpen size={19} />
          <span>Copilot</span>
        </button>
      </nav>

      {/* Floating Action Toast Notification */}
      {toastMessage && (
        <div className="toast-notice">
          <Check size={14} color="#34d399" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* AI Provider & Backend Settings Modal */}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sliders size={18} color="#2563eb" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#0f172a', fontFamily: 'var(--font-serif)' }}>
                  AI Provider & API Configuration
                </h3>
              </div>
              <button onClick={() => setShowSettingsModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={18} color="#64748b" />
              </button>
            </div>

            <div className="modal-body">
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: 6 }}>
                  Select AI Reasoning Engine:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {[
                    { id: 'local', name: 'Local NLP (Free)', desc: 'Zero keys needed • 100% Offline' },
                    { id: 'gemini', name: 'Google Gemini', desc: 'gemini-1.5-flash / pro' },
                    { id: 'openai', name: 'OpenAI GPT-4o', desc: 'gpt-4o-mini / gpt-4o' },
                    { id: 'anthropic', name: 'Anthropic Claude', desc: 'claude-3-5-sonnet' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setAiProvider(p.id)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 6,
                        border: aiProvider === p.id ? '2px solid #2563eb' : '1px solid #cbd5e1',
                        background: aiProvider === p.id ? '#eff6ff' : '#ffffff',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>{p.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {aiProvider !== 'local' && (
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: 4 }}>
                    {aiProvider.toUpperCase()} API Key:
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="password"
                      placeholder={`Enter your ${aiProvider} API key...`}
                      value={aiApiKey}
                      onChange={(e) => setAiApiKey(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: 6,
                        border: '1px solid #cbd5e1',
                        fontSize: '0.85rem',
                        outline: 'none'
                      }}
                    />
                    <button
                      onClick={handleTestKey}
                      disabled={keyTesting}
                      className="btn-sm-secondary"
                    >
                      {keyTesting ? <RefreshCw size={12} className="animate-spin" /> : 'Test Key'}
                    </button>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>
                    API keys are stored securely in session storage only. Never saved to git or server logs.
                  </div>

                  {keyTestResult && (
                    <div style={{
                      marginTop: 8,
                      padding: 8,
                      borderRadius: 6,
                      fontSize: '0.78rem',
                      background: keyTestResult.valid ? '#dcfce7' : '#fee2e2',
                      color: keyTestResult.valid ? '#15803d' : '#b91c1c',
                      border: `1px solid ${keyTestResult.valid ? '#bbf7d0' : '#fecaca'}`
                    }}>
                      {keyTestResult.message}
                    </div>
                  )}
                </div>
              )}

              {/* Backend & Academic Service Information */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
                  Backend & Ingestion Services:
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.5 }}>
                  • OpenAlex Live API: Connected (Polite Pool authenticated)<br />
                  • Legitimate Full-Text Resolvers: Unpaywall REST v2, arXiv canonical, Europe PMC<br />
                  • Local Inference: Deterministic NLP extractor (Zero-latency fallback)
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-sm-secondary"
                onClick={() => setShowSettingsModal(false)}
              >
                Close
              </button>
              <button
                className="btn-sm-primary"
                onClick={() => {
                  saveAiSettings(aiProvider, aiApiKey, aiModel);
                  setShowSettingsModal(false);
                }}
              >
                Save & Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
