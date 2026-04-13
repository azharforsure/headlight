import { useState, useRef, useEffect } from 'react';
import { Globe, Sparkles, X, Loader2, Plus, Search } from 'lucide-react';
import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext';
import { discoverFromLinkNeighborhood } from '../../../../services/CompetitorDiscoveryService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddCompetitorModal({ isOpen, onClose }: Props) {
  const { addCompetitorAndCrawl, pages, crawlingCompetitorDomain, ownProfile } = useSeoCrawler();
  const [urlInput, setUrlInput] = useState('');
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkUrls, setBulkUrls] = useState('');
  const [discovering, setDiscovering] = useState(false);
  const [discovered, setDiscovered] = useState<Array<{ domain: string; source: string; confidence: string }>>([]);
  const [selectedDiscovered, setSelectedDiscovered] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  if (!isOpen) return null;

  const normalizeDomain = (raw: string): string => {
    let url = raw.trim();
    if (!url) return '';
    if (!url.startsWith('http')) url = `https://${url}`;
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return raw.trim();
    }
  };

  const handleAddSingle = async () => {
    const domain = normalizeDomain(urlInput);
    if (!domain) return;
    setUrlInput('');
    await addCompetitorAndCrawl(domain);
    onClose();
  };

  const handleAddBulk = async () => {
    const domains = bulkUrls
      .split(/[\n,]+/)
      .map(normalizeDomain)
      .filter(Boolean);
    for (const domain of domains) {
      await addCompetitorAndCrawl(domain);
    }
    setBulkUrls('');
    setBulkMode(false);
    onClose();
  };

  const handleAutoDiscover = async () => {
    if (!pages || pages.length === 0 || !ownProfile) return;
    setDiscovering(true);
    try {
      const fromLinks = discoverFromLinkNeighborhood(pages, ownProfile.domain);
      setDiscovered(fromLinks.slice(0, 10));
    } catch (err) {
      console.error('Auto-discover failed:', err);
    } finally {
      setDiscovering(false);
    }
  };

  const handleAddSelected = async () => {
    for (const domain of selectedDiscovered) {
      await addCompetitorAndCrawl(domain);
    }
    setSelectedDiscovered(new Set());
    setDiscovered([]);
    onClose();
  };

  const toggleDiscoveredSelection = (domain: string) => {
    setSelectedDiscovered(prev => {
      const next = new Set(prev);
      next.has(domain) ? next.delete(domain) : next.add(domain);
      return next;
    });
  };

  const isCrawling = !!crawlingCompetitorDomain;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
      <div className="w-full max-w-lg rounded-2xl border border-[#242428] bg-[#0d0d0f] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1e1e22] px-5 py-4">
          <h2 className="text-[15px] font-bold text-white">Add Competitor</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-[#222] text-[#666] hover:text-white transition">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Single URL input */}
          {!bulkMode && (
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 rounded-xl border border-[#2c2c31] bg-[#09090b] px-3 py-2.5">
                <Globe size={14} className="text-[#555]" />
                <input
                  ref={inputRef}
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddSingle()}
                  placeholder="competitor.com"
                  className="flex-1 bg-transparent text-[13px] text-white placeholder:text-[#555] focus:outline-none"
                  disabled={isCrawling}
                />
              </div>
              <button
                onClick={handleAddSingle}
                disabled={!urlInput.trim() || isCrawling}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-[#ff5b70] to-[#d62839] px-4 text-[12px] font-bold text-white shadow-lg disabled:opacity-40 transition hover:-translate-y-[1px]"
              >
                {isCrawling ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                {isCrawling ? 'Crawling...' : 'Add & Crawl'}
              </button>
            </div>
          )}

          {/* Bulk mode */}
          {bulkMode && (
            <div className="space-y-2">
              <textarea
                value={bulkUrls}
                onChange={e => setBulkUrls(e.target.value)}
                placeholder="competitor-a.com&#10;competitor-b.com&#10;competitor-c.com"
                rows={5}
                className="w-full rounded-xl border border-[#2c2c31] bg-[#09090b] px-3 py-2.5 text-[13px] text-white placeholder:text-[#555] focus:outline-none focus:border-[#F5364E] resize-none"
              />
              <button
                onClick={handleAddBulk}
                disabled={!bulkUrls.trim() || isCrawling}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-[#ff5b70] to-[#d62839] py-2.5 text-[12px] font-bold text-white disabled:opacity-40"
              >
                {isCrawling ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                Add All & Crawl
              </button>
            </div>
          )}

          {/* Toggle bulk */}
          <button
            onClick={() => setBulkMode(!bulkMode)}
            className="text-[11px] text-[#666] hover:text-[#F5364E] transition"
          >
            {bulkMode ? '← Single URL' : 'Add multiple competitors at once →'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#1e1e22]" />
            <span className="text-[10px] text-[#555] uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-[#1e1e22]" />
          </div>

          {/* Auto-discover */}
          <button
            onClick={handleAutoDiscover}
            disabled={discovering || !pages?.length}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#2c2c31] bg-[#09090b] py-3 text-[12px] font-medium text-[#aaa] hover:text-white hover:border-[#F5364E]/40 transition disabled:opacity-40"
          >
            {discovering ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            {discovering ? 'Analyzing your link neighborhood...' : 'Auto-Discover from Crawl Data'}
          </button>

          {/* Discovered list */}
          {discovered.length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-[#888] uppercase tracking-wider">
                Discovered Competitors
              </div>
              <div className="max-h-[200px] overflow-y-auto space-y-1">
                {discovered.map(comp => (
                  <label
                    key={comp.domain}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer transition ${
                      selectedDiscovered.has(comp.domain)
                        ? 'bg-[#F5364E]/10 border border-[#F5364E]/30'
                        : 'bg-[#111] border border-transparent hover:border-[#333]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDiscovered.has(comp.domain)}
                      onChange={() => toggleDiscoveredSelection(comp.domain)}
                      className="accent-[#F5364E]"
                    />
                    <div className="flex-1">
                      <div className="text-[12px] text-white">{comp.domain}</div>
                      <div className="text-[10px] text-[#666]">
                        via {comp.source} • {comp.confidence} confidence
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <button
                onClick={handleAddSelected}
                disabled={selectedDiscovered.size === 0 || isCrawling}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#F5364E]/20 border border-[#F5364E]/30 py-2 text-[12px] font-bold text-[#F5364E] disabled:opacity-40 transition hover:bg-[#F5364E]/30"
              >
                <Plus size={13} />
                Add {selectedDiscovered.size} Selected
              </button>
            </div>
          )}
        </div>

        {/* Crawling indicator */}
        {isCrawling && (
          <div className="border-t border-[#1e1e22] px-5 py-3 flex items-center gap-2">
            <Loader2 size={12} className="animate-spin text-[#F5364E]" />
            <span className="text-[11px] text-[#888]">
              Micro-crawling <span className="text-white font-medium">{crawlingCompetitorDomain}</span>...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
