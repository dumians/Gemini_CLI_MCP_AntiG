export interface DomainStyle {
  primary: string;
  accent: string;
  bg: string;
  border: string;
  glow: string;
  name: string;
}

export const DOMAIN_THEME: { [key: string]: DomainStyle } = {
  Finance: {
    primary: '#f97316', // orange-500
    accent: '#fb923c',
    bg: 'rgba(249, 115, 22, 0.12)',
    border: 'rgba(249, 115, 22, 0.45)',
    glow: 'rgba(249, 115, 22, 0.35)',
    name: 'Finance (Oracle)'
  },
  'Oracle ERP': {
    primary: '#f97316',
    accent: '#fb923c',
    bg: 'rgba(249, 115, 22, 0.12)',
    border: 'rgba(249, 115, 22, 0.45)',
    glow: 'rgba(249, 115, 22, 0.35)',
    name: 'Oracle ERP'
  },
  Sales: {
    primary: '#3b82f6', // blue-500
    accent: '#60a5fa',
    bg: 'rgba(59, 130, 246, 0.12)',
    border: 'rgba(59, 130, 246, 0.45)',
    glow: 'rgba(59, 130, 246, 0.35)',
    name: 'Sales (Spanner)'
  },
  'Spanner Retail': {
    primary: '#3b82f6',
    accent: '#60a5fa',
    bg: 'rgba(59, 130, 246, 0.12)',
    border: 'rgba(59, 130, 246, 0.45)',
    glow: 'rgba(59, 130, 246, 0.35)',
    name: 'Spanner Retail'
  },
  Analytics: {
    primary: '#8b5cf6', // purple-500
    accent: '#a78bfa',
    bg: 'rgba(139, 92, 246, 0.12)',
    border: 'rgba(139, 92, 246, 0.45)',
    glow: 'rgba(139, 92, 246, 0.35)',
    name: 'Analytics (BigQuery)'
  },
  'BigQuery Analytics': {
    primary: '#8b5cf6',
    accent: '#a78bfa',
    bg: 'rgba(139, 92, 246, 0.12)',
    border: 'rgba(139, 92, 246, 0.45)',
    glow: 'rgba(139, 92, 246, 0.35)',
    name: 'BigQuery Analytics'
  },
  CRM: {
    primary: '#06b6d4', // cyan-500
    accent: '#22d3ee',
    bg: 'rgba(6, 182, 212, 0.12)',
    border: 'rgba(6, 182, 212, 0.45)',
    glow: 'rgba(6, 182, 212, 0.35)',
    name: 'CRM (AlloyDB)'
  },
  'AlloyDB CRM': {
    primary: '#06b6d4',
    accent: '#22d3ee',
    bg: 'rgba(6, 182, 212, 0.12)',
    border: 'rgba(6, 182, 212, 0.45)',
    glow: 'rgba(6, 182, 212, 0.35)',
    name: 'AlloyDB CRM'
  },
  NetSuite: {
    primary: '#10b981', // emerald-500
    accent: '#34d399',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.45)',
    glow: 'rgba(16, 185, 129, 0.35)',
    name: 'NetSuite ERP'
  },
  'NetSuite ERP': {
    primary: '#10b981',
    accent: '#34d399',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.45)',
    glow: 'rgba(16, 185, 129, 0.35)',
    name: 'NetSuite ERP'
  },
  Warehouse: {
    primary: '#f59e0b', // amber-500
    accent: '#fbbf24',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.45)',
    glow: 'rgba(245, 158, 11, 0.35)',
    name: 'Warehouse & Logistics'
  },
  Logistics: {
    primary: '#f59e0b',
    accent: '#fbbf24',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.45)',
    glow: 'rgba(245, 158, 11, 0.35)',
    name: 'Logistics'
  },
  HR: {
    primary: '#ec4899', // pink-500
    accent: '#f472b6',
    bg: 'rgba(236, 72, 153, 0.12)',
    border: 'rgba(236, 72, 153, 0.45)',
    glow: 'rgba(236, 72, 153, 0.35)',
    name: 'Human Resources'
  },
  Catalog: {
    primary: '#6366f1', // indigo-500
    accent: '#818cf8',
    bg: 'rgba(99, 102, 241, 0.12)',
    border: 'rgba(99, 102, 241, 0.45)',
    glow: 'rgba(99, 102, 241, 0.35)',
    name: 'Metadata Catalog'
  },
  'API Domain': {
    primary: '#14b8a6', // teal-500
    accent: '#2dd4bf',
    bg: 'rgba(20, 184, 166, 0.12)',
    border: 'rgba(20, 184, 166, 0.45)',
    glow: 'rgba(20, 184, 166, 0.35)',
    name: 'API Driven'
  },
  Unified: {
    primary: '#a855f7', // purple-500
    accent: '#c084fc',
    bg: 'rgba(168, 85, 247, 0.12)',
    border: 'rgba(168, 85, 247, 0.45)',
    glow: 'rgba(168, 85, 247, 0.35)',
    name: 'Cross-Domain Mesh'
  }
};

