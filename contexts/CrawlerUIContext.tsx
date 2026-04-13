import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CrawlerUIContextType {
    focusedIssueCategory: string | null;
    setFocusedIssueCategory: (category: string | null) => void;
}

const CrawlerUIContext = createContext<CrawlerUIContextType | undefined>(undefined);

export function CrawlerUIProvider({ children }: { children: ReactNode }) {
    const [focusedIssueCategory, setFocusedIssueCategory] = useState<string | null>(null);

    return (
        <CrawlerUIContext.Provider value={{ focusedIssueCategory, setFocusedIssueCategory }}>
            {children}
        </CrawlerUIContext.Provider>
    );
}

export function useCrawlerUI() {
    const context = useContext(CrawlerUIContext);
    if (context === undefined) {
        throw new Error('useCrawlerUI must be used within a CrawlerUIProvider');
    }
    return context;
}
