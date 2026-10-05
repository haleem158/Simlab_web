'use client';

export type SimTab = 'params' | 'results';

/** Parameters / Results switch. Only visible at phone and tablet widths. */
export function MobileSeg({ tab, onTab, hasResults, first = 'Parameters' }: { tab: SimTab; onTab: (t: SimTab) => void; hasResults: boolean; first?: string }) {
  return (
    <div className="mseg" role="tablist">
      <button type="button" role="tab" aria-selected={tab === 'params'} className={tab === 'params' ? 'on' : ''} onClick={() => onTab('params')}>
        {first}
      </button>
      <button type="button" role="tab" aria-selected={tab === 'results'} className={tab === 'results' ? 'on' : ''} onClick={() => onTab('results')}>
        Results
        {hasResults && tab === 'params' ? <i aria-label="Results ready" /> : null}
      </button>
    </div>
  );
}
