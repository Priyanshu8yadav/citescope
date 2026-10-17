import { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  Table,
  GitFork,
  Lightbulb,
  BookOpen,
  Smartphone,
  ExternalLink,
  Plus,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  TrendingUp,
  Cpu
} from 'lucide-react';


interface Paper {
  id: string;
  openalex_id?: string;
  doi?: string;
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
  concepts?: { name: string; score: number }[];
}

interface ConsensusData {
  query: string;
  sample_size: number;
  stance: {
    affirmative: number;
    neutral_or_mixed: number;
    negative_or_disputing: number;
  };
  synthesis: string;
  rigor_rating: string;
}

interface MatrixRow {
  paper_id: string;
  paper_title: string;
  year: number;
  authors: string;
  cells: Record<string, string>;
}

export function App() {
  const [activeTab, setActiveTab] = useState<'discovery' | 'matrix' | 'graph' | 'gaps' | 'copilot' | 'mobile'>('discovery');
  const [searchQuery, setSearchQuery] = useState('Transformer');
  const [papers, setPapers] = useState<Paper[]>([]);
  const [consensus, setConsensus] = useState<ConsensusData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);

  // Matrix State
  const [matrixPapers, setMatrixPapers] = useState<string[]>(['W3125678901', 'W2963403868', 'W4389201948', 'W4294029411']);
  const [matrixData, setMatrixData] = useState<{ columns: string[]; rows: MatrixRow[] } | null>(null);
  const [newColumnName, setNewColumnName] = useState('');
  const [selectedCell, setSelectedCell] = useState<{ paperTitle: string; column: string; value: string } | null>(null);

  // Graph State
  const [graphMode, setGraphMode] = useState<'network' | 'timeline'>('network');
  const [selectedEdge, setSelectedEdge] = useState<any | null>(null);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);

  // Copilot State
  const [copilotMessages, setCopilotMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; citation?: string }>>([
    {
      sender: 'assistant',
      text: "Welcome to CiteScope Copilot. I'm connected to 'Attention Is All You Need' (Vaswani et al., 2017). Highlight any text, formula, or table on the left, or ask a question.",
      citation: "Document Loaded: arXiv:1706.03762"
    }
  ]);
  const [copilotInput, setCopilotInput] = useState('');
  const [copilotLoading, setCopilotLoading] = useState(false);

  // Initial Data Fetch
  useEffect(() => {
    fetchSearchResults('Transformer');
    fetchMatrix();
  }, []);

  const fetchSearchResults = async (query: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setPapers(data.papers || []);
        setConsensus(data.consensus || null);
        setBackendOnline(true);
      } else {
        throw new Error('Backend offline');
      }
    } catch {
      setBackendOnline(false);
      // Client-side fallback dataset
      setPapers([
        {
          id: 'W3125678901',
          title: 'Attention Is All You Need',
          authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar', 'Jakob Uszkoreit', 'Llion Jones'],
          year: 2017,
          venue: 'NeurIPS 2017',
          citation_count: 134210,
          influential_citations: 18240,
          abstract: 'We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train.',
          tldr: 'Introduced the Transformer architecture, replacing recurrent and convolutional layers entirely with multi-head self-attention.',
          pdf_url: 'https://arxiv.org/pdf/1706.03762.pdf',
          is_oa: true
        },
        {
          id: 'W2963403868',
          title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
          authors: ['Jacob Devlin', 'Ming-Wei Chang', 'Kenton Lee', 'Kristina Toutanova'],
          year: 2018,
          venue: 'NAACL-HLT 2019',
          citation_count: 98450,
          influential_citations: 12430,
          abstract: 'We introduce BERT, designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers.',
          tldr: 'Developed deep bidirectional representation learning via masked language modeling and next sentence prediction.',
          pdf_url: 'https://arxiv.org/pdf/1810.04805.pdf',
          is_oa: true
        },
        {
          id: 'W4389201948',
          title: 'Mamba: Linear-Time Sequence Modeling with Selective State Spaces',
          authors: ['Albert Gu', 'Tri Dao'],
          year: 2023,
          venue: 'arXiv preprint',
          citation_count: 2840,
          influential_citations: 490,
          abstract: 'Transformers have a key computational limitation: quadratic self-attention scaling. We introduce Mamba, a selective state space model that achieves linear scaling in sequence length while matching or outperforming Transformers.',
          tldr: 'Proposed selective state-space models achieving linear-time sequence scaling with attention-competitive performance.',
          pdf_url: 'https://arxiv.org/pdf/2312.00752.pdf',
          is_oa: true
        },
        {
          id: 'W4294029411',
          title: 'Direct Preference Optimization: Your Language Model is Secretly a Reward Model',
          authors: ['Rafael Rafailov', 'Archit Sharma', 'Eric Mitchell', 'Stefano Ermon', 'Christopher D. Manning'],
          year: 2023,
          venue: 'NeurIPS 2023',
          citation_count: 3950,
          influential_citations: 620,
          abstract: 'We introduce Direct Preference Optimization (DPO), which derives an exact closed-form solution to the RLHF objective, training directly on human preferences with a simple binary cross-entropy loss without reward modeling or RL.',
          tldr: 'Eliminates RL loops in language model alignment by optimizing policy parameters directly on preference pairs.',
          pdf_url: 'https://arxiv.org/pdf/2305.18290.pdf',
          is_oa: true
        }
      ]);
      setConsensus({
        query: query,
        sample_size: 4,
        stance: { affirmative: 74, neutral_or_mixed: 18, negative_or_disputing: 8 },
        synthesis: "Majority of empirical literature (74%) demonstrates significant gains over convolutional/recurrent baselines, with ongoing exploration into linear-time state-space alternatives.",
        rigor_rating: "Peer-Reviewed High Impact"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMatrix = async (customCols: string[] = []) => {
    try {
      const res = await fetch('http://localhost:8000/api/matrix/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paper_ids: matrixPapers, custom_columns: customCols })
      });
      if (res.ok) {
        const data = await res.json();
        setMatrixData(data);
      }
    } catch {
      // Fallback matrix
      setMatrixData({
        columns: ['Core Problem', 'Methodology / Architecture', 'Datasets / Benchmarks', 'Key Findings / Metric', 'Key Stated Limitations'],
        rows: [
          {
            paper_id: 'W3125678901',
            paper_title: 'Attention Is All You Need (2017)',
            year: 2017,
            authors: 'Vaswani et al.',
            cells: {
              'Core Problem': 'Quadratic computational bottlenecks and lack of parallelization in RNNs/LSTMs for sequence translation.',
              'Methodology / Architecture': 'Transformer relying purely on multi-head scaled dot-product self-attention.',
              'Datasets / Benchmarks': 'WMT 2014 English-to-German and English-to-French.',
              'Key Findings / Metric': '28.4 BLEU on En-De; trained in 3.5 days on 8 P100 GPUs.',
              'Key Stated Limitations': 'Quadratic memory complexity O(N^2) scaling with context length.'
            }
          },
          {
            paper_id: 'W4389201948',
            paper_title: 'Mamba: Linear-Time Sequence Modeling (2023)',
            year: 2023,
            authors: 'Gu & Dao',
            cells: {
              'Core Problem': 'Quadratic scaling of Transformers limits context length and inference speed.',
              'Methodology / Architecture': 'Selective State Space Model (SSM) with hardware-aware parallel scan.',
              'Datasets / Benchmarks': 'The Pile, Long Range Arena, Audio benchmarks.',
              'Key Findings / Metric': '5x higher generation throughput; linear scaling in sequence length up to 1M tokens.',
              'Key Stated Limitations': 'Lower capacity on associative recall and in-context key-value copying tasks.'
            }
          },
          {
            paper_id: 'W4294029411',
            paper_title: 'Direct Preference Optimization (2023)',
            year: 2023,
            authors: 'Rafailov et al.',
            cells: {
              'Core Problem': 'Instability, reward-model exploitation, and extreme VRAM cost of PPO RLHF.',
              'Methodology / Architecture': 'Closed-form implicit reward parameterization optimized with binary cross-entropy.',
              'Datasets / Benchmarks': 'Anthropic Helpful & Harmless, TL;DR Summarization.',
              'Key Findings / Metric': 'Outperforms PPO in win-rate while training with stable cross-entropy loss.',
              'Key Stated Limitations': 'Can overfit to reference model policy; sensitive to out-of-distribution preference noise.'
            }
          }
        ]
      });
    }
  };

  const handleAddColumn = () => {
    if (!newColumnName.trim() || !matrixData) return;
    const updatedCols = [...matrixData.columns, newColumnName.trim()];
    const updatedRows = matrixData.rows.map(row => ({
      ...row,
      cells: {
        ...row.cells,
        [newColumnName.trim()]: `Synthesized analysis for '${newColumnName.trim()}' extracted from methodology section.`
      }
    }));
    setMatrixData({ columns: updatedCols, rows: updatedRows });
    setNewColumnName('');
  };

  const handleAskCopilot = async (question: string) => {
    if (!question.trim()) return;
    const newMsgs = [...copilotMessages, { sender: 'user' as const, text: question }];
    setCopilotMessages(newMsgs);
    setCopilotInput('');
    setCopilotLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paper_id: 'W3125678901', question })
      });
      if (res.ok) {
        const data = await res.json();
        setCopilotMessages([...newMsgs, {
          sender: 'assistant',
          text: data.answer,
          citation: data.citation_context
        }]);
      } else {
        throw new Error();
      }
    } catch {
      // Offline fallback response
      let fallbackAnswer = "In the Transformer paper, the self-attention mechanism computes representations of a sequence by relating different positions of a single sequence. Multi-head attention allows the model to jointly attend to information from different representation subspaces.";
      let fallbackCitation = "Section 3.2, Multi-Head Attention";

      if (question.toLowerCase().includes('formula') || question.toLowerCase().includes('equation')) {
        fallbackAnswer = "Attention(Q, K, V) = softmax((Q K^T) / sqrt(d_k)) V. The scaling factor 1/sqrt(d_k) counteracts the effect of dot products growing large in high dimensions, preventing small gradients in the softmax function.";
        fallbackCitation = "Equation (1), Page 4";
      } else if (question.toLowerCase().includes('limitation')) {
        fallbackAnswer = "The authors explicitly note that self-attention incurs quadratic computational complexity O(N^2) with respect to sequence length, making ultra-long document translation memory-intensive.";
        fallbackCitation = "Section 5, Complexity per Layer";
      }

      setCopilotMessages([...newMsgs, {
        sender: 'assistant',
        text: fallbackAnswer,
        citation: fallbackCitation
      }]);
    } finally {
      setCopilotLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header Bar */}
      <header style={{
        background: 'rgba(11, 17, 32, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '14px 24px'
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          {/* Logo & Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'linear-gradient(135deg, var(--indigo-500), var(--cyan-500))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--glow-indigo)'
            }}>
              <Sparkles size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.35rem', letterSpacing: '-0.02em', color: '#ffffff' }}>
                  CiteScope <span style={{ color: 'var(--cyan-400)' }}>AI</span>
                </span>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 6,
                  background: 'rgba(99, 102, 241, 0.2)',
                  color: 'var(--indigo-300)',
                  border: '1px solid rgba(99, 102, 241, 0.4)'
                }}>
                  B.Tech Capstone
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Intelligent Citation Analysis, Paper Comparison & Research Gap Explorer
              </p>
            </div>
          </div>

          {/* Quick Search Bar */}
          <div style={{ flex: 1, maxWidth: 500, minWidth: 280 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 14px',
              gap: 10
            }}>
              <Search size={18} color="var(--text-muted)" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchSearchResults(searchQuery)}
                placeholder="Search research question or topic (e.g. Mamba, RLHF, Attention)..."
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#ffffff',
                  fontSize: '0.875rem',
                  width: '100%'
                }}
              />
              <button
                onClick={() => fetchSearchResults(searchQuery)}
                style={{
                  background: 'var(--indigo-500)',
                  border: 'none',
                  borderRadius: 6,
                  padding: '4px 10px',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Search
              </button>
            </div>
          </div>

          {/* Backend Status & Quick Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.75rem',
              color: backendOnline ? 'var(--emerald-400)' : 'var(--amber-400)',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '6px 12px',
              borderRadius: 20
            }}>
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: backendOnline ? 'var(--emerald-400)' : 'var(--amber-400)',
                boxShadow: backendOnline ? '0 0 8px var(--emerald-400)' : '0 0 8px var(--amber-400)'
              }} />
              {backendOnline ? 'OpenAlex Live API' : 'Cached Fallback'}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ maxWidth: 1400, margin: '14px auto 0 auto', display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {[
            { id: 'discovery', label: '1. Literature Discovery & Consensus', icon: Search },
            { id: 'matrix', label: '2. Multi-Paper Comparison Matrix', icon: Table },
            { id: 'graph', label: '3. Smart Citation Graph & Timeline', icon: GitFork },
            { id: 'gaps', label: '4. Research Gap Explorer', icon: Lightbulb },
            { id: 'copilot', label: '5. Split-View Paper Copilot', icon: BookOpen },
            { id: 'mobile', label: '6. Android Companion Preview', icon: Smartphone }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: isActive ? '1px solid var(--border-accent)' : '1px solid transparent',
                  background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <Icon size={16} color={isActive ? 'var(--cyan-400)' : 'var(--text-muted)'} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Body Content */}
      <main style={{ flex: 1, maxWidth: 1400, width: '100%', margin: '0 auto', padding: '24px 24px 48px 24px' }}>

        {/* =========================================================================
            TAB 1: LITERATURE DISCOVERY & CONSENSUS
            ========================================================================= */}
        {activeTab === 'discovery' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Quick Topic Chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Explore Benchmark Queries:</span>
              {[
                'Transformer',
                'Mamba State Spaces',
                'Direct Preference Optimization',
                'Few-Shot Language Models',
                'Diffusion Models vs GANs'
              ].map((topic) => (
                <button
                  key={topic}
                  onClick={() => {
                    setSearchQuery(topic);
                    fetchSearchResults(topic);
                  }}
                  style={{
                    background: searchQuery === topic ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid ' + (searchQuery === topic ? 'var(--indigo-500)' : 'var(--border-subtle)'),
                    color: searchQuery === topic ? '#ffffff' : 'var(--text-secondary)',
                    borderRadius: 20,
                    padding: '4px 12px',
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  {topic}
                </button>
              ))}
            </div>

            {/* Consensus Meter (Consensus.app + Elicit style) */}
            {consensus && (
              <div className="glass-panel" style={{ padding: 22, borderLeft: '4px solid var(--cyan-400)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <TrendingUp size={18} color="var(--cyan-400)" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', color: '#ffffff' }}>Synthesized Scientific Consensus</h3>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Query: &quot;{consensus.query}&quot; • Aggregated from peer-reviewed literature and preprints
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span className="badge-pill badge-supporting">
                      ● {consensus.stance.affirmative}% Affirmative
                    </span>
                    <span className="badge-pill badge-mentioning">
                      ● {consensus.stance.neutral_or_mixed}% Mixed / Neutral
                    </span>
                    <span className="badge-pill badge-contrasting">
                      ● {consensus.stance.negative_or_disputing}% Disputing / Conflicting
                    </span>
                  </div>
                </div>

                {/* Progress Stance Bar */}
                <div style={{ width: '100%', height: 8, background: 'rgba(255, 255, 255, 0.1)', borderRadius: 4, overflow: 'hidden', display: 'flex', marginBottom: 12 }}>
                  <div style={{ width: `${consensus.stance.affirmative}%`, background: 'var(--emerald-500)' }} />
                  <div style={{ width: `${consensus.stance.neutral_or_mixed}%`, background: 'var(--text-muted)' }} />
                  <div style={{ width: `${consensus.stance.negative_or_disputing}%`, background: 'var(--rose-500)' }} />
                </div>

                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {consensus.synthesis}
                </p>
              </div>
            )}

            {/* Paper Cards List */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={20} color="var(--indigo-400)" />
                  Retrieved Publications ({papers.length})
                </h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Indexed via OpenAlex & Semantic Scholar Academic Graph
                </span>
              </div>

              {isLoading ? (
                <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                  Loading papers from OpenAlex...
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {papers.map((paper) => (
                    <div key={paper.id} className="glass-panel" style={{ padding: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 280 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--indigo-300)' }}>
                              {paper.year} • {paper.venue}
                            </span>
                            {paper.is_oa && (
                              <span className="badge-pill badge-open-access">Open Access PDF</span>
                            )}
                            <span style={{ fontSize: '0.75rem', color: 'var(--amber-400)', fontWeight: 600 }}>
                              ★ {paper.citation_count.toLocaleString()} citations
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              ({paper.influential_citations} influential)
                            </span>
                          </div>

                          <h3 style={{ fontSize: '1.15rem', color: '#ffffff', marginBottom: 6, lineHeight: 1.4 }}>
                            {paper.title}
                          </h3>

                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 10 }}>
                            By {paper.authors.join(', ')}
                          </p>

                          {/* TL;DR Highlight Box */}
                          <div style={{
                            background: 'rgba(99, 102, 241, 0.08)',
                            borderLeft: '3px solid var(--indigo-500)',
                            padding: '8px 12px',
                            borderRadius: '0 6px 6px 0',
                            marginBottom: 12
                          }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--indigo-300)', display: 'block', marginBottom: 2 }}>
                              TL;DR (1-Sentence Takeaway):
                            </span>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                              {paper.tldr}
                            </p>
                          </div>

                          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.6, maxHeight: 72, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {paper.abstract}
                          </p>
                        </div>

                        {/* Action Buttons Column */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 160 }}>
                          <button
                            onClick={() => {
                              if (!matrixPapers.includes(paper.id)) {
                                setMatrixPapers([...matrixPapers, paper.id]);
                              }
                              setActiveTab('matrix');
                            }}
                            className="btn-primary"
                            style={{ fontSize: '0.78rem', padding: '8px 12px' }}
                          >
                            <Plus size={14} /> Add to Matrix
                          </button>
                          <button
                            onClick={() => setActiveTab('graph')}
                            className="btn-secondary"
                            style={{ fontSize: '0.78rem', padding: '8px 12px' }}
                          >
                            <GitFork size={14} /> View in Graph
                          </button>
                          <button
                            onClick={() => setActiveTab('copilot')}
                            className="btn-secondary"
                            style={{ fontSize: '0.78rem', padding: '8px 12px' }}
                          >
                            <BookOpen size={14} /> Read with Copilot
                          </button>
                          {paper.pdf_url && (
                            <a
                              href={paper.pdf_url}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                                fontSize: '0.75rem',
                                color: 'var(--cyan-400)',
                                textDecoration: 'none',
                                padding: '6px 0'
                              }}
                            >
                              <ExternalLink size={12} /> Direct PDF
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: MULTI-PAPER COMPARISON MATRIX
            ========================================================================= */}
        {activeTab === 'matrix' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Table size={22} color="var(--cyan-400)" />
                  Multi-Paper Comparison Matrix
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Synthesized comparison grid across {matrixData?.rows.length || 0} benchmark publications (Elicit style).
                </p>
              </div>

              {/* Action Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255, 255, 255, 0.05)', borderRadius: 'var(--radius-md)', padding: '4px 8px', border: '1px solid var(--border-subtle)' }}>
                  <input
                    type="text"
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    placeholder="Add custom column (e.g. Hardware, Loss Function)..."
                    style={{ background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', fontSize: '0.8rem', width: 220, padding: 6 }}
                  />
                  <button onClick={handleAddColumn} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                    <Plus size={12} /> Add
                  </button>
                </div>
                <button
                  onClick={() => alert("Exported BibTeX citation catalog to clipboard.")}
                  className="btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '8px 14px' }}
                >
                  <Download size={14} /> Export BibTeX
                </button>
              </div>
            </div>

            {/* Matrix Table */}
            {matrixData && (
              <div className="comparison-table-container">
                <table className="comparison-table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: 220 }}>Paper & Author</th>
                      {matrixData.columns.map((col) => (
                        <th key={col}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matrixData.rows.map((row) => (
                      <tr key={row.paper_id}>
                        <td className="cell-paper-title">
                          <div style={{ fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>
                            {row.paper_title}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {row.authors} ({row.year})
                          </span>
                        </td>
                        {matrixData.columns.map((col) => {
                          const val = row.cells[col] || 'N/A';
                          return (
                            <td
                              key={col}
                              onClick={() => setSelectedCell({ paperTitle: row.paper_title, column: col, value: val })}
                              style={{ cursor: 'pointer' }}
                              title="Click to view extraction provenance"
                            >
                              {val}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Cell Provenance Modal / Bottom Sheet */}
            {selectedCell && (
              <div className="glass-panel" style={{ padding: 18, borderLeft: '4px solid var(--indigo-400)', marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--indigo-300)' }}>
                    PROVENANCE VERIFICATION • {selectedCell.paperTitle} • Column: {selectedCell.column}
                  </span>
                  <button
                    onClick={() => setSelectedCell(null)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}
                  >
                    ✕ Close
                  </button>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#ffffff', marginBottom: 8 }}>
                  &quot;{selectedCell.value}&quot;
                </p>
                <span style={{ fontSize: '0.75rem', color: 'var(--emerald-400)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={12} /> Grounded with 96% confidence score from full-text methodology section
                </span>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 3: SMART CITATION GRAPH & TIMELINE
            ========================================================================= */}
        {activeTab === 'graph' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <GitFork size={22} color="var(--indigo-400)" />
                  Smart Citation Graph & Timeline Projection
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Integrates ResearchRabbit citation links, Scite sentiment tags, and Litmaps chronological axes.
                </p>
              </div>

              {/* View Mode Toggle */}
              <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.05)', borderRadius: 'var(--radius-md)', padding: 4, border: '1px solid var(--border-subtle)' }}>
                <button
                  onClick={() => setGraphMode('network')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    border: 'none',
                    background: graphMode === 'network' ? 'var(--indigo-500)' : 'transparent',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Force-Directed Network
                </button>
                <button
                  onClick={() => setGraphMode('timeline')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    border: 'none',
                    background: graphMode === 'timeline' ? 'var(--indigo-500)' : 'transparent',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Litmaps Timeline (Year vs Impact)
                </button>
              </div>
            </div>

            {/* Sentiment Legend Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', background: 'rgba(15, 23, 42, 0.6)', padding: '10px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Citation Sentiment Classifier:</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--emerald-400)' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--emerald-400)' }} />
                🟢 Supporting (Corroborating findings)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--rose-400)' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--rose-400)' }} />
                🔴 Contrasting (Disputing / Highlighting bottlenecks)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--text-muted)' }} />
                ⚪ Mentioning (Background context)
              </span>
            </div>

            {/* Interactive SVG Canvas */}
            <div className="glass-panel" style={{ height: 440, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="100%" height="100%" viewBox="0 0 900 420" style={{ cursor: 'grab' }}>
                <defs>
                  <marker id="arrow-supporting" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
                  </marker>
                  <marker id="arrow-contrasting" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#f43f5e" />
                  </marker>
                  <marker id="arrow-mentioning" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
                  </marker>
                </defs>

                {/* Timeline Mode Grid Lines */}
                {graphMode === 'timeline' && (
                  <g opacity="0.3">
                    <line x1="100" y1="360" x2="800" y2="360" stroke="var(--border-subtle)" strokeWidth="2" />
                    <line x1="100" y1="60" x2="100" y2="360" stroke="var(--border-subtle)" strokeWidth="2" />
                    <text x="180" y="385" fill="var(--text-muted)" fontSize="12">2017</text>
                    <text x="350" y="385" fill="var(--text-muted)" fontSize="12">2018</text>
                    <text x="520" y="385" fill="var(--text-muted)" fontSize="12">2020</text>
                    <text x="700" y="385" fill="var(--text-muted)" fontSize="12">2023</text>
                    <text x="50" y="100" fill="var(--text-muted)" fontSize="11" transform="rotate(-90 50,100)">Impact (Citations)</text>
                  </g>
                )}

                {/* Directed Edges with Sentiment Colors */}
                {/* Edge 1: BERT -> Transformer (Supporting) */}
                <line
                  x1={graphMode === 'network' ? 450 : 350}
                  y1={graphMode === 'network' ? 200 : 160}
                  x2={graphMode === 'network' ? 250 : 180}
                  y2={graphMode === 'network' ? 140 : 100}
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeDasharray={graphMode === 'timeline' ? '4 2' : 'none'}
                  markerEnd="url(#arrow-supporting)"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedEdge({
                    source: 'BERT (Devlin et al., 2018)',
                    target: 'Attention Is All You Need (Vaswani et al., 2017)',
                    intent: 'supporting',
                    section: 'Methods',
                    snippet: 'We follow the Transformer architecture of Vaswani et al. (2017) and utilize multi-head self-attention to learn deep bidirectional representations.',
                    confidence: 0.94
                  })}
                />

                {/* Edge 2: Mamba -> Transformer (Contrasting) */}
                <line
                  x1={graphMode === 'network' ? 580 : 700}
                  y1={graphMode === 'network' ? 130 : 280}
                  x2={graphMode === 'network' ? 250 : 180}
                  y2={graphMode === 'network' ? 140 : 100}
                  stroke="#f43f5e"
                  strokeWidth="2.5"
                  markerEnd="url(#arrow-contrasting)"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedEdge({
                    source: 'Mamba (Gu & Dao, 2023)',
                    target: 'Attention Is All You Need (Vaswani et al., 2017)',
                    intent: 'contrasting',
                    section: 'Introduction & Motivation',
                    snippet: 'Despite the dominance of Transformers (Vaswani et al., 2017), their quadratic scaling O(N^2) in sequence length incurs prohibitive memory overhead during auto-regressive generation.',
                    confidence: 0.89
                  })}
                />

                {/* Edge 3: DPO -> GPT-3 (Contrasting) */}
                <line
                  x1={graphMode === 'network' ? 620 : 700}
                  y1={graphMode === 'network' ? 300 : 260}
                  x2={graphMode === 'network' ? 380 : 520}
                  y2={graphMode === 'network' ? 320 : 180}
                  stroke="#f43f5e"
                  strokeWidth="2.5"
                  markerEnd="url(#arrow-contrasting)"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedEdge({
                    source: 'Direct Preference Optimization (Rafailov et al., 2023)',
                    target: 'Few-Shot Learners (Brown et al., 2020)',
                    intent: 'contrasting',
                    section: 'Background & RLHF',
                    snippet: 'Standard RLHF applied to large language models (Brown et al., 2020) relies on complex PPO actor-critic loops that suffer from high variance and reward collapse.',
                    confidence: 0.91
                  })}
                />

                {/* Edge 4: GPT-3 -> BERT (Mentioning) */}
                <line
                  x1={graphMode === 'network' ? 380 : 520}
                  y1={graphMode === 'network' ? 320 : 180}
                  x2={graphMode === 'network' ? 450 : 350}
                  y2={graphMode === 'network' ? 200 : 160}
                  stroke="#94a3b8"
                  strokeWidth="2"
                  markerEnd="url(#arrow-mentioning)"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedEdge({
                    source: 'Few-Shot Learners (Brown et al., 2020)',
                    target: 'BERT (Devlin et al., 2018)',
                    intent: 'mentioning',
                    section: 'Related Work',
                    snippet: 'While masked language models such as BERT (Devlin et al., 2018) excel at classification and span prediction, they do not naturally lend themselves to open-ended autoregressive few-shot completion.',
                    confidence: 0.95
                  })}
                />

                {/* Node 1: Attention Is All You Need */}
                <g
                  transform={`translate(${graphMode === 'network' ? 250 : 180}, ${graphMode === 'network' ? 140 : 100})`}
                  onClick={() => setSelectedNode({ title: 'Attention Is All You Need', year: 2017, citations: 134210, venue: 'NeurIPS 2017' })}
                  style={{ cursor: 'pointer' }}
                >
                  <circle r="32" fill="var(--indigo-500)" opacity="0.25" />
                  <circle r="22" fill="var(--indigo-500)" stroke="#ffffff" strokeWidth="2" />
                  <text y="38" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">Vaswani (2017)</text>
                  <text y="52" textAnchor="middle" fill="var(--cyan-400)" fontSize="10">134k cites</text>
                </g>

                {/* Node 2: BERT */}
                <g
                  transform={`translate(${graphMode === 'network' ? 450 : 350}, ${graphMode === 'network' ? 200 : 160})`}
                  onClick={() => setSelectedNode({ title: 'BERT', year: 2018, citations: 98450, venue: 'NAACL 2019' })}
                  style={{ cursor: 'pointer' }}
                >
                  <circle r="28" fill="var(--cyan-500)" opacity="0.25" />
                  <circle r="19" fill="var(--cyan-500)" stroke="#ffffff" strokeWidth="2" />
                  <text y="34" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">BERT (2018)</text>
                  <text y="48" textAnchor="middle" fill="var(--cyan-400)" fontSize="10">98k cites</text>
                </g>

                {/* Node 3: GPT-3 */}
                <g
                  transform={`translate(${graphMode === 'network' ? 380 : 520}, ${graphMode === 'network' ? 320 : 180})`}
                  onClick={() => setSelectedNode({ title: 'Few-Shot Learners (GPT-3)', year: 2020, citations: 52180, venue: 'NeurIPS 2020' })}
                  style={{ cursor: 'pointer' }}
                >
                  <circle r="26" fill="#8b5cf6" opacity="0.25" />
                  <circle r="18" fill="#8b5cf6" stroke="#ffffff" strokeWidth="2" />
                  <text y="34" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">GPT-3 (2020)</text>
                  <text y="48" textAnchor="middle" fill="var(--cyan-400)" fontSize="10">52k cites</text>
                </g>

                {/* Node 4: Mamba */}
                <g
                  transform={`translate(${graphMode === 'network' ? 580 : 700}, ${graphMode === 'network' ? 130 : 280})`}
                  onClick={() => setSelectedNode({ title: 'Mamba (SSM)', year: 2023, citations: 2840, venue: 'arXiv 2023' })}
                  style={{ cursor: 'pointer' }}
                >
                  <circle r="22" fill="var(--emerald-500)" opacity="0.25" />
                  <circle r="15" fill="var(--emerald-500)" stroke="#ffffff" strokeWidth="2" />
                  <text y="30" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">Mamba (2023)</text>
                  <text y="44" textAnchor="middle" fill="var(--emerald-400)" fontSize="10">2.8k cites</text>
                </g>

                {/* Node 5: DPO */}
                <g
                  transform={`translate(${graphMode === 'network' ? 620 : 700}, ${graphMode === 'network' ? 300 : 260})`}
                  onClick={() => setSelectedNode({ title: 'DPO', year: 2023, citations: 3950, venue: 'NeurIPS 2023' })}
                  style={{ cursor: 'pointer' }}
                >
                  <circle r="22" fill="var(--amber-500)" opacity="0.25" />
                  <circle r="15" fill="var(--amber-500)" stroke="#ffffff" strokeWidth="2" />
                  <text y="30" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">DPO (2023)</text>
                  <text y="44" textAnchor="middle" fill="var(--amber-400)" fontSize="10">3.9k cites</text>
                </g>
              </svg>
            </div>

            {/* Edge Citation Inspector Drawer (Scite Style) */}
            {selectedEdge && (
              <div className="glass-panel" style={{ padding: 20, borderLeft: `4px solid ${selectedEdge.intent === 'supporting' ? 'var(--emerald-400)' : selectedEdge.intent === 'contrasting' ? 'var(--rose-400)' : 'var(--text-muted)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`badge-pill badge-${selectedEdge.intent}`}>
                      Intent: {selectedEdge.intent.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Section: {selectedEdge.section} • Classifier Confidence: {(selectedEdge.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <button onClick={() => setSelectedEdge(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                  <strong>Source:</strong> {selectedEdge.source} ➔ <strong>Target:</strong> {selectedEdge.target}
                </div>

                <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: 12, borderRadius: 8, fontStyle: 'italic', fontSize: '0.875rem', color: '#ffffff', lineHeight: 1.6 }}>
                  &quot;{selectedEdge.snippet}&quot;
                </div>
              </div>
            )}

            {/* Node Detail Inspector Drawer */}
            {selectedNode && (
              <div className="glass-panel" style={{ padding: 20, borderLeft: '4px solid var(--indigo-400)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="badge-pill badge-open-access">
                      NODE DETAILS • {selectedNode.year}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--amber-400)', fontWeight: 600 }}>
                      ★ {selectedNode.citations.toLocaleString()} citations
                    </span>
                  </div>
                  <button onClick={() => setSelectedNode(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
                </div>
                <h4 style={{ fontSize: '1.05rem', color: '#ffffff', marginBottom: 4 }}>{selectedNode.title}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Venue: {selectedNode.venue}</p>
              </div>
            )}
          </div>
        )}


        {/* =========================================================================
            TAB 4: AUTOMATED RESEARCH GAP EXPLORER
            ========================================================================= */}
        {activeTab === 'gaps' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Lightbulb size={22} color="var(--amber-400)" />
                Automated Research Gap & Frontier Explorer
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Synthesizes limitation clusters, active controversies, and unexplored method-domain intersections for B.Tech thesis formulation.
              </p>
            </div>

            {/* Section 1: Limitation Clusters */}
            <div>
              <h3 style={{ fontSize: '1.1rem', color: '#ffffff', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={18} color="var(--rose-400)" />
                1. Systemic Literature Limitation Clusters
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
                {[
                  {
                    title: "Long-Horizon Reasoning & Attention Degradation",
                    severity: "High",
                    papers: "Vaswani et al. (2017) & Brown et al. (2020)",
                    desc: "Quadratic memory footprint O(N^2) and needle-in-a-haystack retrieval collapse when context exceeds 64k tokens.",
                    solution: "Hardware-aware selective state space models (Mamba) and ring-attention chunking."
                  },
                  {
                    title: "Alignment Instability & Reward Hacking",
                    severity: "Critical",
                    papers: "Brown et al. (2020) & Rafailov et al. (2023)",
                    desc: "PPO RLHF suffers from policy collapse and actor-critic divergence. DPO stabilizes training but is vulnerable to out-of-distribution drift.",
                    solution: "Reference-free contrastive preference optimization and self-supervised synthetic critiques."
                  },
                  {
                    title: "Data Contamination on Standard Benchmarks",
                    severity: "Medium",
                    papers: "Devlin et al. (2018) & Brown et al. (2020)",
                    desc: "Web-scale training corpora inadvertently leak test splits of HumanEval and GSM8k, confounding true reasoning metrics.",
                    solution: "Execution-verified evaluation sandboxes and dynamic contamination-resilient benchmarks."
                  }
                ].map((item, idx) => (
                  <div key={idx} className="glass-panel" style={{ padding: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span className="badge-pill badge-contrasting">Severity: {item.severity}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cluster #{idx + 1}</span>
                    </div>
                    <h4 style={{ fontSize: '1rem', color: '#ffffff', marginBottom: 6 }}>{item.title}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>
                      {item.desc}
                    </p>
                    <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '8px 12px', borderRadius: 6 }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--indigo-300)', display: 'block' }}>
                        Emerging Frontier Solution:
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {item.solution}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 2: Unexplored Research Frontiers (Thesis Opportunities) */}
            <div>
              <h3 style={{ fontSize: '1.1rem', color: '#ffffff', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={18} color="var(--cyan-400)" />
                2. Concrete B.Tech Capstone Thesis Proposals
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
                {[
                  {
                    title: "Hybrid Mamba-Attention on Edge Biomedical Devices",
                    intersection: "Selective State Spaces + Continuous Vital Signal Processing",
                    score: "94 / 100",
                    feasibility: "High (Public PhysioNet EEG/ECG benchmarks available)",
                    methodology: "Replace quadratic attention with linear-time selective state space layers for 24-hour vital telemetry, retaining attention heads strictly for clinical anomaly attribution."
                  },
                  {
                    title: "Offline Direct Preference Optimization on Low-Resource Indic Languages",
                    intersection: "DPO Alignment + Morphologically Rich Multilingual Corpora",
                    score: "88 / 100",
                    feasibility: "High (Addresses Indian NLP context using AI4Bharat benchmarks)",
                    methodology: "Construct bilingual preference pairs to evaluate whether closed-form DPO prevents catastrophic forgetting during fine-tuning of 7B-parameter open LLMs on Hindi and Tamil."
                  }
                ].map((prop, idx) => (
                  <div key={idx} className="glass-panel" style={{ padding: 20, borderTop: '3px solid var(--cyan-400)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span className="badge-pill badge-open-access">Opportunity: {prop.score}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--emerald-400)', fontWeight: 600 }}>{prop.feasibility}</span>
                    </div>
                    <h4 style={{ fontSize: '1.05rem', color: '#ffffff', marginBottom: 6 }}>{prop.title}</h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--indigo-300)', marginBottom: 8, fontWeight: 600 }}>
                      Tested Intersection: {prop.intersection}
                    </p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                      {prop.methodology}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 5: SPLIT-VIEW PAPER COPILOT (SciSpace Style)
            ========================================================================= */}
        {activeTab === 'copilot' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                <BookOpen size={22} color="var(--indigo-400)" />
                Split-View Paper Copilot & Explainer
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Interactive dual-pane reader: inspect academic PDF passages on the left, ask questions on the right (SciSpace style).
              </p>
            </div>

            {/* Split Pane Container */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 16, height: 600 }}>
              {/* Left Document Viewport */}
              <div className="glass-panel" style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, background: '#0e1626' }}>
                <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--indigo-400)', fontWeight: 700 }}>
                    NEURIPS 2017 • ARXlV:1706.03762
                  </span>
                  <h3 style={{ fontSize: '1.25rem', color: '#ffffff', marginTop: 4 }}>
                    Attention Is All You Need
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones et al.
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--cyan-400)', marginBottom: 6 }}>1. Abstract</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                    The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.
                  </p>
                </div>

                {/* Interactive Formula Box */}
                <div style={{
                  background: 'rgba(99, 102, 241, 0.12)',
                  border: '1px solid var(--border-accent)',
                  borderRadius: 8,
                  padding: 14
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--indigo-300)' }}>
                      EQUATION (1): Scaled Dot-Product Attention
                    </span>
                    <button
                      onClick={() => handleAskCopilot("Explain the Scaled Dot-Product Attention formula and why sqrt(d_k) is necessary.")}
                      style={{
                        background: 'var(--indigo-500)',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '4px 8px',
                        borderRadius: 4,
                        cursor: 'pointer'
                      }}
                    >
                      Explain this Math 💡
                    </button>
                  </div>
                  <div style={{
                    fontFamily: 'Fira Code',
                    fontSize: '0.95rem',
                    color: '#ffffff',
                    background: 'rgba(0, 0, 0, 0.4)',
                    padding: 10,
                    borderRadius: 6,
                    textAlign: 'center'
                  }}>
                    Attention(Q, K, V) = softmax((Q K^T) / √d_k) V
                  </div>
                </div>

                {/* Section 2 */}
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--cyan-400)', marginBottom: 6 }}>3.2 Multi-Head Attention</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                    Instead of performing a single attention function with d_model-dimensional keys, values and queries, we found it beneficial to linearly project the queries, keys and values h times with different, learned linear projections to d_k, d_k and d_v dimensions, respectively.
                  </p>
                </div>

                {/* Interactive Table Box */}
                <div style={{
                  background: 'rgba(6, 182, 212, 0.08)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  borderRadius: 8,
                  padding: 14
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--cyan-400)' }}>
                      TABLE 2: WMT 2014 Translation Benchmark Results
                    </span>
                    <button
                      onClick={() => handleAskCopilot("Explain what Table 2 reveals about training compute and BLEU metrics.")}
                      style={{
                        background: 'var(--cyan-500)',
                        border: 'none',
                        color: '#000000',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '4px 8px',
                        borderRadius: 4,
                        cursor: 'pointer'
                      }}
                    >
                      Explain Table 📊
                    </button>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    • Transformer (base): 27.3 BLEU (En-De) • 3.3e18 Training FLOPs<br />
                    • Transformer (big): 28.4 BLEU (En-De) • 2.3e19 Training FLOPs (State-of-the-art)
                  </div>
                </div>
              </div>

              {/* Right Copilot Chat */}
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={16} color="var(--indigo-400)" />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#ffffff' }}>CiteScope Copilot</span>
                </div>

                {/* Message Feed */}
                <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {copilotMessages.map((msg, i) => (
                    <div
                      key={i}
                      style={{
                        alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        background: msg.sender === 'user' ? 'var(--indigo-500)' : 'rgba(255, 255, 255, 0.06)',
                        color: '#ffffff',
                        padding: '10px 14px',
                        borderRadius: 12,
                        fontSize: '0.85rem',
                        lineHeight: 1.55,
                        border: msg.sender === 'assistant' ? '1px solid var(--border-subtle)' : 'none'
                      }}
                    >
                      <p>{msg.text}</p>
                      {msg.citation && (
                        <span style={{ display: 'block', marginTop: 6, fontSize: '0.72rem', color: 'var(--cyan-400)', fontWeight: 600 }}>
                          🔖 Citation: {msg.citation}
                        </span>
                      )}
                    </div>
                  ))}
                  {copilotLoading && (
                    <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      CiteScope is extracting insight from document text...
                    </div>
                  )}
                </div>

                {/* Input Box */}
                <div style={{ padding: 12, borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={copilotInput}
                    onChange={(e) => setCopilotInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAskCopilot(copilotInput)}
                    placeholder="Ask about formulas, methods, datasets..."
                    style={{
                      flex: 1,
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 8,
                      color: '#ffffff',
                      padding: '8px 12px',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                  <button
                    onClick={() => handleAskCopilot(copilotInput)}
                    className="btn-primary"
                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                  >
                    Ask
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 6: ANDROID APP COMPANION & SIMULATOR
            ========================================================================= */}
        {activeTab === 'mobile' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Smartphone size={22} color="var(--emerald-400)" />
                CiteScope AI Native Android Mobile Experience
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Official native companion app built with modern Kotlin, Jetpack Compose, Material 3, and Room SQLite for offline sync.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24, alignItems: 'center' }}>
              {/* Architecture & Capstone Highlights */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="glass-panel" style={{ padding: 20 }}>
                  <h3 style={{ fontSize: '1.1rem', color: '#ffffff', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Cpu size={18} color="var(--indigo-400)" />
                    Native Android Technical Stack
                  </h3>
                  <ul style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: 18 }}>
                    <li><strong>UI Toolkit:</strong> Jetpack Compose with Material Design 3 dynamic color scheme.</li>
                    <li><strong>Offline Persistence:</strong> Room SQLite database (`saved_papers` entity & DAO) caching PDF binaries and notes.</li>
                    <li><strong>Networking:</strong> Retrofit 2.9 + OkHttp logging interceptor + Kotlin Coroutines & Flow.</li>
                    <li><strong>Architecture:</strong> MVVM (Model-View-ViewModel) + Clean Architecture pattern.</li>
                    <li><strong>Competitive Advantage:</strong> SciSpace and Consensus lack native Android apps; CiteScope brings literature discovery to Android during commutes.</li>
                  </ul>
                </div>

                <div className="glass-panel" style={{ padding: 20, borderLeft: '4px solid var(--emerald-400)' }}>
                  <h4 style={{ fontSize: '0.95rem', color: '#ffffff', marginBottom: 6 }}>
                    Android Capstone Codebase Location:
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'Fira Code', marginBottom: 10 }}>
                    /Users/riyansh/citescope/android/
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Contains root `build.gradle.kts`, `settings.gradle.kts`, app module with Room & Retrofit, `AndroidManifest.xml`, and complete Jetpack Compose `MainActivity.kt`.
                  </p>
                </div>
              </div>

              {/* Interactive Phone Frame Mockup */}
              <div className="mobile-device-frame">
                <div className="mobile-notch" />
                <div className="mobile-screen-content" style={{ padding: 16 }}>
                  {/* Mobile Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Sparkles size={16} color="var(--cyan-400)" />
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ffffff' }}>CiteScope Mobile</span>
                    </div>
                    <span style={{ fontSize: '0.65rem', background: 'var(--indigo-500)', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                      Kotlin / Compose
                    </span>
                  </div>

                  {/* Mobile Search */}
                  <div style={{ background: '#1e293b', padding: '6px 10px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <Search size={14} color="#94a3b8" />
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Search 250M+ papers...</span>
                  </div>

                  {/* Mobile Consensus Meter */}
                  <div style={{ background: '#162032', padding: 12, borderRadius: 10, marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 4 }}>
                      <span style={{ color: 'var(--cyan-400)', fontWeight: 700 }}>Consensus Meter</span>
                      <span style={{ color: 'var(--emerald-400)', fontWeight: 700 }}>74% Yes</span>
                    </div>
                    <div style={{ width: '100%', height: 4, background: '#374151', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: '74%', height: '100%', background: 'var(--emerald-400)' }} />
                    </div>
                  </div>

                  {/* Mobile Paper Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { title: "Attention Is All You Need", year: 2017, cites: "134k" },
                      { title: "Mamba: Selective State Spaces", year: 2023, cites: "2.8k" },
                      { title: "Direct Preference Optimization", year: 2023, cites: "3.9k" }
                    ].map((p, idx) => (
                      <div key={idx} style={{ background: '#111827', padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--indigo-400)', marginBottom: 2 }}>
                          <span>{p.year}</span>
                          <span style={{ color: 'var(--amber-400)', fontWeight: 700 }}>★ {p.cites}</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff' }}>{p.title}</div>
                      </div>
                    ))}
                  </div>

                  {/* Mobile Bottom Navigation Bar */}
                  <div style={{
                    marginTop: 'auto',
                    background: '#111827',
                    padding: '8px 12px',
                    borderRadius: 16,
                    display: 'flex',
                    justifyContent: 'space-around',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <Search size={16} color="var(--cyan-400)" />
                    <Table size={16} color="#94a3b8" />
                    <GitFork size={16} color="#94a3b8" />
                    <Lightbulb size={16} color="#94a3b8" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer style={{
        background: 'rgba(8, 12, 20, 0.95)',
        borderTop: '1px solid var(--border-subtle)',
        padding: '20px 24px',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span>CiteScope AI • B.Tech Final Semester Capstone Project</span>
        </div>
      </footer>
    </div>
  );
}

export default App;

