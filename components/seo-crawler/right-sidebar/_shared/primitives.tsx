import React from 'react'

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-md border border-[#1a1a1a] bg-[#0d0d0d] ${className}`}>
      {children}
    </div>
  )
}

export function Section({
  title, action, dense = false, children,
}: { title?: React.ReactNode; action?: React.ReactNode; dense?: boolean; children: React.ReactNode }) {
  return (
    <div className={dense ? 'p-2.5' : 'p-3'}>
      {(title || action) && (
        <div className="mb-2 flex items-center justify-between">
          {title && (
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#666]">
              {title}
            </span>
          )}
          {action}
        </div>
      )}
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

export function RowDivider() {
  return <div className="my-1 h-px bg-[#1a1a1a]" />
}