export const DEFAULT_STYLE: DomainStyle = {
  primary: '#6366f1',
  accent: '#818cf8',
  bg: 'rgba(99, 102, 241, 0.12)',
  border: 'rgba(99, 102, 241, 0.45)',
  glow: 'rgba(99, 102, 241, 0.35)',
  name: 'General'
};

export function getDomainStyle(domain?: string, sourceId?: string): DomainStyle {
  if (domain && DOMAIN_THEME[domain]) {
    return DOMAIN_THEME[domain];
  }
  
  const normalized = (domain || sourceId || '').toLowerCase();
  
  if (normalized.includes('ora') || normalized.includes('finance') || normalized.includes('jde') || normalized.includes('ebs')) {
    return DOMAIN_THEME['Finance'];
  }
  if (normalized.includes('span') || normalized.includes('sales') || normalized.includes('retail')) {
    return DOMAIN_THEME['Sales'];
  }
  if (normalized.includes('bq') || normalized.includes('bigquery') || normalized.includes('analytic') || normalized.includes('edw')) {
    return DOMAIN_THEME['Analytics'];
  }
  if (normalized.includes('alloy') || normalized.includes('crm') || normalized.includes('postgres') || normalized.includes('siebel')) {
    return DOMAIN_THEME['CRM'];
  }
  if (normalized.includes('netsuite') || normalized.includes('suite')) {
    return DOMAIN_THEME['NetSuite'];
  }
  if (normalized.includes('warehouse') || normalized.includes('logistics') || normalized.includes('supply')) {
    return DOMAIN_THEME['Warehouse'];
  }
  if (normalized.includes('hr') || normalized.includes('employee')) {
    return DOMAIN_THEME['HR'];
  }
  if (normalized.includes('catalog') || normalized.includes('meta')) {
    return DOMAIN_THEME['Catalog'];
  }
  if (normalized.includes('api') || normalized.includes('flexcube') || normalized.includes('rest')) {
    return DOMAIN_THEME['API Domain'];
  }
  
  return DOMAIN_THEME['Unified'] || DEFAULT_STYLE;
}

/**
 * Renders an ultra-clean, modern glassmorphic stadium node for Sources
 */
