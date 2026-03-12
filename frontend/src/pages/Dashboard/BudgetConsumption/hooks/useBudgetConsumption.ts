import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FiscalYear {
  id: string;
  year: number;
  is_current: boolean;
}

export interface BudgetCategory {
  id: string;
  name: string;
  allocated_amount: number;
  consumed_amount: number;
}

export interface BudgetLine {
  id: string;
  code: string;
  name: string;
  allocated_amount: number;
  consumed_amount: number;
  is_transversal: boolean;
  is_roadmap_eligible: boolean;
  product_budget_id?: string;
  categories: BudgetCategory[];
}

export interface ProductBudget {
  id: string;
  product: { id: string; name: string; short_code: string };
  allocated_amount: number;
  consumed_amount: number;
  budget_lines: BudgetLine[];
}

export interface BudgetVersionDetail {
  id: string;
  version_number: number;
  is_active: boolean;
  fiscal_year_id: string;
  product_budgets: ProductBudget[];
}

export interface TrainLine {
  id: string;
  code: string;
  name: string;
  allocated_amount: number;
  consumed_amount: number;
  categories: BudgetCategory[];
}

export type QuarterStatus = 'past' | 'current' | 'future';

export interface QuarterInfo {
  label: string;   // e.g. "Q1 2026"
  iters: number;
  status: QuarterStatus;
  startDate: Date;
  endDate: Date;
}

// ─── Product colours (deterministic, matches mockup palette) ─────────────────

const PRODUCT_COLORS = [
  '#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b',
  '#10b981', '#ef4444', '#f97316', '#84cc16',
];

// ─── Quarter boundary helpers ─────────────────────────────────────────────────

