/**
 * Reseed template libraries: delete all clause, section, and contract templates, then seed with fresh data.
 * Clause template content is stored as Lexical JSON (rich text). Section templates reference clause IDs.
 *
 * Run from project root: npx ts-node scripts/reseedTemplates.ts
 * Or: npm run seed:reseed
 */
import dotenv from 'dotenv';
import { ClauseTemplate } from '../models/ClauseTemplate';
import { SectionTemplate } from '../models/SectionTemplate';
import { ContractTemplate } from '../models/ContractTemplate';
import { ensureClauseTemplatesSeeded } from '../utils/seedClauseTemplates';
import { ensureSectionTemplatesSeeded } from '../utils/seedSectionTemplates';
import { ensureContractTemplatesSeeded } from '../utils/seedContractTemplates';

dotenv.config();

async function reseedTemplates(): Promise<void> {
  console.log('Connected to PostgreSQL database');

  try {
    const clauseDeleted = await ClauseTemplate.deleteMany({});
    const sectionDeleted = await SectionTemplate.deleteMany({});
    const contractDeleted = await ContractTemplate.deleteMany({});
    console.log(`Deleted ${clauseDeleted.deletedCount} clause templates, ${sectionDeleted.deletedCount} section templates, and ${contractDeleted.deletedCount} contract templates`);

    await ensureClauseTemplatesSeeded();
    console.log('Clause templates seeded (content stored as Lexical JSON)');

    await ensureSectionTemplatesSeeded();
    console.log('Section templates seeded');

    await ensureContractTemplatesSeeded();
    console.log('Contract templates seeded');
  } catch (error) {
    console.error('Reseed failed:', error);
    process.exit(1);
  }
}

reseedTemplates();