export function drawSourceNodeCanvas(
  node: any,
  ctx: CanvasRenderingContext2D,
  globalScale: number,
  isSelected: boolean,
  isHovered: boolean,
  isDimmed: boolean
) {
  const domainStyle = getDomainStyle(node.domain || node.properties?.domain, node.id);
  const color = domainStyle.primary;
  
  const width = 114;
  const height = 36;
  const radius = 8;
  
  ctx.save();
  
  if (isDimmed) {
    ctx.globalAlpha = 0.2;
  }

  // 1. Glowing outer halo when selected or hovered
  if (isSelected || isHovered) {
    ctx.shadowColor = color;
    ctx.shadowBlur = isSelected ? 18 : 10;
    ctx.strokeStyle = isSelected ? '#ffffff' : color;
    ctx.lineWidth = isSelected ? 2.5 : 1.8;
    ctx.beginPath();
    ctx.roundRect(node.x - width / 2 - 3, node.y - height / 2 - 3, width + 6, height + 6, radius + 3);
    ctx.stroke();
    ctx.shadowBlur = 0; // reset shadow
  }

  // 2. Base Pill Fill (Deep Dark Glassmorphism)
  const grad = ctx.createLinearGradient(node.x - width / 2, node.y - height / 2, node.x + width / 2, node.y + height / 2);
  grad.addColorStop(0, isSelected ? 'rgba(30, 41, 59, 0.96)' : 'rgba(15, 23, 42, 0.92)');
  grad.addColorStop(1, isSelected ? 'rgba(15, 23, 42, 0.98)' : 'rgba(2, 6, 23, 0.95)');
  
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(node.x - width / 2, node.y - height / 2, width, height, radius);
  ctx.fill();

  // 3. Crisp Border
  ctx.strokeStyle = isSelected ? '#60a5fa' : isHovered ? color : domainStyle.border;
  ctx.lineWidth = isSelected ? 2 : 1.2;
  ctx.stroke();

  // 4. Left Accent Badge Strip
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(node.x - width / 2, node.y - height / 2, 7, height, [radius, 0, 0, radius]);
  ctx.fill();

  // 5. Database Icon Glyph (Circle indicator on left)
  ctx.fillStyle = isSelected ? '#ffffff' : color;
  ctx.beginPath();
  ctx.arc(node.x - width / 2 + 18, node.y - 1, 5, 0, Math.PI * 2);
  ctx.fill();
  
  // Inner dot for cyber look
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(node.x - width / 2 + 18, node.y - 1, 2, 0, Math.PI * 2);
  ctx.fill();

  // 6. Label Typography (Crisp text)
  const label = node.label || node.name || node.id;
  const contentX = node.x + 6;
  
  // Header: Source Name
  ctx.font = 'bold 9.5px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  
  let displayLabel = label;
  if (ctx.measureText(displayLabel).width > 72) {
    while (displayLabel.length > 3 && ctx.measureText(displayLabel + '..').width > 72) {
      displayLabel = displayLabel.slice(0, -1);
    }
    displayLabel += '..';
  }
  ctx.fillText(displayLabel, contentX, node.y - 5);

  // Subtitle: Source Domain / Protocol Tag
  ctx.font = 'bold 6.5px Inter, monospace';
  ctx.fillStyle = isSelected ? '#93c5fd' : domainStyle.accent;
  const subText = (domainStyle.name || 'SOURCE').toUpperCase();
  ctx.fillText(subText.length > 16 ? subText.slice(0, 14) + '..' : subText, contentX, node.y + 7);

  ctx.restore();
}

/**
 * Renders an ultra-clean, modern glassmorphic stadium node for Tables & Graphs
 */
