import React from 'react';
import { Card, Section, Sparkline as NewSparkline } from '../_shared';

/**
 * Legacy RsPanel shim for charts and inspector tabs.
 * Wraps content in a Card and adds a title via Section.
 */
export function RsPanel({ title, children, className = '' }: { title?: string; children: React.ReactNode; className?: string }) {
    if (!title) return React.createElement(Card, { className }, children);
    return React.createElement(Card, { className },
        React.createElement(Section, { title, dense: true }, children)
    );
}

// Re-export Sparkline from the new shared location
export const Sparkline = NewSparkline;
