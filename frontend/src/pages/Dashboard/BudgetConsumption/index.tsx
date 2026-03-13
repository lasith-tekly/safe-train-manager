import React, { useState, useMemo } from 'react';
import {
  Select, Breadcrumb, Collapse,
  Skeleton, Alert, Typography,
} from 'antd';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { BarChartOutlined } from '@ant-design/icons';
import { useBudgetConsumption, QuarterInfo } from './hooks/useBudgetConsumption';

const { Text, Title } = Typography;

// ─── Colour constants ──────────────────────────────────────────────────────────
const C_BASELINE  = '#93c5fd';
const C_STRATEGIC = '#1677ff';
const C_PLANNED   = '#fa8c16';
const C_ACTUAL    = '#52c41a';
const C_OPS       = '#7c3aed';

// ─── Small helpers ─────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined): string {
  if (n == null) return '—';
  return n.toLocaleString();
}

function utilBadge(actual: number, total: number) {
  const pct = total > 0 ? Math.round((actual / total) * 100) : 0;
  const color = pct > 80 ? '#ef4444' : pct >= 40 ? '#f59e0b' : '#22c55e';
  const bg    = pct > 80 ? '#fef2f2' : pct >= 40 ? '#fffbeb' : '#f0fdf4';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
      <div style={{ width: 55, height: 5, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 600, background: bg, color, padding: '1px 6px', borderRadius: 10 }}>
        {pct}%
      </span>
    </div>
  );
}

// ─── CSS toggle switch (matches v5 mockup) ────────────────────────────────────
const OpsSwitch: React.FC<{ on: boolean; onToggle: () => void }> = ({ on, onToggle }) => (
  <div
    onClick={onToggle}
    title="Include Train Operating Cost in chart"
    style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '5px 12px',
      background: on ? '#fdf4ff' : '#fafafa',
      border: `1px solid ${on ? '#c084fc' : '#d1d5db'}`,
      borderRadius: 20, cursor: 'pointer', userSelect: 'none',
      transition: 'all .2s',
    }}
  >
    {/* track */}
    <div style={{ width: 30, height: 16, background: on ? C_OPS : '#d1d5db', borderRadius: 8, position: 'relative', flexShrink: 0, transition: 'background .2s' }}>
      <div style={{
        width: 12, height: 12, background: '#fff', borderRadius: '50%',
        position: 'absolute', top: 2, left: on ? 16 : 2,
        boxShadow: '0 1px 2px rgba(0,0,0,.2)', transition: 'left .2s',
      }} />
    </div>
    {/* dot */}
    <span style={{ width: 8, height: 8, background: C_OPS, borderRadius: 2, flexShrink: 0, opacity: on ? 1 : 0.35 }} />
    <span style={{ fontSize: 12, fontWeight: 600, color: on ? C_OPS : '#9ca3af', transition: 'color .2s' }}>
      Train Operating Cost
    </span>
  </div>
);

// ─── Series toggle pill ────────────────────────────────────────────────────────
const SeriesToggle: React.FC<{ label: string; color: string; activeStyle: React.CSSProperties; on: boolean; onToggle: () => void }> = ({ label, color, activeStyle, on, onToggle }) => (
  <div
    onClick={onToggle}
    style={{
      display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
      userSelect: 'none', padding: '4px 10px', borderRadius: 20,
      border: `1px solid ${on ? activeStyle.borderColor as string : '#e5e7eb'}`,
      fontSize: 12, fontWeight: 500, transition: 'all .15s',
      background: on ? activeStyle.background as string : '#fff',
      color: on ? activeStyle.color as string : '#374151',
    }}
  >
    <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
    {label}
  </div>
);

// ─── Quarter status tag ────────────────────────────────────────────────────────
const QTag: React.FC<{ q: QuarterInfo }> = ({ q }) => {
  const cfg = q.status === 'past'
    ? { background: '#f3f4f6', color: '#6b7280', label: 'Past' }
    : q.status === 'current'
    ? { background: '#fef9c3', color: '#92400e', border: '1px solid #fde68a', label: '★ Now' }
    : { background: '#eff6ff', color: '#1d4ed8', label: 'Future' };
  return (
    <div style={{
      textAlign: 'center', padding: '5px 4px', fontSize: 11, fontWeight: 600,
      borderRadius: 5, background: cfg.background, color: cfg.color,
      border: (cfg as any).border || 'none',
    }}>
      {q.label}
      <div style={{ fontWeight: 400, fontSize: 10, opacity: .8 }}>{q.iters} iter · {cfg.label}</div>
    </div>
  );
};

// ─── Summary Card ─────────────────────────────────────────────────────────────
const SummaryCard: React.FC<{ label: string; value: string | number; sub: string; color: string; pct?: number }> = ({ label, value, sub, color, pct = 0 }) => (
  <div style={{
    background: '#fff', border: `1px solid #e8eaed`, borderRadius: 8,
    padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,.08)',
    borderTop: `3px solid ${color}`,
  }}>
    <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'monospace', lineHeight: 1.1 }}>{value}</div>
    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{sub}</div>
    <div style={{ height: 4, background: '#e8eaed', borderRadius: 2, overflow: 'hidden', marginTop: 8 }}>
      <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 2 }} />
    </div>
  </div>
);

// ─── Tree Table ───────────────────────────────────────────────────────────────
interface TreeRow {
  key: string;
  parentKey: string | null;
  level: number;
  name: string;
  tag?: { label: string; color: string; bg: string };
  color?: string;
  total: number;
  baseline: number;
  strategic: number;
  planned: number;
  actual: number;
}

