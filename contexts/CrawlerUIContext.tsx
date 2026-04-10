import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { SettingsTabId } from '../services/CrawlerConfigTypes';

// ─── Types ──────────────────────────────────────────────────

export type InspectorTab =
  | 'general'
  | 'seo'
  | 'content'
  | 'links'
  | 'schema'
  | 'performance'
  | 'images'
  | 'social'
  | 'gsc'
  | 'ga4'
  | 'ai'
  | 'details'
  | 'headers'
  | 'serp'
  | 'source';

export type AuditTabId =
  | 'overview' | 'issues' | 'opportunities' | 'geo'
  | 'tasks' | 'comments' | 'ai' | 'monitor'
  | 'migration' | 'history' | 'logs' | 'robots'
  | 'sitemap' | 'visual';

export type ViewMode = 'grid' | 'map' | 'charts';

export interface CrawlerUIContextType {
  // ── Panel visibility ──
  showSettings: boolean;
  setShowSettings: (s: boolean) => void;
  showColumnPicker: boolean;
  setShowColumnPicker: (s: boolean) => void;
  showAuditSidebar: boolean;
  setShowAuditSidebar: (s: boolean) => void;
  showAiInsights: boolean;
  setShowAiInsights: (s: boolean) => void;
  showAiChat: boolean;
  setShowAiChat: (s: boolean) => void;
  showAutoFixModal: boolean;
  setShowAutoFixModal: (s: boolean) => void;
  showExportDialog: boolean;
  setShowExportDialog: (s: boolean) => void;
  showComparisonView: boolean;
  setShowComparisonView: (s: boolean) => void;
  showListModal: boolean;
  setShowListModal: (s: boolean) => void;
  showScheduleModal: boolean;
  setShowScheduleModal: (s: boolean) => void;
  showTrialLimitAlert: boolean;
  setShowTrialLimitAlert: (s: boolean) => void;
  showCollabOverlay: boolean;
  setShowCollabOverlay: (s: boolean) => void;

  // ── Active tab/section ──
  activeTab: InspectorTab;
  setActiveTab: (t: InspectorTab) => void;
  activeAuditTab: AuditTabId;
  setActiveAuditTab: (t: AuditTabId) => void;
  settingsTab: SettingsTabId;
  setSettingsTab: (t: SettingsTabId) => void;

