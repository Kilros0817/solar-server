import mongoose, { Document, Model, Schema } from 'mongoose';

export interface SectionTemplateAttrs {
  templateId: string; // e.g. "tc-v1"
  sectionName: string; // e.g. "Terms & Conditions"
  name: string; // version name, e.g. "Standard Terms"
  description: string;
  category: string;
  clauseIds: string[]; // clause template IDs used to build this section (content derived from these)
}

export interface SectionTemplateDoc extends Document, SectionTemplateAttrs {
  createdAt: Date;
  updatedAt: Date;
}

const SectionTemplateSchema = new Schema<SectionTemplateDoc>(
  {
    templateId: { type: String, required: true, unique: true, index: true },
    sectionName: { type: String, required: true, index: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true, index: true, trim: true },
    clauseIds: { type: [String], default: [] },
  },
  { timestamps: true }
);

SectionTemplateSchema.index({ name: 'text', description: 'text', category: 'text', sectionName: 'text' });

export const SectionTemplate: Model<SectionTemplateDoc> =
  mongoose.models.SectionTemplate
    ? (mongoose.models.SectionTemplate as Model<SectionTemplateDoc>)
    : mongoose.model<SectionTemplateDoc>('SectionTemplate', SectionTemplateSchema);
