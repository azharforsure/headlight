import React, { useState, useRef } from 'react';
import { 
  Loader2, 
  RefreshCw, 
  X,
  Sparkles,
  Bot,
  HardDrive,
  Cloud
} from 'lucide-react';
import { useSeoCrawler } from '../../contexts/SeoCrawlerContext';
import { 
  CrawlerIntegrationProvider, 
  CrawlerIntegrationConnection,
  CsvUploadMeta,
  DEFAULT_GOOGLE_SCOPES
} from '../../services/CrawlerIntegrationsService';
import { openGoogleOAuthPopup, exchangeGoogleCode } from '../../services/GoogleOAuthHelper';
import { 
  parseBacklinkCsv, 
  parseKeywordCsv
} from '../../services/CsvUploadParser';
import { getAIRouter } from '../../services/ai';
import { StatusBadge } from './inspector/shared';
import { mcpClient, MCPServerConfig } from '../../services/MCPClientService';

function Toggle({ checked, onChange, small = false }: { checked: boolean; onChange: (val: boolean) => void; small?: boolean }) {
  return (
    <div 
      onClick={() => onChange(!checked)}
      className={`${small ? 'w-8 h-4.5' : 'w-10 h-6'} rounded-full p-1 transition-colors cursor-pointer ${checked ? 'bg-indigo-500' : 'bg-white/10'}`}
    >
      <div className={`${small ? 'w-2.5 h-2.5' : 'w-4 h-4'} bg-white rounded-full transition-transform ${checked ? (small ? 'translate-x-3.5' : 'translate-x-4') : ''}`}></div>
    </div>
  );
}