const TreeTable: React.FC<{
  rows: TreeRow[];
  currentQLabel: string;
}> = ({ rows, currentQLabel }) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['__train__', '__ops__', ...rows.filter(r => r.level === 1).map(r => r.key)]));

  const toggle = (key: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        // collapse this key and all descendants
        const toClose = new Set<string>();
        const queue = [key];
        while (queue.length) {
          const k = queue.shift()!;
          toClose.add(k);
          rows.forEach(r => { if (r.parentKey === k) queue.push(r.key); });
        }
        toClose.forEach(k => next.delete(k));
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const expandAll = () => setExpanded(new Set(rows.filter(r => rows.some(c => c.parentKey === r.key)).map(r => r.key)));
  const collapseAll = () => setExpanded(new Set());

  const visible = rows.filter(r => {
    if (r.parentKey === null) return true;
    return expanded.has(r.parentKey);
  });

  const hasChildren = (key: string) => rows.some(r => r.parentKey === key);

  const thStyle: React.CSSProperties = {
    padding: '8px 13px', textAlign: 'left', fontWeight: 600, fontSize: 11,
    color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.04em',
    background: '#fafafa', borderBottom: '1px solid #e8eaed', whiteSpace: 'nowrap',
  };
  const tdStyle: React.CSSProperties = { padding: '8px 13px', borderBottom: '1px solid #e8eaed', verticalAlign: 'middle' };

  const rowBg = (r: TreeRow) => {
    if (r.key === '__train__') return '#eef2ff';
    if (r.key === '__ops__') return '#fdf4ff';
    if (r.level === 1) return '#f8f9fa';
    return '#fff';
  };

  return (
    <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.08)', marginBottom: 16 }}>
      <div style={{ padding: '11px 20px', borderBottom: '1px solid #e8eaed', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa' }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>📊 Full Budget Hierarchy — {currentQLabel}</span>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={expandAll} style={{ fontSize: 12, color: '#1677ff', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Expand all</button>
          <button onClick={collapseAll} style={{ fontSize: 12, color: '#1677ff', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Collapse all</button>
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: 26 }} />
              <th style={thStyle}>Name</th>
              <th style={{ ...thStyle, textAlign: 'right', fontFamily: 'monospace' }}>Total Budget</th>
              <th style={{ ...thStyle, textAlign: 'right', fontFamily: 'monospace' }}>Baseline /Q</th>
              <th style={{ ...thStyle, textAlign: 'right', fontFamily: 'monospace' }}>Strategic</th>
              <th style={{ ...thStyle, textAlign: 'right', fontFamily: 'monospace' }}>Planned</th>
              <th style={{ ...thStyle, textAlign: 'right', fontFamily: 'monospace' }}>Actual</th>
              <th style={{ ...thStyle, textAlign: 'right', width: 130 }}>Utilisation</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.key} style={{ background: rowBg(r) }}>
                <td style={{ ...tdStyle, padding: '8px 6px' }}>
                  {hasChildren(r.key) ? (
                    <button
                      onClick={() => toggle(r.key)}
                      style={{
                        width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 9,
                        borderRadius: 3, transform: expanded.has(r.key) ? 'rotate(90deg)' : 'none', transition: 'transform .15s',
                      }}
                    >▶</button>
                  ) : (
                    <span style={{ display: 'inline-block', width: 18 }} />
                  )}
                </td>
                <td style={{ ...tdStyle }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {r.level >= 2 && <span style={{ display: 'inline-block', width: (r.level - 1) * 16 }} />}
                    {r.color && <span style={{ width: 8, height: 8, borderRadius: 2, background: r.color, flexShrink: 0, marginRight: 4 }} />}
                    <span style={{ fontWeight: r.level <= 1 ? 600 : 400 }}>{r.name}</span>
                    {r.tag && (
                      <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, fontWeight: 600, marginLeft: 4, background: r.tag.bg, color: r.tag.color }}>
                        {r.tag.label}
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>{fmt(r.total)}</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>{fmt(r.baseline)}</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>{r.strategic > 0 ? fmt(r.strategic) : <span style={{ color: '#9ca3af' }}>—</span>}</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>{r.planned > 0 ? fmt(r.planned) : <span style={{ color: '#9ca3af' }}>—</span>}</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>{r.actual > 0 ? fmt(r.actual) : <span style={{ color: '#9ca3af' }}>—</span>}</td>
                <td style={{ ...tdStyle }}>{utilBadge(r.actual, r.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Calculation Reference ────────────────────────────────────────────────────
const CalcReference: React.FC = () => (
  <Collapse
    defaultActiveKey={[]}
    items={[{
      key: 'ref',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 14 }}>📐</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#6b7280' }}>Calculation Reference</span>
          <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 10, background: '#f3f4f6', color: '#9ca3af', fontWeight: 500 }}>
            Baseline · Strategic Forecast · Utilisation
          </span>
        </span>
      ),
      children: (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Baseline */}
          <div style={{ background: '#fafafa', border: '1px solid #e8eaed', borderRadius: 6, padding: '14px 16px' }}>
            <h4 style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: C_BASELINE, display: 'inline-block' }} />
              Baseline Calculation
            </h4>
            <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
              Theoretical budget per quarter, weighted by PI iterations. IP iterations excluded.
            </p>
            <div style={{ background: '#1a1d23', borderRadius: 5, padding: '10px 14px', fontFamily: 'monospace', fontSize: 11, color: '#e2e8f0', lineHeight: 1.9 }}>
              <span style={{ color: '#64748b' }}>-- Baseline per quarter</span>{'\n'}
              <span style={{ color: '#93c5fd' }}>baseline_q</span> = (<span style={{ color: '#93c5fd' }}>total_budget</span> × <span style={{ color: '#93c5fd' }}>iters_in_q</span>) ÷ <span style={{ color: '#93c5fd' }}>total_iters</span>{'\n\n'}
              <span style={{ color: '#64748b' }}>-- Example: 4,345 KEUR, 14 total iters</span>{'\n'}
              Q1 = 4,345 × <span style={{ color: '#86efac' }}>4</span>/14 = <span style={{ color: '#86efac' }}>1,241</span> KEUR{'\n'}
              Q2 = 4,345 × <span style={{ color: '#86efac' }}>3</span>/14 = <span style={{ color: '#86efac' }}>931</span> KEUR
            </div>
          </div>
          {/* Strategic Forecast */}
          <div style={{ background: '#fafafa', border: '1px solid #e8eaed', borderRadius: 6, padding: '14px 16px' }}>
            <h4 style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: C_STRATEGIC, display: 'inline-block' }} />
              Strategic Forecast (Future Quarters)
            </h4>
            <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
              Past/current quarters show actual roadmap KEUR. Future quarters redistribute remaining budget by iteration ratio.
            </p>
            <div style={{ background: '#1a1d23', borderRadius: 5, padding: '10px 14px', fontFamily: 'monospace', fontSize: 11, color: '#e2e8f0', lineHeight: 1.9 }}>
              <span style={{ color: '#64748b' }}>-- Future quarters (forecast)</span>{'\n'}
              <span style={{ color: '#93c5fd' }}>remaining</span>  = total_budget − Σ committed{'\n'}
              <span style={{ color: '#93c5fd' }}>rem_iters</span>  = iters in unplanned quarters{'\n'}
              <span style={{ color: '#93c5fd' }}>forecast_q</span> = remaining × iters_q ÷ rem_iters
            </div>
            <div style={{ marginTop: 10, fontSize: 11, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 5, padding: '8px 12px', color: '#166534', fontFamily: 'monospace', lineHeight: 1.8 }}>
              Total=14,347K · Q1 committed=1,936K{'\n'}
              Remaining=12,411K · rem iters Q2+Q3+Q4=10{'\n'}
              Forecast Q2 = 12,411 × 3/10 = <strong>3,723K</strong>
            </div>
          </div>
          {/* Utilisation */}
          <div style={{ background: '#fafafa', border: '1px solid #e8eaed', borderRadius: 6, padding: '14px 16px' }}>
            <h4 style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: C_ACTUAL, display: 'inline-block' }} />
              Utilisation
            </h4>
            <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>Actual consumption as % of total budget.</p>
            <div style={{ background: '#1a1d23', borderRadius: 5, padding: '10px 14px', fontFamily: 'monospace', fontSize: 11, color: '#e2e8f0', lineHeight: 1.9 }}>
              <span style={{ color: '#93c5fd' }}>utilisation</span> = actual ÷ total_budget × 100{'\n\n'}
              <span style={{ color: '#64748b' }}>-- Colour thresholds</span>{'\n'}
              {'< 40%  → '}<span style={{ color: '#86efac' }}>Green</span>   (on track){'\n'}
              40–80% → <span style={{ color: '#fbbf24' }}>Orange</span>  (monitor){'\n'}
              {'> 80%  → '}<span style={{ color: '#f87171' }}>Red</span>     (at risk)
            </div>
          </div>
          {/* Quarter Classification */}
          <div style={{ background: '#fafafa', border: '1px solid #e8eaed', borderRadius: 6, padding: '14px 16px' }}>
            <h4 style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#fde68a', display: 'inline-block' }} />
              Quarter Classification
            </h4>
            <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>Quarters classified relative to today's date.</p>
            <div style={{ background: '#1a1d23', borderRadius: 5, padding: '10px 14px', fontFamily: 'monospace', fontSize: 11, color: '#e2e8f0', lineHeight: 1.9 }}>
              <span style={{ color: '#64748b' }}>-- Based on today's date</span>{'\n'}
              <span style={{ color: '#86efac' }}>Past</span>    → quarter_end   {'<'} today{'\n'}
              <span style={{ color: '#86efac' }}>Current</span> → quarter_start ≤ today ≤ quarter_end{'\n'}
              <span style={{ color: '#86efac' }}>Future</span>  → quarter_start {'>'} today{'\n\n'}
              <span style={{ color: '#64748b' }}>-- Boundaries from PI calendar iterations</span>
            </div>
          </div>
        </div>
      ),
    }]}
    style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}
  />
);

