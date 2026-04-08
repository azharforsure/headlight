import React, { useState, useRef } from 'react';
import { 
  Loader2, 
  RefreshCw, 
  X
} from 'lucide-react';
import { useSeoCrawler } from '../../contexts/SeoCrawlerContext';
import { 
  CrawlerIntegrationProvider, 
  CrawlerIntegrationConnection,
  CsvUploadMeta
} from '../../services/CrawlerIntegrationsService';
import { openGoogleOAuthPopup, exchangeGoogleCode } from '../../services/GoogleOAuthHelper';
import { 
  parseBacklinkCsv, 
  parseKeywordCsv
} from '../../services/CsvUploadParser';

export function IntegrationsTab() {
  const { 
    integrationConnections, 
    saveIntegrationConnection, 
    removeIntegrationConnection,
    addLog,
    detectedGscSite,
    detectedGa4Property,
    pages,
    isCrawling,
    runFullEnrichment
  } = useSeoCrawler();

  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

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
        scopes: ['webmasters.readonly', 'analytics.readonly', 'userinfo.email'],
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

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-in fade-in duration-300">
      <div className="pb-4 border-b border-white/[0.06]">
        <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em]">Integrations</h3>
        <p className="mt-1 text-[11px] text-white/30">
          Connect external data sources to enhance audit depth.
        </p>
      </div>

      <div className="space-y-3">
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
          <p className="text-[11px] text-white/40 mb-4">Sync Bing search impressions and click data using your API Key.</p>
          
          {integrationConnections.bingWebmaster ? (
            <div className="flex items-center justify-between rounded border border-emerald-500/10 bg-emerald-500/[0.02] px-3 py-2">
              <span className="text-[11px] text-white/70">API Key Configured</span>
              <button 
                onClick={() => removeIntegrationConnection('bingWebmaster')}
                className="p-1 text-white/20 hover:text-red-400 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
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
                        accountLabel: 'Bing Webmaster Tools'
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
                      accountLabel: 'Bing Webmaster Tools'
                    } as any);
                  }
                }}
                className="px-3 py-1.5 text-[10px] font-bold rounded border border-white/10 bg-white/[0.04] text-white/70 hover:text-white"
              >
                Save
              </button>
            </div>
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
            <button className="px-4 py-2 text-[10px] font-bold rounded border border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.1] hover:text-white">
              Enable GBP Sync
            </button>
          )}
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
