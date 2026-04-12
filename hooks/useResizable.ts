import { useState, useCallback, useRef, useEffect } from 'react';

interface UseResizableOptions {
    /** Initial size in pixels */
    initial: number;
    /** Minimum allowed size */
    min: number;
    /** Maximum allowed size */
    max: number;
    /** Resize axis — 'horizontal' tracks clientX, 'vertical' tracks clientY (inverted from bottom) */
    axis: 'horizontal' | 'vertical';
}

/**
 * L2 fix: Extracted from the monolithic drag-resize pattern in SeoCrawlerContext.
 * 
 * Returns a controlled size value + a startDrag handler to attach to resize handles.
 * Manages mousemove/mouseup listeners and body cursor/selection automatically.
 */
export function useResizable({ initial, min, max, axis }: UseResizableOptions) {
    const [size, setSize] = useState(initial);
    const [isDragging, setIsDragging] = useState(false);
    const isDraggingRef = useRef(false);

    const startDrag = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        isDraggingRef.current = true;
    }, []);

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (event: MouseEvent) => {
            let nextSize: number;
            if (axis === 'horizontal') {
                nextSize = event.clientX;
            } else {
                nextSize = window.innerHeight - event.clientY;
            }
            setSize(Math.min(max, Math.max(min, nextSize)));
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            isDraggingRef.current = false;
        };

        document.body.style.cursor = axis === 'horizontal' ? 'ew-resize' : 'ns-resize';
        document.body.style.userSelect = 'none';

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, axis, min, max]);

    return { size, setSize, isDragging, startDrag } as const;
}

/**
 * Variant for right-anchored panels (e.g., audit sidebar).
 * Computes size from window width minus cursor position.
 */
export function useResizableFromRight({ initial, min, max }: Omit<UseResizableOptions, 'axis'>) {
    const [size, setSize] = useState(initial);
    const [isDragging, setIsDragging] = useState(false);

    const startDrag = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (event: MouseEvent) => {
            const nextSize = window.innerWidth - event.clientX;
            setSize(Math.min(max, Math.max(min, nextSize)));
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, min, max]);

    return { size, setSize, isDragging, startDrag } as const;
}
