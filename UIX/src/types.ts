export type View = 'dashboard' | 'query-analysis' | 'spanner-detail' | 'bigquery-detail' | 'marketplace' | 'governance' | 'governance-detail' | 'oracle-detail' | 'alloy-detail' | 'cross-domain-inventory' | 'data-domains';

export interface Policy {
  id: string;
  name: string;
  status: 'Active' | 'Restricted' | 'Draft';
  domain: string;
  lastUpdated: string;
}