// ─── Custom Chart Tooltip ────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e8eaed',
      borderRadius: 8,
      padding: '10px 14px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
      fontSize: 12,
      minWidth: 180,
    }}>
      <div style={{
        fontWeight: 700,
        marginBottom: 8,
        color: '#1a1d23',
        fontSize: 13,
        borderBottom: '1px solid #f0f0f0',
        paddingBottom: 6,
      }}>
        {label}
      </div>
      {payload.map((entry: any, i: number) => {
        if (entry.value == null || entry.value === 0) return null;
        return (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            padding: '2px 0',
            color: '#374151',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                width: 8, height: 8,
                borderRadius: entry.type === 'line' ? '50%' : 2,
                background: entry.color,
                display: 'inline-block',
                flexShrink: 0,
              }} />
              <span style={{ color: '#6b7280', fontSize: 11 }}>{entry.name}</span>
            </div>
            <span style={{
              fontWeight: 600,
              color: '#1a1d23',
              fontFamily: 'monospace',
            }}>
              {Number(entry.value).toLocaleString()} KEUR
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
type ViewLevel = 'train' | 'product' | 'budgetline' | 'category';
const LEVEL_ORDER: ViewLevel[] = ['train', 'product', 'budgetline', 'category'];
const LEVEL_LABELS: Record<ViewLevel, string> = {
  train: 'Train', product: 'Product', budgetline: 'Budget Line', category: 'Category',
};

export const BudgetConsumptionDashboard: React.FC = () => {
  const hook = useBudgetConsumption();
  const {
    fiscalYears, selectedYearId, setSelectedYearId,
    hierarchy, productBudgetDetails, trainLines, quarters,
    features,
    calcBaseline, strategicByQuarter, plannedByQuarter, actualByQuarter,
    summaryCards, productColorMap,
    isLoading, error,
  } = hook;

  // ── UI state ──────────────────────────────────────────────────────────────
  const [viewLevel, setViewLevel] = useState<ViewLevel>('product');
  const [contextFilter, setContextFilter] = useState<string>('all');
  const [selectedChips, setSelectedChips] = useState<Set<string>>(new Set());

  const [showBaseline,  setShowBaseline]  = useState(true);
  const [showStrategic, setShowStrategic] = useState(true);
  const [showPlanned,   setShowPlanned]   = useState(true);
  const [showActual,    setShowActual]    = useState(true);
  const [showOps,       setShowOps]       = useState(false);

  const products = hierarchy?.product_budgets || [];

  // Reset chip selection when level or context changes
  const handleLevelChange = (lvl: ViewLevel) => {
    setViewLevel(lvl);
    setContextFilter('all');
    setSelectedChips(new Set());
  };

  const handleContextChange = (val: string) => {
    setContextFilter(val);
    setSelectedChips(new Set());
  };

  // ── Chip items ────────────────────────────────────────────────────────────
  const chipItems = useMemo(() => {
    if (viewLevel === 'train') return [];
    if (viewLevel === 'product') {
      return products.map((pb) => ({
        id: pb.product.id,
        label: pb.product.name,
        sub: `${fmt(pb.allocated_amount)}K`,
        color: productColorMap[pb.product.id] || '#3b82f6',
      }));
    }
    if (viewLevel === 'budgetline') {
      const filtered = contextFilter === 'all'
        ? productBudgetDetails
        : productBudgetDetails.filter((pb: any) => pb.product?.id === contextFilter);
      return filtered.flatMap((pb: any) =>
        (pb.budget_lines || []).map((bl: any) => ({
          id: bl.id,
          label: `${pb.product?.short_code} — ${bl.name}`,
          sub: `${fmt(bl.allocated_amount)}K`,
          color: productColorMap[pb.product?.id] || '#3b82f6',
        }))
      );
    }
    if (viewLevel === 'category') {
      if (contextFilter === 'all') {
        return productBudgetDetails.flatMap((pb: any) =>
          (pb.budget_lines || []).flatMap((bl: any) =>
            (bl.categories || []).map((cat: any) => ({
              id: cat.id,
              label: cat.name,
              sub: `${bl.name} · ${fmt(cat.allocated_amount)}K`,
              color: productColorMap[pb.product?.id] || '#3b82f6',
            }))
          )
        );
      }
      // contextFilter = budget_line_id
      for (const pb of productBudgetDetails) {
        const bl = (pb.budget_lines || []).find((b: any) => b.id === contextFilter);
        if (bl) {
          return (bl.categories || []).map((cat: any) => ({
            id: cat.id,
            label: cat.name,
            sub: `${fmt(cat.allocated_amount)}K`,
            color: productColorMap[pb.product?.id] || '#3b82f6',
          }));
        }
      }
    }
    return [];
  }, [viewLevel, contextFilter, products, productBudgetDetails, productColorMap]);

  // Auto-select all chips when items list changes
  const effectiveChips = useMemo(() => {
    if (selectedChips.size === 0 && chipItems.length > 0) {
      return new Set(chipItems.map((c: { id: string }) => c.id));
    }
    return selectedChips;
  }, [selectedChips, chipItems]);

  const toggleChip = (id: string) => {
    setSelectedChips((prev: Set<string>) => {
      const next = new Set<string>(prev.size === 0 ? chipItems.map((c: { id: string }) => c.id) : prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const selectAll = () => setSelectedChips(new Set<string>(chipItems.map((c: { id: string }) => c.id)));
  const clearAll  = () => setSelectedChips(new Set<string>());

  // ── Context filter options ─────────────────────────────────────────────────
  const contextOptions = useMemo(() => {
    if (viewLevel === 'budgetline') {
      return [{ value: 'all', label: 'All Products' }, ...products.map(pb => ({ value: pb.product.id, label: pb.product.name }))];
    }
    if (viewLevel === 'category') {
      return [
        { value: 'all', label: 'All Budget Lines' },
        ...products.flatMap(pb =>
          (pb.budget_lines || []).map(bl => ({ value: bl.id, label: `${pb.product.short_code} — ${bl.name}` }))
        ),
      ];
    }
    return [];
  }, [viewLevel, products]);

  // ── Baseline bar datasets: one Bar per product ────────────────────────────
  const baselineProducts = useMemo(() => {
    if (!showBaseline) return [];

    const totalProductBudget = products.reduce(
      (s, pb) => s + (pb.allocated_amount || 0), 0
    );
    const totalOps = showOps
      ? trainLines.reduce((s, tl) => s + (tl.allocated_amount || 0), 0)
      : 0;

    return products
      .filter(pb =>
        viewLevel === 'train' ||
        viewLevel !== 'product' ||
        effectiveChips.has(pb.product.id)
      )
      .map(pb => {
        const productBudget = pb.allocated_amount || 0;
        const opsShare = totalProductBudget > 0
          ? (productBudget / totalProductBudget) * totalOps
          : 0;
        const totalForBaseline = productBudget + opsShare;
        return {
          id: pb.product.id,
          name: pb.product.short_code,
          color: productColorMap[pb.product.id] || '#3b82f6',
          data: [0, 1, 2, 3].map(i => calcBaseline(totalForBaseline, i)),
          opsShare: Math.round(opsShare),
        };
      });
  }, [showBaseline, showOps, products, trainLines, viewLevel,
      effectiveChips, productColorMap, calcBaseline]);

  // ── Strategic by quarter — filtered by chip selection ─────────────────────
  const filteredStrategicByQuarter: (number | null)[] = useMemo(() => {
    if (!quarters.length) return [null, null, null, null];

    // 1. Determine selected budget total based on viewLevel + effectiveChips
    let selectedBudget = 0;

    if (viewLevel === 'train') {
      selectedBudget = products.reduce((s, pb) => s + (pb.allocated_amount || 0), 0)
        + trainLines.reduce((s, tl) => s + (tl.allocated_amount || 0), 0);
    } else if (viewLevel === 'product') {
      selectedBudget = products
        .filter(pb => effectiveChips.has(pb.product.id))
        .reduce((s, pb) => s + (pb.allocated_amount || 0), 0);
    } else if (viewLevel === 'budgetline') {
      selectedBudget = productBudgetDetails.flatMap((pb: any) => pb.budget_lines || [])
        .filter((bl: any) => effectiveChips.has(bl.id))
        .reduce((s: number, bl: any) => s + (bl.allocated_amount || 0), 0);
    } else if (viewLevel === 'category') {
      selectedBudget = productBudgetDetails
        .flatMap((pb: any) => (pb.budget_lines || []).flatMap((bl: any) => bl.categories || []))
        .filter((cat: any) => effectiveChips.has(cat.id))
        .reduce((s: number, cat: any) => s + (cat.allocated_amount || 0), 0);
    }

    // Add OPS share when toggle ON (product view: proportional share)
    if (showOps) {
      const totalProductBudget = products.reduce(
        (s, pb) => s + (pb.allocated_amount || 0), 0
      );
      const totalOps = trainLines.reduce(
        (s, tl) => s + (tl.allocated_amount || 0), 0
      );
      if (viewLevel === 'train') {
        // Already includes OPS in selectedBudget above — no change needed
      } else if (viewLevel === 'product') {
        const selectedProductBudget = products
          .filter(pb => effectiveChips.has(pb.product.id))
          .reduce((s, pb) => s + (pb.allocated_amount || 0), 0);
        const opsShare = totalProductBudget > 0
          ? (selectedProductBudget / totalProductBudget) * totalOps
          : 0;
        selectedBudget += opsShare;
      }
      // BL and category: OPS distribution at that granularity is too complex — leave as-is
    }

    // 2. Filter features to selected scope
    const selectedProductIds: Set<string> = new Set(
      viewLevel === 'train'
        ? products.map(pb => pb.product.id)
        : viewLevel === 'product'
        ? products.filter(pb => effectiveChips.has(pb.product.id)).map(pb => pb.product.id)
        : viewLevel === 'budgetline'
        ? productBudgetDetails
            .filter((pb: any) => (pb.budget_lines || []).some((bl: any) => effectiveChips.has(bl.id)))
            .map((pb: any) => pb.product?.id)
        : productBudgetDetails
            .filter((pb: any) =>
              (pb.budget_lines || []).some((bl: any) =>
                (bl.categories || []).some((cat: any) => effectiveChips.has(cat.id))
              )
            )
            .map((pb: any) => pb.product?.id)
    );

    const selectedFeatures = features.filter((f: any) =>
      selectedProductIds.has(f.product_id)
    );

    // 3. Compute committed per quarter (past + current)
    const result: (number | null)[] = [null, null, null, null];

    [0, 1, 2, 3].forEach((idx) => {
      const qStatus = quarters[idx]?.status;
      if (!qStatus) return;

      if (qStatus === 'past' || qStatus === 'current') {
        let total = 0;
        for (const f of selectedFeatures) {
          for (const qa of f.quarterly_allocations || []) {
            if (qa.quarter === idx + 1) {
              const ratio = f.net_sizing_ed > 0
                ? qa.allocated_ed / f.net_sizing_ed
                : 0;
              total += ratio * (f.total_cost_keur || 0);
            }
          }
        }
        result[idx] = Math.round(total);
      }
    });

    // 4. Compute forecast for future quarters
    const totalCommitted: number = result.reduce<number>(
      (s, v) => s + (v !== null ? v : 0), 0
    );
    const remaining = Math.max(0, selectedBudget - totalCommitted);
    const futureQuarters = quarters.filter(q => q.status === 'future');
    const futureIters = futureQuarters.reduce((s, q) => s + q.iters, 0);

    [0, 1, 2, 3].forEach((idx) => {
      if (quarters[idx]?.status === 'future') {
        result[idx] = futureIters > 0
          ? Math.round((remaining * quarters[idx].iters) / futureIters)
          : null;
      }
    });

    return result;
  }, [
    viewLevel, effectiveChips, quarters, products, productBudgetDetails,
    features, trainLines, showOps,
  ]);

  // ── Chart data ─────────────────────────────────────────────────────────────
  const chartData = useMemo(() => {
    const qlabels = quarters.length === 4
      ? quarters.map(q => q.label)
      : ['Q1', 'Q2', 'Q3', 'Q4'];

    return qlabels.map((label, idx) => {
      const point: Record<string, number | null | string> = { quarter: label };

      // Per-product baseline keys (consumed by Bar dataKey)
      baselineProducts.forEach(bp => {
        point[`_bl_${bp.id}`] = bp.data[idx] ?? null;
      });
      // Strategic committed/forecast split
      if (showStrategic) {
        const v = filteredStrategicByQuarter[idx];
        const qStatus = quarters[idx]?.status;
        if (qStatus === 'past') {
          point['strategic_committed'] = v;
          point['strategic_forecast']  = null;
        } else if (qStatus === 'current') {
          // Bridge point — set both so solid and dashed lines connect here
          point['strategic_committed'] = v;
          point['strategic_forecast']  = v;
        } else {
          point['strategic_committed'] = null;
          point['strategic_forecast']  = v;
        }
      }

      if (showPlanned) point['planned']  = plannedByQuarter[idx];
      if (showActual)  point['actual']   = actualByQuarter[idx];

      return point;
    });
  }, [quarters, baselineProducts, filteredStrategicByQuarter, plannedByQuarter, actualByQuarter, showStrategic, showPlanned, showActual]);

  // ── Tree rows ──────────────────────────────────────────────────────────────
  const treeRows: TreeRow[] = useMemo(() => {
    const rows: TreeRow[] = [];
    const currentQIdx = quarters.findIndex(q => q.status === 'current');
    // Guard: if no current quarter found, use first future quarter
    // to avoid NaN in baseline calculations
    const safeQIdx = currentQIdx >= 0
      ? currentQIdx
      : quarters.findIndex(q => q.status === 'future');
    const displayQIdx = safeQIdx >= 0 ? safeQIdx : 0;

    const totalProducts = products.reduce((s, pb) => s + pb.allocated_amount, 0);
    const totalOps      = trainLines.reduce((s, tl) => s + tl.allocated_amount, 0);
    const trainTotal    = totalProducts + totalOps;

    const trainActual   = products.reduce((s, pb) => s + pb.consumed_amount, 0) + trainLines.reduce((s, tl) => s + tl.consumed_amount, 0);
    const trainStrat    = (filteredStrategicByQuarter[displayQIdx] as number) || 0;
    const trainPlanned  = (plannedByQuarter[displayQIdx]  as number) || 0;

    rows.push({
      key: '__train__', parentKey: null, level: 0,
      name: 'Train Total (Products + Operating)', color: C_STRATEGIC,
      total: trainTotal, baseline: calcBaseline(trainTotal, displayQIdx),
      strategic: trainStrat, planned: trainPlanned, actual: trainActual,
    });

    rows.push({
      key: '__ops__', parentKey: '__train__', level: 1,
      name: 'Train Operating Cost', color: C_OPS,
      tag: { label: 'Operating', color: '#7c3aed', bg: '#f3e8ff' },
      total: totalOps, baseline: calcBaseline(totalOps, displayQIdx),
      strategic: 0, planned: 0, actual: trainLines.reduce((s, tl) => s + tl.consumed_amount, 0),
    });

    trainLines.forEach((tl, ti) => {
      rows.push({
        key: `__opl_${ti}__`, parentKey: '__ops__', level: 2,
        name: tl.name, color: `${C_OPS}99`,
        total: tl.allocated_amount, baseline: calcBaseline(tl.allocated_amount, displayQIdx),
        strategic: 0, planned: 0, actual: tl.consumed_amount,
      });
      (tl.categories || []).forEach((cat, ci) => {
        rows.push({
          key: `__opl_${ti}_cat_${ci}__`, parentKey: `__opl_${ti}__`, level: 3,
          name: `↳ ${cat.name}`,
          total: cat.allocated_amount, baseline: calcBaseline(cat.allocated_amount, displayQIdx),
          strategic: 0, planned: 0, actual: cat.consumed_amount,
        });
      });
    });

    products.forEach((pb) => {
      const pColor = productColorMap[pb.product.id] || '#3b82f6';
      rows.push({
        key: `__p_${pb.product.id}__`, parentKey: '__train__', level: 1,
        name: pb.product.name, color: pColor,
        tag: { label: 'Product', color: '#166534', bg: '#dcfce7' },
        total: pb.allocated_amount, baseline: calcBaseline(pb.allocated_amount, displayQIdx),
        strategic: 0, planned: 0, actual: pb.consumed_amount,
      });
      (pb.budget_lines || []).forEach((bl) => {
        rows.push({
          key: `__bl_${bl.id}__`, parentKey: `__p_${pb.product.id}__`, level: 2,
          name: bl.name, color: `${pColor}99`,
          tag: { label: 'BL', color: '#c2410c', bg: '#fff7ed' },
          total: bl.allocated_amount, baseline: calcBaseline(bl.allocated_amount, displayQIdx),
          strategic: 0, planned: 0, actual: bl.consumed_amount,
        });
        (bl.categories || []).forEach((cat) => {
          rows.push({
            key: `__cat_${cat.id}__`, parentKey: `__bl_${bl.id}__`, level: 3,
            name: `↳ ${cat.name}`,
            tag: { label: 'Category', color: '#374151', bg: '#f3f4f6' },
            total: cat.allocated_amount, baseline: calcBaseline(cat.allocated_amount, displayQIdx),
            strategic: 0, planned: 0, actual: cat.consumed_amount,
          });
        });
      });
    });

    return rows;
  }, [products, trainLines, quarters, calcBaseline, strategicByQuarter, plannedByQuarter, productColorMap]);

  const currentQ = quarters.find(q => q.status === 'current');

  // ── Render ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <Alert type="error" message={error} showIcon />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', fontFamily: 'inherit' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChartOutlined style={{ color: '#1677ff' }} />
          Budget Consumption Dashboard
        </Title>
        <Text type="secondary" style={{ fontSize: 12, fontFamily: 'monospace' }}>
          {fiscalYears.find(y => y.id === selectedYearId)
            ? `FY ${fiscalYears.find(y => y.id === selectedYearId)!.year}`
            : ''} · {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
        </Text>
      </div>

      {/* Filter Bar */}
      <div style={{
        background: '#fff', border: '1px solid #e8eaed', borderRadius: 8,
        padding: '11px 20px', display: 'flex', alignItems: 'center', gap: 0,
        marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,.08)', flexWrap: 'wrap', rowGap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 20, marginRight: 20, borderRight: '1px solid #e8eaed' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.05em' }}>Year</span>
          <Select
            value={selectedYearId}
            onChange={setSelectedYearId}
            style={{ minWidth: 120 }}
            size="small"
            options={fiscalYears.map(y => ({ value: y.id, label: `FY ${y.year}${y.is_current ? ' (Current)' : ''}` }))}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 20, marginRight: 20, borderRight: '1px solid #e8eaed' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.05em' }}>View Level</span>
          <Select
            value={viewLevel}
            onChange={handleLevelChange}
            style={{ minWidth: 160 }}
            size="small"
            options={[
              { value: 'train',      label: 'Train (All)' },
              { value: 'product',    label: 'Product' },
              { value: 'budgetline', label: 'Budget Line' },
              { value: 'category',   label: 'Category' },
            ]}
          />
        </div>
        {(viewLevel === 'budgetline' || viewLevel === 'category') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.05em' }}>
              {viewLevel === 'budgetline' ? 'Product' : 'Budget Line'}
            </span>
            <Select
              value={contextFilter}
              onChange={handleContextChange}
              style={{ minWidth: 200 }}
              size="small"
              options={contextOptions}
            />
          </div>
        )}
      </div>

      {/* Breadcrumb */}
      <div style={{ marginBottom: 12 }}>
        <Breadcrumb
          items={LEVEL_ORDER.slice(0, LEVEL_ORDER.indexOf(viewLevel) + 1).map((lvl) => ({
            key: lvl,
            title: (
              <span
                onClick={() => lvl !== viewLevel && handleLevelChange(lvl)}
                style={{ cursor: lvl !== viewLevel ? 'pointer' : 'default', fontWeight: lvl === viewLevel ? 600 : 400 }}
              >
                {LEVEL_LABELS[lvl]}
              </span>
            ),
          }))}
        />
      </div>

      {isLoading ? (
        <Skeleton active paragraph={{ rows: 12 }} />
      ) : (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
            <SummaryCard
              label="Total Budget FY"
              value={`${summaryCards.totalBudget.toLocaleString()}`}
              sub="KEUR · Products + Operating"
              color="#1677ff"
              pct={100}
            />
            <SummaryCard
              label={`Baseline ${currentQ?.label || ''}`}
              value={`${summaryCards.baselineCurrent.toLocaleString()}`}
              sub={`KEUR · ${summaryCards.baselineLabel}`}
              color={C_BASELINE}
              pct={summaryCards.totalBudget > 0 ? Math.round(summaryCards.baselineCurrent / summaryCards.totalBudget * 100) : 0}
            />
            <SummaryCard
              label="Strategic Planned"
              value={`${summaryCards.strategicCurrent.toLocaleString()}`}
              sub={`KEUR · ${currentQ?.label || ''} roadmap committed`}
              color={C_STRATEGIC}
              pct={summaryCards.totalBudget > 0 ? Math.round(summaryCards.strategicCurrent / summaryCards.totalBudget * 100) : 0}
            />
            <SummaryCard
              label="Planned Consumption"
              value={`${summaryCards.plannedCurrent.toLocaleString()}`}
              sub={`KEUR · Approved team plans ${currentQ?.label || ''}`}
              color={C_PLANNED}
              pct={summaryCards.totalBudget > 0 ? Math.round(summaryCards.plannedCurrent / summaryCards.totalBudget * 100) : 0}
            />
            <SummaryCard
              label="Actual Consumption"
              value={`${summaryCards.actualCurrent.toLocaleString()}`}
              sub={`KEUR · JIRA records ${currentQ?.label || ''}`}
              color={C_ACTUAL}
              pct={summaryCards.totalBudget > 0 ? Math.round(summaryCards.actualCurrent / summaryCards.totalBudget * 100) : 0}
            />
          </div>

          {/* Chip Selector */}
          <div style={{
            background: '#fff', border: '1px solid #e8eaed', borderRadius: 8,
            padding: '14px 20px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {viewLevel === 'train' ? 'Train level' : `📋 ${LEVEL_LABELS[viewLevel]}s — select to display in chart`}
                </div>
                {chipItems.length > 0 && (
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                    {effectiveChips.size} of {chipItems.length} selected
                  </div>
                )}
              </div>
              {chipItems.length > 0 && (
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={selectAll} style={{ fontSize: 12, color: '#1677ff', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Select all</button>
                  <button onClick={clearAll}  style={{ fontSize: 12, color: '#1677ff', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Clear</button>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {viewLevel === 'train' ? (
                <span style={{ color: '#9ca3af', fontSize: 12 }}>All data aggregated at Train level.</span>
              ) : chipItems.map((item: { id: string; label: string; sub?: string; color: string }) => {
                const on = effectiveChips.has(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleChip(item.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '4px 12px', border: `1px solid ${on ? '#1677ff' : '#d1d5db'}`,
                      borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 500,
                      background: on ? '#e6f0ff' : '#fff', color: on ? '#1677ff' : '#374151',
                      userSelect: 'none', transition: 'all .15s',
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: item.color, flexShrink: 0 }} />
                    {item.label}
                    <span style={{ color: '#9ca3af', fontWeight: 400, marginLeft: 3, fontSize: 11 }}>{item.sub}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart Panel */}
          <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(0,0,0,.07)', marginBottom: 16, overflow: 'hidden' }}>
            {/* Chart header */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #e8eaed', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Budget Consumption — Quarterly View</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{`Bars = theoretical baseline${showOps ? ' (incl. OPS share)' : ''} · Lines = strategic / planned / actual consumption`}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <OpsSwitch on={showOps} onToggle={() => setShowOps(v => !v)} />
                <div style={{ width: 1, height: 22, background: '#d1d5db', margin: '0 2px' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                  <SeriesToggle label="Baseline"  color={C_BASELINE}  on={showBaseline}  onToggle={() => setShowBaseline(v => !v)}  activeStyle={{ background: '#dbeafe', borderColor: '#93c5fd', color: '#1e40af' }} />
                  <SeriesToggle label="Strategic" color={C_STRATEGIC} on={showStrategic} onToggle={() => setShowStrategic(v => !v)} activeStyle={{ background: '#eff6ff', borderColor: C_STRATEGIC, color: C_STRATEGIC }} />
                  <SeriesToggle label="Planned"   color={C_PLANNED}   on={showPlanned}   onToggle={() => setShowPlanned(v => !v)}   activeStyle={{ background: '#fff7ed', borderColor: '#fb923c', color: '#c2410c' }} />
                  <SeriesToggle label="Actual"    color={C_ACTUAL}    on={showActual}    onToggle={() => setShowActual(v => !v)}    activeStyle={{ background: '#f0fdf4', borderColor: '#86efac', color: '#166534' }} />
                </div>
              </div>
            </div>

            {/* Quarter strip */}
            {quarters.length === 4 && (
              <div style={{ display: 'grid', gridTemplateColumns: '50px repeat(4, 1fr)', gap: 4, padding: '10px 20px 0' }}>
                <div />
                {quarters.map((q, i) => <QTag key={i} q={q} />)}
              </div>
            )}

            {/* Chart */}
            <div style={{ padding: '8px 20px 20px', height: 360 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" vertical={false} />
                  <XAxis dataKey="quarter" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 10, fontFamily: 'monospace' }}
                    tickFormatter={(v) => `${v.toLocaleString()}K`}
                    label={{ value: 'KEUR', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#9ca3af' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />

                  {/* Baseline bars per product — inject per-product data via data prop */}
                  {baselineProducts.map((bp) => (
                    <Bar
                      key={`bl_${bp.id}`}
                      dataKey={`_bl_${bp.id}`}
                      name={`Baseline — ${bp.name}`}
                      stackId="baseline"
                      fill={`${bp.color}44`}
                      stroke={`${bp.color}88`}
                      strokeWidth={1}
                    />
                  ))}


                  {/* Strategic committed (solid) */}
                  {showStrategic && (
                    <Line
                      dataKey="strategic_committed"
                      name="Strategic — Committed"
                      stroke={C_STRATEGIC}
                      strokeWidth={2.5}
                      dot={{ r: 6, fill: C_STRATEGIC }}
                      connectNulls={false}
                      type="monotone"
                    />
                  )}
                  {/* Strategic forecast (dashed) */}
                  {showStrategic && (
                    <Line
                      dataKey="strategic_forecast"
                      name="Strategic — Forecast"
                      stroke={C_STRATEGIC}
                      strokeWidth={2}
                      strokeDasharray="8 5"
                      dot={{ r: 5, fill: '#fff', stroke: C_STRATEGIC, strokeWidth: 2 }}
                      connectNulls={false}
                      type="monotone"
                    />
                  )}
                  {/* Planned */}
                  {showPlanned && (
                    <Line
                      dataKey="planned"
                      name="Planned Consumption"
                      stroke={C_PLANNED}
                      strokeWidth={2}
                      dot={{ r: 5, fill: C_PLANNED }}
                      connectNulls={false}
                      type="monotone"
                    />
                  )}
                  {/* Actual */}
                  {showActual && (
                    <Line
                      dataKey="actual"
                      name="Actual Consumption"
                      stroke={C_ACTUAL}
                      strokeWidth={2}
                      dot={{ r: 5, fill: C_ACTUAL }}
                      connectNulls={false}
                      type="monotone"
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tree Table */}
          <TreeTable rows={treeRows} currentQLabel={currentQ?.label ?? '—'} />

          {/* Calculation Reference */}
          <CalcReference />
        </>
      )}
    </div>
  );
};

export default BudgetConsumptionDashboard;
