/**
 * Reseed template libraries: delete all clause and section templates, then seed with fresh data.
 * Clause template content is stored as Lexical JSON (rich text). Section templates reference clause IDs.
 *
 * Run from project root: npx ts-node scripts/reseedTemplates.ts
 * Or: npm run seed:reseed
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { ClauseTemplate } from '../models/ClauseTemplate';
import { SectionTemplate } from '../models/SectionTemplate';
import { ensureClauseTemplatesSeeded } from '../utils/seedClauseTemplates';
import { ensureSectionTemplatesSeeded } from '../utils/seedSectionTemplates';

dotenv.config();

const connectionString = `mongodb+srv://${process.env.USER_NAME}:${encodeURIComponent(process.env.PASSWORD!)}@cluster0.dwfddsb.mongodb.net/solar?retryWrites=true&w=majority`;

async function reseedTemplates(): Promise<void> {
  await mongoose.connect(connectionString);
  console.log('Connected to database');

  try {
    const clauseDeleted = await ClauseTemplate.deleteMany({});
    const sectionDeleted = await SectionTemplate.deleteMany({});
    console.log(`Deleted ${clauseDeleted.deletedCount} clause templates and ${sectionDeleted.deletedCount} section templates`);

    await ensureClauseTemplatesSeeded();
    console.log('Clause templates seeded (content stored as Lexical JSON)');

    await ensureSectionTemplatesSeeded();
    console.log('Section templates seeded');
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

reseedTemplates().catch((err) => {
  console.error('Reseed failed:', err);
  process.exit(1);
});
