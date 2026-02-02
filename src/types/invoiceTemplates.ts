export interface InvoiceTemplate {
  id: string;
  name: string;
  headerBg: string;
  headerText: string;
  accentColor: string;
  tableHeaderBg: string;
  tableHeaderText: string;
  footerBg: string;
  footerText: string;
}

export const invoiceTemplates: InvoiceTemplate[] = [
  {
    id: 'teal-navy',
    name: 'Teal Navy (Default)',
    headerBg: 'linear-gradient(135deg, hsl(195, 75%, 22%) 0%, hsl(195, 65%, 28%) 100%)',
    headerText: '#ffffff',
    accentColor: 'hsl(185, 50%, 65%)',
    tableHeaderBg: 'hsl(185, 45%, 50%)',
    tableHeaderText: '#ffffff',
    footerBg: 'linear-gradient(135deg, hsl(195, 75%, 22%) 0%, hsl(195, 65%, 28%) 100%)',
    footerText: '#ffffff',
  },
  {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    headerBg: 'linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 100%)',
    headerText: '#ffffff',
    accentColor: '#64b5f6',
    tableHeaderBg: '#3d5a80',
    tableHeaderText: '#ffffff',
    footerBg: 'linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 100%)',
    footerText: '#ffffff',
  },
  {
    id: 'forest-green',
    name: 'Forest Green',
    headerBg: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)',
    headerText: '#ffffff',
    accentColor: '#95d5b2',
    tableHeaderBg: '#40916c',
    tableHeaderText: '#ffffff',
    footerBg: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)',
    footerText: '#ffffff',
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    headerBg: 'linear-gradient(135deg, #4a1259 0%, #6b2d7b 100%)',
    headerText: '#ffffff',
    accentColor: '#ce93d8',
    tableHeaderBg: '#7b1fa2',
    tableHeaderText: '#ffffff',
    footerBg: 'linear-gradient(135deg, #4a1259 0%, #6b2d7b 100%)',
    footerText: '#ffffff',
  },
  {
    id: 'sunset-orange',
    name: 'Sunset Orange',
    headerBg: 'linear-gradient(135deg, #bf360c 0%, #e64a19 100%)',
    headerText: '#ffffff',
    accentColor: '#ffab91',
    tableHeaderBg: '#f4511e',
    tableHeaderText: '#ffffff',
    footerBg: 'linear-gradient(135deg, #bf360c 0%, #e64a19 100%)',
    footerText: '#ffffff',
  },
  {
    id: 'charcoal-gold',
    name: 'Charcoal Gold',
    headerBg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    headerText: '#ffd700',
    accentColor: '#ffd700',
    tableHeaderBg: '#0f3460',
    tableHeaderText: '#ffd700',
    footerBg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    footerText: '#ffd700',
  },
  {
    id: 'clean-minimal',
    name: 'Clean Minimal',
    headerBg: '#ffffff',
    headerText: '#1a1a1a',
    accentColor: '#4a90a4',
    tableHeaderBg: '#f5f5f5',
    tableHeaderText: '#1a1a1a',
    footerBg: '#f5f5f5',
    footerText: '#1a1a1a',
  },
  {
    id: 'maroon-classic',
    name: 'Maroon Classic',
    headerBg: 'linear-gradient(135deg, #5c1a1a 0%, #7d2a2a 100%)',
    headerText: '#ffffff',
    accentColor: '#ef9a9a',
    tableHeaderBg: '#8d3c3c',
    tableHeaderText: '#ffffff',
    footerBg: 'linear-gradient(135deg, #5c1a1a 0%, #7d2a2a 100%)',
    footerText: '#ffffff',
  },
];
