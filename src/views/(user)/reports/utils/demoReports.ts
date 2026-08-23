import type { SavedAnalysisReport } from '@/types/smart-analysis.types'
import demoReportsJson from './demo-reports.json'

/** Marks a report as prototype filler rather than a real localStorage save. */
export const DEMO_ID_PREFIX = 'demo-'

// Full-fidelity prototype archive: these four reports were rendered once
// through the real smart-analysis builders (see (user)/map/utils), then frozen
// as JSON, so every section matches what the map produces. Demo ids carry the
// `demo-` prefix and never mix with real localStorage saves.
export const DEMO_REPORTS = demoReportsJson as unknown as SavedAnalysisReport[]
