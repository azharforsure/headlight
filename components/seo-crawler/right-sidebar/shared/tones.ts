import type { RsAccent } from '../../../../services/right-sidebar/types'

export const ACCENT_HEX: Record<RsAccent, string> = {
	slate:   '#94a3b8',
	violet:  '#a78bfa',
	blue:    '#60a5fa',
	amber:   '#fbbf24',
	teal:    '#2dd4bf',
	rose:    '#fb7185',
	cyan:    '#22d3ee',
	green:   '#34d399',
	indigo:  '#818cf8',
	fuchsia: '#e879f9',
	red:     '#f87171',
	orange:  '#fb923c',
}

export type Tone = 'good' | 'warn' | 'bad' | 'info' | 'neutral' | 'accent' | RsAccent

export const toneClass = (tone: Tone): string => {
	switch (tone) {
		case 'good':    return 'text-green-400 bg-green-500/15 border-green-500/25'
		case 'warn':    return 'text-orange-400 bg-orange-500/15 border-orange-500/25'
		case 'bad':     return 'text-red-400 bg-red-500/15 border-red-500/25'
		case 'info':    return 'text-blue-400 bg-blue-500/15 border-blue-500/25'
		case 'neutral': return 'text-[#bbb] bg-[#1a1a1a] border-[#2a2a2a]'
		case 'accent':  return 'text-[#F5364E] bg-[#F5364E]/10 border-[#F5364E]/30'
		default:        return 'text-white bg-white/5 border-white/15'
	}
}

export const scoreTone = (score: number): 'good' | 'warn' | 'bad' => {
	if (score >= 80) return 'good'
	if (score >= 50) return 'warn'
	return 'bad'
}

export const scoreGrade = (score: number): string => {
	if (score >= 90) return 'A'
	if (score >= 80) return 'B'
	if (score >= 70) return 'C'
	if (score >= 60) return 'D'
	return 'F'
}
