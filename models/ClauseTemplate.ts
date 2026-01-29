import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ClauseTemplateAttrs {
  templateId: string; // e.g. "c1"
  name: string;
  description: string;
  content: string;
  category: string;
}

export interface ClauseTemplateDoc extends Document, ClauseTemplateAttrs {
  createdAt: Date;
  updatedAt: Date;
}

const ClauseTemplateSchema = new Schema<ClauseTemplateDoc>(
  {
    templateId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    category: { type: String, required: true, index: true, trim: true },
  },
  { timestamps: true }
);

ClauseTemplateSchema.index({ name: 'text', description: 'text', content: 'text', category: 'text' });

export const ClauseTemplate: Model<ClauseTemplateDoc> =
  mongoose.models.ClauseTemplate
    ? (mongoose.models.ClauseTemplate as Model<ClauseTemplateDoc>)
    : mongoose.model<ClauseTemplateDoc>('ClauseTemplate', ClauseTemplateSchema);