export function drawEntityNodeCanvas(
  node: any,
  ctx: CanvasRenderingContext2D,
  globalScale: number,
  isSelected: boolean,
  isHovered: boolean,
  isDimmed: boolean
) {
  const domainStyle = getDomainStyle(node.domain || node.properties?.domain, node.sourceId || node.id);
  const isGraph = node.type === 'graph' || node.type === 'PROPERTY_GRAPH' || node.group === 'graph';
  const color = isGraph ? '#ec4899' : domainStyle.primary;
  
  const width = 92;
  const height = 26;
  const radius = 6;
  
  ctx.save();
  
  if (isDimmed) {
    ctx.globalAlpha = 0.2;
  }

  // 1. Glow highlight when selected/hovered
  if (isSelected || isHovered) {
    ctx.shadowColor = color;
    ctx.shadowBlur = isSelected ? 14 : 8;
    ctx.strokeStyle = isSelected ? '#38bdf8' : color;
    ctx.lineWidth = isSelected ? 2 : 1.5;
    ctx.beginPath();
    ctx.roundRect(node.x - width / 2 - 2, node.y - height / 2 - 2, width + 4, height + 4, radius + 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // 2. Base Pill Fill
  ctx.fillStyle = isSelected ? 'rgba(15, 23, 42, 0.96)' : 'rgba(15, 23, 42, 0.88)';
  ctx.beginPath();
  ctx.roundRect(node.x - width / 2, node.y - height / 2, width, height, radius);
  ctx.fill();

  // 3. Border Outline
  ctx.strokeStyle = isSelected ? '#38bdf8' : isHovered ? color : 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = isSelected ? 1.8 : 1.0;
  ctx.stroke();

  // 4. Left Side Accent Strip
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(node.x - width / 2, node.y - height / 2, 4.5, height, [radius, 0, 0, radius]);
  ctx.fill();

  // 5. Label Typography
  const fullLabel = node.label || node.name || node.id;
  const displayName = fullLabel.includes('.') ? fullLabel.split('.').pop() : fullLabel;
  const textX = node.x + 2;

  // Primary Table Label
  ctx.font = 'bold 8px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f8fafc';
  
  let labelToDraw = displayName;
  const maxLabelWidth = width - 16;
  if (ctx.measureText(labelToDraw).width > maxLabelWidth) {
    while (labelToDraw.length > 3 && ctx.measureText(labelToDraw + '..').width > maxLabelWidth) {
      labelToDraw = labelToDraw.slice(0, -1);
    }
    labelToDraw += '..';
  }
  ctx.fillText(labelToDraw, textX, node.y - 3);

  // Subtitle: Type / Attribute count tag
  ctx.font = 'bold 5.5px Inter, monospace';
  ctx.fillStyle = isGraph ? '#f472b6' : isSelected ? '#7dd3fc' : '#94a3b8';
  const typeTag = isGraph ? 'GRAPH' : (node.attributesCount ? `${node.attributesCount} COLS` : 'TABLE');
  ctx.fillText(typeTag, textX, node.y + 6);

  ctx.restore();
}

/**
 * Lineage / Contract tier node styling
 */
export function drawTierNodeCanvas(
  node: any,
  ctx: CanvasRenderingContext2D,
  globalScale: number,
  isSelected: boolean,
  isHovered: boolean,
  isDimmed: boolean,
  tierColor: string,
  tierTitle: string
) {
  const width = 100;
  const height = 30;
  const radius = 6;
  
  ctx.save();
  
  if (isDimmed) {
    ctx.globalAlpha = 0.2;
  }

  // Glowing halo
  if (isSelected || isHovered) {
    ctx.shadowColor = tierColor;
    ctx.shadowBlur = isSelected ? 16 : 10;
    ctx.strokeStyle = isSelected ? '#ffffff' : tierColor;
    ctx.lineWidth = isSelected ? 2.2 : 1.6;
    ctx.beginPath();
    ctx.roundRect(node.x - width / 2 - 2, node.y - height / 2 - 2, width + 4, height + 4, radius + 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Base Fill
  ctx.fillStyle = isSelected ? 'rgba(15, 23, 42, 0.96)' : 'rgba(15, 23, 42, 0.88)';
  ctx.beginPath();
  ctx.roundRect(node.x - width / 2, node.y - height / 2, width, height, radius);
  ctx.fill();

  // Border
  ctx.strokeStyle = isSelected ? '#ffffff' : isHovered ? tierColor : 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Top Accent Bar
  ctx.fillStyle = tierColor;
  ctx.beginPath();
  ctx.roundRect(node.x - width / 2, node.y - height / 2, width, 3.5, [radius, radius, 0, 0]);
  ctx.fill();

  // Label
  const label = node.label || node.name || node.id;
  ctx.font = 'bold 8px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';

  let displayLabel = label;
  if (ctx.measureText(displayLabel).width > width - 12) {
    while (displayLabel.length > 3 && ctx.measureText(displayLabel + '..').width > width - 12) {
      displayLabel = displayLabel.slice(0, -1);
    }
    displayLabel += '..';
  }
  ctx.fillText(displayLabel, node.x, node.y - 2);

  // Subtitle
  ctx.font = 'bold 6px Inter, monospace';
  ctx.fillStyle = isSelected ? '#93c5fd' : tierColor;
  ctx.fillText(tierTitle.toUpperCase(), node.x, node.y + 7);

  ctx.restore();
}
