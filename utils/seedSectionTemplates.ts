import { SectionTemplate, SectionTemplateAttrs } from '../models/SectionTemplate';

const seedSectionTemplates: SectionTemplateAttrs[] = [
  // Terms & Conditions
  {
    templateId: 'tc-v1',
    sectionName: 'Terms & Conditions',
    name: 'Standard Terms',
    description: 'General terms for standard business agreements',
    category: 'General',
    clauseIds: ['c4', 'c8', 'c11', 'c12', 'c13'],
  },
  {
    templateId: 'tc-v2',
    sectionName: 'Terms & Conditions',
    name: 'Enterprise Terms',
    description: 'Comprehensive terms for enterprise-level deals',
    category: 'Enterprise',
    clauseIds: ['c1', 'c4', 'c8', 'c9', 'c11'],
  },
  {
    templateId: 'tc-v3',
    sectionName: 'Terms & Conditions',
    name: 'Simplified Terms',
    description: 'Streamlined terms for quick agreements',
    category: 'SMB',
    clauseIds: ['c4', 'c12', 'c13', 'c14'],
  },
  // Pricing & Payment Terms
  {
    templateId: 'pp-v1',
    sectionName: 'Pricing & Payment Terms',
    name: 'Fixed Price',
    description: 'Single upfront or milestone-based payments',
    category: 'Pricing',
    clauseIds: ['c4', 'c12'],
  },
  {
    templateId: 'pp-v2',
    sectionName: 'Pricing & Payment Terms',
    name: 'Subscription Model',
    description: 'Recurring payments with auto-renewal',
    category: 'Pricing',
    clauseIds: ['c12', 'c14'],
  },
  {
    templateId: 'pp-v3',
    sectionName: 'Pricing & Payment Terms',
    name: 'Performance-Based',
    description: 'Variable pricing tied to outcomes',
    category: 'Pricing',
    clauseIds: ['c4', 'c9'],
  },
  // Termination Clauses
  {
    templateId: 'term-v1',
    sectionName: 'Termination Clauses',
    name: 'Standard Termination',
    description: 'Balanced termination rights',
    category: 'Legal',
    clauseIds: ['c11', 'c12', 'c15'],
  },
  {
    templateId: 'term-v2',
    sectionName: 'Termination Clauses',
    name: 'Customer-Favorable',
    description: 'Enhanced customer exit rights',
    category: 'Legal',
    clauseIds: ['c11', 'c12'],
  },
  {
    templateId: 'term-v3',
    sectionName: 'Termination Clauses',
    name: 'Vendor-Favorable',
    description: 'Restrictive termination conditions',
    category: 'Legal',
    clauseIds: ['c11', 'c12', 'c15'],
  },
  // Intellectual Property
  {
    templateId: 'ip-v1',
    sectionName: 'Intellectual Property',
    name: 'Customer Ownership',
    description: 'Customer owns all deliverables',
    category: 'Legal',
    clauseIds: ['c6', 'c8'],
  },
  {
    templateId: 'ip-v2',
    sectionName: 'Intellectual Property',
    name: 'Shared IP Rights',
    description: 'Joint ownership of developed IP',
    category: 'Legal',
    clauseIds: ['c6', 'c8', 'c12'],
  },
  {
    templateId: 'ip-v3',
    sectionName: 'Intellectual Property',
    name: 'License Model',
    description: 'Vendor retains IP, customer gets license',
    category: 'Legal',
    clauseIds: ['c6', 'c8'],
  },
  // Data Privacy & Security
  {
    templateId: 'dps-v1',
    sectionName: 'Data Privacy & Security',
    name: 'Standard Security',
    description: 'Basic security and privacy requirements',
    category: 'Compliance',
    clauseIds: ['c7', 'c10'],
  },
  {
    templateId: 'dps-v2',
    sectionName: 'Data Privacy & Security',
    name: 'Enhanced Security',
    description: 'Comprehensive security framework',
    category: 'Compliance',
    clauseIds: ['c7', 'c10', 'c2'],
  },
  {
    templateId: 'dps-v3',
    sectionName: 'Data Privacy & Security',
    name: 'Zero Trust Model',
    description: 'Advanced zero-trust security architecture',
    category: 'Compliance',
    clauseIds: ['c7', 'c10', 'c2'],
  },
  // Service Level Agreements
  {
    templateId: 'sla-v1',
    sectionName: 'Service Level Agreements',
    name: 'Basic SLA',
    description: 'Standard availability and support',
    category: 'Service',
    clauseIds: ['c4', 'c7'],
  },
  {
    templateId: 'sla-v2',
    sectionName: 'Service Level Agreements',
    name: 'Enterprise SLA',
    description: 'Premium service levels with 24/7 support',
    category: 'Service',
    clauseIds: ['c4', 'c7', 'c8'],
  },
  {
    templateId: 'sla-v3',
    sectionName: 'Service Level Agreements',
    name: 'Mission Critical',
    description: 'Maximum uptime and rapid response',
    category: 'Service',
    clauseIds: ['c4', 'c7', 'c8', 'c9'],
  },
  // Liability & Insurance
  {
    templateId: 'li-v1',
    sectionName: 'Liability & Insurance',
    name: 'Balanced Liability',
    description: 'Mutual liability caps and limitations',
    category: 'Legal',
    clauseIds: ['c4', 'c9'],
  },
  {
    templateId: 'li-v2',
    sectionName: 'Liability & Insurance',
    name: 'Limited Liability',
    description: 'Vendor-favorable liability limitations',
    category: 'Legal',
    clauseIds: ['c4', 'c9'],
  },
  {
    templateId: 'li-v3',
    sectionName: 'Liability & Insurance',
    name: 'Uncapped Liability',
    description: 'No caps for certain breach types',
    category: 'Legal',
    clauseIds: ['c9', 'c4'],
  },
];

export async function ensureSectionTemplatesSeeded(): Promise<void> {
  if (seedSectionTemplates.length === 0) return;

  await SectionTemplate.bulkWrite(
    seedSectionTemplates.map((t) => ({
      updateOne: {
        filter: { templateId: t.templateId },
        update: {
          $set: {
            sectionName: t.sectionName,
            name: t.name,
            description: t.description,
            category: t.category,
            clauseIds: t.clauseIds,
          },
        },
        upsert: true,
      },
    }))
  );
}