export function IntegrationsTab() {
  const { 
    integrationConnections, 
    saveIntegrationConnection, 
    removeIntegrationConnection,
    addLog,
    detectedGscSite,
    detectedGa4Property,
    config,
    setConfig
  } = useSeoCrawler();

  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [mcpServers, setMcpServers] = useState<MCPServerConfig[]>([]);
  const [newServerName, setNewServerName] = useState('');
  const [newServerUrl, setNewServerUrl] = useState('');

  React.useEffect(() => {
    if (config.projectId) {
      mcpClient.getProjectServers(config.projectId).then(setMcpServers);
    }
  }, [config.projectId]);

  const handleAddMcpServer = async () => {
    if (!newServerName || !newServerUrl || !config.projectId) return;
    
    // In a real app, this would be a Turso insert via an API
    const newServer: MCPServerConfig = {
      id: Math.random().toString(36).substring(7),
      project_id: config.projectId,
      name: newServerName,
      url: newServerUrl,
      auth_type: 'none',
      enabled: true
    };
    
    setMcpServers(prev => [...prev, newServer]);
    setNewServerName('');
    setNewServerUrl('');
    addLog(`Added MCP Server: ${newServerName}`, 'success');
  };

  const handleConnectGoogle = async () => {
    setLoadingProvider('google');
    try {
      const result = await openGoogleOAuthPopup();
      if (!result) return;

      // New metadata-only exchange: returns { email, expiryDate }
      const meta = await exchangeGoogleCode(result.code, result.redirectUri);
      if (!meta || !meta.email) {
        addLog('Failed to verify Google account metadata.', 'error');
        return;
      }

      const connection: CrawlerIntegrationConnection = {
        provider: 'google',
        label: 'Google Ads & Search',
        status: 'connected',
        authType: 'oauth',
        ownership: 'project',
        connectedAt: Date.now(),
        accountLabel: meta.email,
        scopes: DEFAULT_GOOGLE_SCOPES,
        // CRITICAL: We no longer store tokens here. 
        // They are safe in Turso (server-side).
        credentials: {}, 
        hasCredentials: true,
        metadata: {
          email: meta.email
        },
        sync: { 
          status: 'idle',
          expiryDate: meta.expiryDate 
        }
      };

      await saveIntegrationConnection('google', connection);
      addLog(`Connected: ${meta.email}`, 'success');
    } catch (error) {
      console.error('[Google Connect Error]', error);
      addLog('Google connection failed.', 'error');
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>, 
    provider: CrawlerIntegrationProvider
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingProvider(provider);
    try {
      const text = await file.text();
      let parsedData: any[] = [];
      let meta: CsvUploadMeta;

      if (provider === 'backlinkUpload') {
        const res = parseBacklinkCsv(text);
        parsedData = res.data;
        meta = res.meta;
      } else if (provider === 'keywordUpload') {
        const res = parseKeywordCsv(text);
        parsedData = res.data;
        meta = res.meta;
      } else {
        return;
      }

      meta.fileName = file.name;
      const connection: CrawlerIntegrationConnection = {
        provider,
        label: provider,
        status: 'configured',
        authType: 'upload',
        ownership: 'project',
        connectedAt: Date.now(),
        accountLabel: file.name,
        uploadMeta: meta,
        uploadData: parsedData,
        sync: { status: 'success', lastSyncedAt: Date.now() }
      };

      await saveIntegrationConnection(provider, connection);
      addLog(`Uploaded: ${file.name}`, 'success');
    } catch (error: any) {
      addLog(`Parse error: ${error.message}`, 'error');
    } finally {
      setLoadingProvider(null);
      e.target.value = '';
    }
  };

  const updateConfig = (key: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="space-y-6">
        {/* Google Card */}
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] p-5">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-xs font-semibold text-white/90">GOOGLE SEARCH & ANALYTICS</h4>
            <div className={`w-2 h-2 rounded-full ${integrationConnections.google ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-white/10'}`} />
          </div>
          <p className="text-[11px] text-white/40 mb-4">Unified connection for Search Console impressions and GA4 traffic data.</p>
          
          {integrationConnections.google ? (
            <div className="space-y-4">
              {(detectedGscSite || detectedGa4Property || integrationConnections.google?.selection?.siteUrl || integrationConnections.google?.selection?.propertyId) && (
                <div className="rounded-md border border-emerald-500/20 bg-emerald-500/[0.03] p-4 space-y-3 shadow-[0_2px_12px_rgba(16,185,129,0.1)]">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Connected Properties</div>
                  </div>
                  {(integrationConnections.google?.selection?.siteUrl || detectedGscSite) && (
                    <div className="flex items-center justify-between group">
                      <span className="text-[11px] text-white/40">Search Console Site</span>
                      <span className="text-[11px] font-mono text-emerald-400/90 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{integrationConnections.google?.selection?.siteUrl || detectedGscSite}</span>
                    </div>
                  )}
                  {(integrationConnections.google?.selection?.propertyId || detectedGa4Property) && (
                    <div className="flex items-center justify-between group">
                      <span className="text-[11px] text-white/40">Analytics Property ID</span>
                      <span className="text-[11px] font-mono text-emerald-400/90 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{integrationConnections.google?.selection?.propertyId || detectedGa4Property}</span>
                    </div>
                  )}
                </div>
              )}


              <div className="flex gap-2">
                <button 
                  onClick={handleConnectGoogle} 
                  className="px-3 py-1.5 text-[10px] rounded border border-white/10 bg-white/[0.03] text-white/60 hover:text-white flex items-center gap-2"
                >
                  <RefreshCw size={10} className={loadingProvider === 'google' ? 'animate-spin' : ''} /> Reconnect
                </button>
                <button 
                  onClick={() => removeIntegrationConnection('google')} 
                  className="px-3 py-1.5 text-[10px] rounded border border-red-500/10 bg-red-500/[0.02] text-red-400/40 hover:text-red-400"
                >
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <button onClick={handleConnectGoogle} className="px-4 py-2 text-[10px] font-bold rounded border border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white">
              Connect Google Account
            </button>
          )}
        </div>

        {/* GBP */}
        <div className="rounded-lg border border-white/[0.04] bg-white/[0.01] p-5">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-xs font-semibold text-white/90">GOOGLE BUSINESS PROFILE</h4>
          </div>
          <p className="text-[11px] text-white/40 mb-4">Local SEO performance signals and GBP insights.</p>
          {!integrationConnections.google ? (
            <span className="text-[10px] text-white/20 italic">Connect Google account first</span>
          ) : (
            <div className="flex items-center gap-2 text-emerald-400">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
               <span className="text-[10px] font-bold uppercase">Automated Sync Active</span>
            </div>
          )}
        </div>


        {/* Google Drive Card */}
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] p-5">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-xs font-semibold text-white/90 uppercase tracking-wider">Google Drive</h4>
            <div className={`w-2 h-2 rounded-full ${integrationConnections.google ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]' : 'bg-white/10'}`} />
          </div>
          <p className="text-[11px] text-white/40 mb-4">Unified connection for search data and automated cloud storage.</p>
          
          {integrationConnections.google ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleConnectGoogle} 
                  className="text-[10px] text-white/40 hover:text-white transition-colors"
                >
                  Use a different account
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 px-2 border border-dashed border-white/10 rounded-lg bg-white/[0.01]">
              <Cloud className="text-white/10 mb-2" size={24} />
              <p className="text-[10px] text-white/30 text-center mb-4 max-w-[200px]">Connect your Google account to enable automatic cloud backups.</p>
              <button onClick={handleConnectGoogle} className="px-4 py-2 text-[10px] font-bold rounded border border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white">
                Connect Google Drive
              </button>
            </div>
          )}
        </div>



        {/* Backlink Upload */}
        <FileUploadBox
          title="BACKLINK DATA"
          description="Ahrefs, Semrush, or custom CSV export for backlink counts."
          connection={integrationConnections.backlinkUpload}
          onUpload={(e) => handleFileUpload(e, 'backlinkUpload')}
          onRemove={() => removeIntegrationConnection('backlinkUpload')}
          loading={loadingProvider === 'backlinkUpload'}
        />

        {/* Keyword Upload */}
        <FileUploadBox
          title="KEYWORD DATA"
          description="Keyword research tool exports (Volume, Ranking, URL)."
          connection={integrationConnections.keywordUpload}
          onUpload={(e) => handleFileUpload(e, 'keywordUpload')}
          onRemove={() => removeIntegrationConnection('keywordUpload')}
          loading={loadingProvider === 'keywordUpload'}
        />

        {/* Bing Webmaster */}
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] p-5">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-xs font-semibold text-white/90">BING WEBMASTER TOOLS</h4>
            <div className={`w-2 h-2 rounded-full ${integrationConnections.bingWebmaster ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-white/10'}`} />
          </div>
          <p className="text-[11px] text-white/40 mb-4">Sync Bing search impressions and crawl errors using OAuth or API Key.</p>
          
          {integrationConnections.bingWebmaster ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded border border-emerald-500/10 bg-emerald-500/[0.02] px-3 py-2">
                <span className="text-[11px] text-white/70">{integrationConnections.bingWebmaster.accountLabel || 'Connected'}</span>
                <button 
                  onClick={() => removeIntegrationConnection('bingWebmaster')}
                  className="p-1 text-white/20 hover:text-red-400 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <button 
                onClick={() => {
                  // This would trigger the Bing OAuth flow on the server
                  window.location.href = '/api/auth/bing';
                }}
                className="w-full px-4 py-2 text-[10px] font-bold rounded border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20"
              >
                Connect Bing Account (OAuth)
              </button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                <div className="relative flex justify-center text-[9px] uppercase tracking-widest"><span className="bg-[#0a0a0a] px-2 text-white/20">or use API Key</span></div>
              </div>
              <div className="flex gap-2">
                <input 
                  type="password"
                  placeholder="Paste Bing API Key..."
                  className="flex-1 px-3 py-1.5 text-[11px] bg-white/[0.03] border border-white/10 rounded focus:border-white/20 focus:outline-none text-white/80 placeholder:text-white/10"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value;
                      if (val) {
                        saveIntegrationConnection('bingWebmaster', {
                          provider: 'bingWebmaster',
                          status: 'connected',
                          authType: 'apiKey',
                          credentials: { api_key: val },
                          connectedAt: Date.now(),
                          accountLabel: 'Bing API Key'
                        } as any);
                      }
                    }
                  }}
                />
                <button 
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    if (input.value) {
                      saveIntegrationConnection('bingWebmaster', {
                        provider: 'bingWebmaster',
                        status: 'connected',
                        authType: 'apiKey',
                        credentials: { api_key: input.value },
                        connectedAt: Date.now(),
                        accountLabel: 'Bing API Key'
                      } as any);
                    }
                  }}
                  className="px-3 py-1.5 text-[10px] font-bold rounded border border-white/10 bg-white/[0.04] text-white/70 hover:text-white"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>

        {/* MCP Servers */}
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] p-5">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-xs font-semibold text-white/90 uppercase tracking-wider">Model Context Protocol (MCP)</h4>
            <div className={`w-2 h-2 rounded-full ${mcpServers.length > 0 ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]' : 'bg-white/10'}`} />
          </div>
          <p className="text-[11px] text-white/40 mb-4">Connect to external AI tool providers (Linear, Amplitude, Slack).</p>
          
          <div className="space-y-3">
            {mcpServers.map(server => (
              <div key={server.id} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-lg group">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-white/80">{server.name}</span>
                  <span className="text-[9px] text-white/30 font-mono">{server.url}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[9px] font-bold border border-indigo-500/20">Connected</span>
                  <button className="p-1 text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                    <X size={12} />
                  </button>
                </div>
              </div>
            ))}

            <div className="pt-2 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="text" 
                  placeholder="Server Name (e.g. Linear)" 
                  value={newServerName}
                  onChange={(e) => setNewServerName(e.target.value)}
                  className="px-3 py-2 text-[11px] bg-white/[0.03] border border-white/10 rounded focus:border-indigo-500/50 outline-none text-white"
                />
                <input 
                  type="text" 
                  placeholder="https://mcp.example.com" 
                  value={newServerUrl}
                  onChange={(e) => setNewServerUrl(e.target.value)}
                  className="px-3 py-2 text-[11px] bg-white/[0.03] border border-white/10 rounded focus:border-indigo-500/50 outline-none text-white"
                />
              </div>
              <button 
                onClick={handleAddMcpServer}
                disabled={!newServerName || !newServerUrl}
                className="w-full px-4 py-2 text-[10px] font-bold rounded border border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
              >
                + Add MCP Server
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FileUploadBox({ title, description, connection, onUpload, onRemove, loading }: any) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] p-5">
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-xs font-semibold text-white/90">{title}</h4>
        <div className={`w-2 h-2 rounded-full ${connection ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-white/10'}`} />
      </div>
      <p className="text-[11px] text-white/40 mb-4">{description}</p>
      
      {connection ? (
        <div className="flex items-center justify-between rounded border border-emerald-500/10 bg-emerald-500/[0.02] px-3 py-2">
          <div className="flex flex-col">
            <span className="text-[11px] text-white/70 truncate max-w-[200px]">{connection.accountLabel}</span>
            <span className="text-[9px] text-white/20 font-bold uppercase">{connection.uploadMeta?.rowCount || 0} rows parsed</span>
          </div>
          <button onClick={onRemove} className="p-1 text-white/20 hover:text-red-400 transition-colors"><X size={12} /></button>
        </div>
      ) : (
        <div>
          <button onClick={() => inputRef.current?.click()} className="px-4 py-2 text-[10px] font-bold rounded border border-white/10 bg-white/[0.04] text-white/70 hover:text-white flex items-center gap-2">
            {loading ? <Loader2 size={10} className="animate-spin" /> : null}
            Upload CSV
          </button>
          <input type="file" ref={inputRef} accept=".csv" className="hidden" onChange={onUpload} />
        </div>
      )}
    </div>
  );
}