  // ── Layout dimensions & drag ──
  inspectorCollapsed: boolean;
  setInspectorCollapsed: (c: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (c: boolean) => void;
  leftSidebarWidth: number;
  setLeftSidebarWidth: (w: number) => void;
  auditSidebarWidth: number;
  setAuditSidebarWidth: (w: number) => void;
  detailsHeight: number;
  setDetailsHeight: (h: number) => void;
  gridScrollTop: number;
  setGridScrollTop: (t: number) => void;
  gridScrollOffset: number;
  setGridScrollOffset: (o: number) => void;
  isDraggingLeftSidebar: boolean;
  setIsDraggingLeftSidebar: (d: boolean) => void;
  isDraggingSidebar: boolean;
  setIsDraggingSidebar: (d: boolean) => void;
  isDraggingDetails: boolean;
  setIsDraggingDetails: (d: boolean) => void;
  ROW_HEIGHT: number;
  VISIBLE_BUFFER: number;

  // ── View mode ──
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;

  // ── Graph refs ──
  graphDimensions: { width: number; height: number };
  setGraphDimensions: (d: { width: number; height: number }) => void;
  graphContainerRef: React.RefObject<HTMLDivElement>;
  fgRef: React.RefObject<any>;

  // ── Selection ──
  selectedPage: any | null;
  setSelectedPage: (p: any | null) => void;
  selectedRows: Set<string>;
  setSelectedRows: (s: Set<string>) => void;

  // ── Sidebar search/filter UI ──
  categorySearch: string;
  setCategorySearch: (s: string) => void;
  logSearch: string;
  setLogSearch: (s: string) => void;
  logTypeFilter: 'all' | 'info' | 'warn' | 'error' | 'success';
  setLogTypeFilter: (f: 'all' | 'info' | 'warn' | 'error' | 'success') => void;
  leftSidebarPreset: string | null;
  setLeftSidebarPreset: (p: string | null) => void;

  // ── Auto-fix modal state ──
  autoFixItems: any[];
  setAutoFixItems: (items: any[]) => void;
  isFixing: boolean;
  setIsFixing: (f: boolean) => void;
  autoFixProgress: any;
  setAutoFixProgress: (p: any) => void;

  // ── Collab overlay targets ──
  collabOverlayTarget: any;
  setCollabOverlayTarget: (t: any) => void;
  activeCommentTarget: any;
  setActiveCommentTarget: (t: any) => void;

  // ── Theme ──
  theme: string;
  setTheme: (t: string) => void;

  // ── Bulk reset (called by clearCrawlerWorkspace) ──
  resetUIState: () => void;
}

// ─── Defaults ───────────────────────────────────────────────

const ROW_HEIGHT = 32;
const VISIBLE_BUFFER = 20;

// ─── Context ────────────────────────────────────────────────

const CrawlerUIContext = createContext<CrawlerUIContextType | undefined>(undefined);

// ─── Provider ───────────────────────────────────────────────

export function CrawlerUIProvider({ children }: { children: ReactNode }) {
  // Panel visibility
  const [showSettings, setShowSettings] = useState(false);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [showAuditSidebar, setShowAuditSidebar] = useState(false);
  const [showAiInsights, setShowAiInsights] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);
  const [showAutoFixModal, setShowAutoFixModal] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showComparisonView, setShowComparisonView] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showTrialLimitAlert, setShowTrialLimitAlert] = useState(false);
  const [showCollabOverlay, setShowCollabOverlay] = useState(false);

  // Active tabs
  const [activeTab, setActiveTab] = useState<InspectorTab>('general');
  const [activeAuditTab, setActiveAuditTab] = useState<AuditTabId>('overview');
  const [settingsTab, setSettingsTab] = useState<SettingsTabId>('general');

  // Layout dimensions & drag
  const [inspectorCollapsed, setInspectorCollapsed] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(260);
  const [auditSidebarWidth, setAuditSidebarWidth] = useState(380);
  const [detailsHeight, setDetailsHeight] = useState(300);
  const [gridScrollTop, setGridScrollTop] = useState(0);
  const [gridScrollOffset, setGridScrollOffset] = useState(0);
  const [isDraggingLeftSidebar, setIsDraggingLeftSidebar] = useState(false);
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [isDraggingDetails, setIsDraggingDetails] = useState(false);

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Graph refs
  const [graphDimensions, setGraphDimensions] = useState({ width: 800, height: 600 });
  const graphContainerRef = useRef<HTMLDivElement>(null!);
  const fgRef = useRef<any>(null);

  // Selection
  const [selectedPage, setSelectedPage] = useState<any | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Sidebar search/filter
  const [categorySearch, setCategorySearch] = useState('');
  const [logSearch, setLogSearch] = useState('');
  const [logTypeFilter, setLogTypeFilter] = useState<'all' | 'info' | 'warn' | 'error' | 'success'>('all');
  const [leftSidebarPreset, setLeftSidebarPreset] = useState<string | null>(null);

  // Auto-fix modal
  const [autoFixItems, setAutoFixItems] = useState<any[]>([]);
  const [isFixing, setIsFixing] = useState(false);
  const [autoFixProgress, setAutoFixProgress] = useState<any>(null);

  // Collab overlay
  const [collabOverlayTarget, setCollabOverlayTarget] = useState<any>(null);
  const [activeCommentTarget, setActiveCommentTarget] = useState<any>(null);

  // Theme
  const [theme, setTheme] = useState('dark');

  // ── Bulk reset ──
  // Called by SeoCrawlerContext.clearCrawlerWorkspace() to reset
  // all UI state when the user clears/resets the workspace.
  const resetUIState = useCallback(() => {
    setSelectedPage(null);
    setSelectedRows(new Set());
    setShowComparisonView(false);
    setShowExportDialog(false);
    setShowAutoFixModal(false);
    setShowSettings(false);
    setShowColumnPicker(false);
    setShowListModal(false);
    setShowScheduleModal(false);
    setShowAiInsights(false);
    setShowAiChat(false);
    setShowCollabOverlay(false);
    setShowTrialLimitAlert(false);
    setActiveTab('general');
    setActiveAuditTab('overview');
    setSettingsTab('general');
    setInspectorCollapsed(false);
    setLeftSidebarPreset(null);
    setCategorySearch('');
    setLogSearch('');
    setLogTypeFilter('all');
    setGridScrollTop(0);
    setGridScrollOffset(0);
    setAutoFixItems([]);
    setIsFixing(false);
    setAutoFixProgress(null);
    setCollabOverlayTarget(null);
    setActiveCommentTarget(null);
  }, []);

  const value: CrawlerUIContextType = {
    showSettings, setShowSettings,
    showColumnPicker, setShowColumnPicker,
    showAuditSidebar, setShowAuditSidebar,
    showAiInsights, setShowAiInsights,
    showAiChat, setShowAiChat,
    showAutoFixModal, setShowAutoFixModal,
    showExportDialog, setShowExportDialog,
    showComparisonView, setShowComparisonView,
    showListModal, setShowListModal,
    showScheduleModal, setShowScheduleModal,
    showTrialLimitAlert, setShowTrialLimitAlert,
    showCollabOverlay, setShowCollabOverlay,
    activeTab, setActiveTab,
    activeAuditTab, setActiveAuditTab,
    settingsTab, setSettingsTab,
    inspectorCollapsed, setInspectorCollapsed,
    sidebarCollapsed, setSidebarCollapsed,
    leftSidebarWidth, setLeftSidebarWidth,
    auditSidebarWidth, setAuditSidebarWidth,
    detailsHeight, setDetailsHeight,
    gridScrollTop, setGridScrollTop,
    gridScrollOffset, setGridScrollOffset,
    isDraggingLeftSidebar, setIsDraggingLeftSidebar,
    isDraggingSidebar, setIsDraggingSidebar,
    isDraggingDetails, setIsDraggingDetails,
    ROW_HEIGHT, VISIBLE_BUFFER,
    viewMode, setViewMode,
    graphDimensions, setGraphDimensions,
    graphContainerRef, fgRef,
    selectedPage, setSelectedPage,
    selectedRows, setSelectedRows,
    categorySearch, setCategorySearch,
    logSearch, setLogSearch,
    logTypeFilter, setLogTypeFilter,
    leftSidebarPreset, setLeftSidebarPreset,
    autoFixItems, setAutoFixItems,
    isFixing, setIsFixing,
    autoFixProgress, setAutoFixProgress,
    collabOverlayTarget, setCollabOverlayTarget,
    activeCommentTarget, setActiveCommentTarget,
    theme, setTheme,
    resetUIState,
  };

  return (
    <CrawlerUIContext.Provider value={value}>
      {children}
    </CrawlerUIContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────

export function useCrawlerUI() {
  const context = useContext(CrawlerUIContext);
  if (context === undefined) {
    throw new Error('useCrawlerUI must be used within a CrawlerUIProvider');
  }
  return context;
}
