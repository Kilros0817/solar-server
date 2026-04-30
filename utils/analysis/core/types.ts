// ─── Subgraph query ───────────────────────────────────────────────────────────

export const HISTORIES_QUERY = `{
  docHistories(orderBy: date) {
    type
    docStatus
    date
    document {
      id
    }
  }
  sectionHistories(orderBy: date) {
    date
    sectionStatus
    type
    section {
      doc {
        id
      }
      id
      divisionLeader {
        firstName
        lastName
        dcategory
      }
    }
  }
  clauseHistories(orderBy: date) {
    type
    date
    clauseStatus
    clause {
      id
      section {
        id
      }
      divisionMember {
        firstName
        lastName
      }
    }
  }
}`;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DocHistory {
  type: number;
  docStatus: number;
  date: string;
  document: { id: string };
}

export interface SectionHistory {
  date: string;
  sectionStatus: number;
  type: number;
  section: {
    id: string;
    doc: { id: string };
    divisionLeader: {
      firstName: string;
      lastName: string;
      dcategory: number;
    } | null;
  };
}

export interface ClauseHistory {
  type: number;
  date: string;
  clauseStatus: number;
  clause: {
    id: string;
    section: { id: string };
    divisionMember: {
      firstName: string;
      lastName: string;
    } | null;
  };
}

export interface SubgraphData {
  docHistories: DocHistory[];
  sectionHistories: SectionHistory[];
  clauseHistories: ClauseHistory[];
}

// Division mapping
const DIVISION_MAP: Record<number, string> = {
  0: 'NoDivision',
  1: 'Legal',
  2: 'ProjectManagement',
  3: 'Preconstruction',
  4: 'Estimating',
  5: 'Finance',
  6: 'Accounting',
  7: 'RiskManagement',
  8: 'Insurance',
  9: 'Safety',
};

export function toDiv(dcategory: number): string {
  return DIVISION_MAP[dcategory] ?? 'NoDivision';
}

// Division stats interface
export interface DivisionStats {
  section_count: number;
  avg_assign_to_request: number | null;
  avg_request_to_approve: number | null;
  total_rejects: number;
  total_reassigns: number;
  bottleneck_stage: string | null;
}

// Report type
export interface AnalysisReport {
  summary: {
    total_workflows: number;
    completed_workflows: number;
    completion_rate_percent: number;
    average_cycle_time: number | null;
    time_unit: string;
  };
  throughput_by_week: Record<string, number>;
  division_rollup: Record<string, DivisionStats>;
  documents: any[]; // Simplified for now
}