function getQuarterFromDate(dateStr: string): 1 | 2 | 3 | 4 {
  const m = new Date(dateStr).getMonth() + 1; // 1-12
  if (m <= 3) return 1;
  if (m <= 6) return 2;
  if (m <= 9) return 3;
  return 4;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBudgetConsumption() {
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [hierarchy, setHierarchy] = useState<BudgetVersionDetail | null>(null);
  const [trainLines, setTrainLines] = useState<TrainLine[]>([]);
  const [pis, setPis] = useState<any[]>([]);
  const [globalSettings, setGlobalSettings] = useState<any | null>(null);
  const [features, setFeatures] = useState<any[]>([]);          // all product features
  const [planningItems, setPlanningItems] = useState<any[]>([]);  // all team-planning items (approved)
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Load fiscal years on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/budget/fiscal-years`);
        const years: FiscalYear[] = res.data.data || res.data || [];
        setFiscalYears(years);
        const current =
          years.find((y) => y.is_current) ??
          years.find((y) => y.year === new Date().getFullYear()) ??
          years[0];
        if (current) setSelectedYearId(current.id);
      } catch {
        setError('Failed to load fiscal years');
      }
    })();
  }, []);

  // 2. When selectedYearId changes, find active version
  useEffect(() => {
    if (!selectedYearId) return;
    (async () => {
      try {
        const res = await axios.get(`${API}/budget/versions`, {
          params: { fiscal_year_id: selectedYearId },
        });
        const versions: any[] = res.data.data || res.data || [];
        const active = versions.find((v) => v.is_active) ?? versions[0];
        setActiveVersionId(active?.id ?? null);
      } catch {
        setError('Failed to load budget versions');
      }
    })();
  }, [selectedYearId]);

  // 3. When activeVersionId changes, load hierarchy + train lines + PIs + settings + features + planning
  useEffect(() => {
    if (!activeVersionId) return;
    const fiscalYear = fiscalYears.find((y) => y.id === selectedYearId);
    if (!fiscalYear) return;

    setIsLoading(true);
    setError(null);

    const year = fiscalYear.year;

    Promise.all([
      axios.get(`${API}/budget/versions/${activeVersionId}`),
      axios.get(`${API}/budget/versions/${activeVersionId}/train-lines`),
      axios.get(`${API}/pis`, { params: { year } }),
      axios.get(`${API}/settings/global/${year}`),
    ])
      .then(async ([hierRes, trainRes, pisRes, settingsRes]) => {
        const hierData: BudgetVersionDetail = hierRes.data;
        setHierarchy(hierData);

        const tLines: TrainLine[] = (trainRes.data.data || trainRes.data || []).map((l: any) => ({
          id: l.id,
          code: l.code,
          name: l.name,
          allocated_amount: Number(l.allocated_amount) || 0,
          consumed_amount: Number(l.consumed_amount) || 0,
          categories: (l.categories || []).map((c: any) => ({
            id: c.id,
            name: c.name,
            allocated_amount: Number(c.allocated_amount) || 0,
            consumed_amount: Number(c.consumed_amount) || 0,
          })),
        }));
        setTrainLines(tLines);

        const loadedPIs: any[] = pisRes.data.data || pisRes.data || [];
        setPis(loadedPIs);

        setGlobalSettings(settingsRes.data);

        // Fetch features for each product in hierarchy
        const products = hierData.product_budgets || [];
        const featureArrays = await Promise.all(
          products.map((pb) =>
            axios
              .get(`${API}/products/${pb.product.id}/features`)
              .then((r) => r.data.data || r.data || [])
              .catch(() => [])
          )
        );
        setFeatures(featureArrays.flat());

        // Fetch all approved team planning items
        try {
          const planRes = await axios.get(`${API}/team-planning`);
          const allItems: any[] = planRes.data.items || planRes.data.data || planRes.data || [];
          setPlanningItems(allItems.filter((i: any) => i.review_status === 'approved'));
        } catch {
          setPlanningItems([]);
        }
      })
      .catch(() => setError('Failed to load budget data'))
      .finally(() => setIsLoading(false));
  }, [activeVersionId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived: quarter info from PI calendar ──────────────────────────────────
  const quarters: QuarterInfo[] = useMemo(() => {
    if (!pis.length) return [];

    const today = new Date();
    const qMap: Record<number, { iters: number; startDate: Date; endDate: Date }> = {
      1: { iters: 0, startDate: new Date('9999-01-01'), endDate: new Date('1970-01-01') },
      2: { iters: 0, startDate: new Date('9999-01-01'), endDate: new Date('1970-01-01') },
      3: { iters: 0, startDate: new Date('9999-01-01'), endDate: new Date('1970-01-01') },
      4: { iters: 0, startDate: new Date('9999-01-01'), endDate: new Date('1970-01-01') },
    };

    for (const pi of pis) {
      for (const iter of pi.iterations || []) {
        if (iter.is_ip_iteration) continue;
        const q = getQuarterFromDate(iter.start_date);
        qMap[q].iters += 1;
        const s = new Date(iter.start_date);
        const e = new Date(iter.end_date);
        if (s < qMap[q].startDate) qMap[q].startDate = s;
        if (e > qMap[q].endDate) qMap[q].endDate = e;
      }
    }

    const year = fiscalYears.find((y) => y.id === selectedYearId)?.year ?? new Date().getFullYear();

    return [1, 2, 3, 4].map((q) => {
      const { iters, startDate, endDate } = qMap[q];
      let status: QuarterStatus = 'future';
      if (iters > 0) {
        if (endDate < today) status = 'past';
        else if (startDate <= today && today <= endDate) status = 'current';
        else status = 'future';
      }
      return {
        label: `Q${q} ${year}`,
        iters,
        status,
        startDate,
        endDate,
      };
    });
  }, [pis, selectedYearId, fiscalYears]);

  const totalIterations = useMemo(
    () => quarters.reduce((s, q) => s + q.iters, 0),
    [quarters]
  );

  // ── Baseline per item per quarter ───────────────────────────────────────────
  function calcBaseline(total: number, qIdx: number): number {
    if (totalIterations === 0) return 0;
    return Math.round((total * quarters[qIdx]?.iters) / totalIterations);
  }

  // ── Strategic committed & forecast per quarter ──────────────────────────────
  const strategicByQuarter: (number | null)[] = useMemo(() => {
    if (!features.length || !quarters.length) return [null, null, null, null];

    // Sum feature quarterly_allocations → convert ed → KEUR using total_cost_keur / net_sizing_ed
    // Simpler approach: sum total_cost_keur for features with allocation in that quarter
    const result: (number | null)[] = [null, null, null, null];

    [1, 2, 3, 4].forEach((q, idx) => {
      const qStatus = quarters[idx]?.status;
      if (!qStatus) return;

      if (qStatus === 'past' || qStatus === 'current') {
        // Committed: sum keur allocated by quarter from features
        let total = 0;
        for (const f of features) {
          for (const qa of f.quarterly_allocations || []) {
            if (qa.quarter === q) {
              // Convert ed to keur: (allocated_ed / net_sizing_ed) * total_cost_keur
              const ratio = f.net_sizing_ed > 0 ? qa.allocated_ed / f.net_sizing_ed : 0;
              total += ratio * (f.total_cost_keur || 0);
            }
          }
        }
        result[idx] = Math.round(total);
      } else {
        // Forecast: redistribute remaining budget by iteration ratio
        const totalBudget = (hierarchy?.product_budgets || []).reduce(
          (s, pb) => s + (pb.allocated_amount || 0),
          0
        );
        // sum committed quarters
        let committed = 0;
        [1, 2, 3, 4].forEach((_qNum, cidx) => {
          if (quarters[cidx]?.status !== 'future' && result[cidx] != null) {
            committed += result[cidx] as number;
          }
        });
        const remaining = Math.max(0, totalBudget - committed);
        const futureIters = quarters
          .filter((_, fi) => quarters[fi]?.status === 'future')
          .reduce((s, qq) => s + qq.iters, 0);
        if (futureIters > 0 && quarters[idx]?.iters) {
          result[idx] = Math.round((remaining * quarters[idx].iters) / futureIters);
        } else {
          result[idx] = null;
        }
      }
    });

    return result;
  }, [features, quarters, hierarchy]);

  // ── Planned consumption per quarter ─────────────────────────────────────────
  const plannedByQuarter: (number | null)[] = useMemo(() => {
    if (!planningItems.length || !quarters.length || !globalSettings) {
      return [null, null, null, null];
    }
    const unitCost: number = globalSettings.train_unit_cost_keur || 85;

    const result: (number | null)[] = [null, null, null, null];
    [0, 1, 2, 3].forEach((idx) => {
      if (quarters[idx]?.iters === 0) return;
      // find PIs that fall in this quarter by checking their iterations
      const pisInQuarter = pis.filter((pi) =>
        (pi.iterations || []).some(
          (iter: any) => !iter.is_ip_iteration && getQuarterFromDate(iter.start_date) === (idx + 1)
        )
      );
      const piIds = new Set(pisInQuarter.map((p) => p.id));

      let total = 0;
      let hasData = false;
      for (const item of planningItems) {
        if (piIds.has(item.pi_id)) {
          const effort =
            (Number(item.dev_effort) || 0) +
            (Number(item.pd_effort) || 0) +
            (Number(item.qa_effort) || 0);
          total += effort * unitCost;
          hasData = true;
        }
      }
      result[idx] = hasData ? Math.round(total) : null;
    });
    return result;
  }, [planningItems, quarters, pis, globalSettings]);

  // ── Actual consumption per quarter (from consumed_amount on budget lines) ───
  const actualByQuarter: (number | null)[] = useMemo(() => {
    if (!hierarchy || !quarters.length) return [null, null, null, null];

    const totalActual = (hierarchy.product_budgets || []).reduce(
      (s, pb) => s + (pb.consumed_amount || 0),
      0
    );

    // Spread actual proportionally across past + current quarters by iteration ratio
    const result: (number | null)[] = [null, null, null, null];
    const committedIters = quarters
      .filter((q) => q.status !== 'future')
      .reduce((s, q) => s + q.iters, 0);

    [0, 1, 2, 3].forEach((idx) => {
      const q = quarters[idx];
      if (!q || q.status === 'future' || q.iters === 0) return;
      result[idx] =
        committedIters > 0
          ? Math.round((totalActual * q.iters) / committedIters)
          : null;
    });
    return result;
  }, [hierarchy, quarters]);

  // ── Summary card values ──────────────────────────────────────────────────────
  const summaryCards = useMemo(() => {
    const totalBudget =
      (hierarchy?.product_budgets || []).reduce((s, pb) => s + (pb.allocated_amount || 0), 0) +
      trainLines.reduce((s, tl) => s + tl.allocated_amount, 0);

    const currentQIdx = quarters.findIndex((q) => q.status === 'current');
    const currentQIters = currentQIdx >= 0 ? quarters[currentQIdx].iters : 0;

    const baselineCurrent =
      currentQIdx >= 0 && totalIterations > 0
        ? Math.round((totalBudget * currentQIters) / totalIterations)
        : 0;

    const strategicCurrent =
      currentQIdx >= 0 && strategicByQuarter[currentQIdx] != null
        ? (strategicByQuarter[currentQIdx] as number)
        : 0;

    const plannedCurrent =
      currentQIdx >= 0 && plannedByQuarter[currentQIdx] != null
        ? (plannedByQuarter[currentQIdx] as number)
        : 0;

    const actualCurrent =
      currentQIdx >= 0 && actualByQuarter[currentQIdx] != null
        ? (actualByQuarter[currentQIdx] as number)
        : 0;

    const currentQ = currentQIdx >= 0 ? quarters[currentQIdx] : null;

    return {
      totalBudget,
      baselineCurrent,
      baselineLabel: currentQ ? `${currentQ.iters} iter of ${totalIterations} total` : '',
      currentQLabel: currentQ ? currentQ.label : '',
      strategicCurrent,
      plannedCurrent,
      actualCurrent,
    };
  }, [hierarchy, trainLines, quarters, totalIterations, strategicByQuarter, plannedByQuarter, actualByQuarter]);

  // ── Product colour map ───────────────────────────────────────────────────────
  const productColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    (hierarchy?.product_budgets || []).forEach((pb, idx) => {
      map[pb.product.id] = PRODUCT_COLORS[idx % PRODUCT_COLORS.length];
    });
    return map;
  }, [hierarchy]);

  return {
    // Data
    fiscalYears,
    selectedYearId,
    setSelectedYearId,
    hierarchy,
    trainLines,
    quarters,
    totalIterations,
    // Calculations
    calcBaseline,
    strategicByQuarter,
    plannedByQuarter,
    actualByQuarter,
    summaryCards,
    productColorMap,
    // State
    isLoading,
    error,
  };
}
