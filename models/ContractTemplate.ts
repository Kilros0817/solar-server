import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ContractTemplateAttrs {
  templateId: string;
  name: string;
  description: string;
  category: string;
  createdBy: string;
  sectionIds: string[]; // section template IDs (e.g. tc-v1, pp-v1)
}

export interface ContractTemplateDoc extends Document, ContractTemplateAttrs {
  createdAt: Date;
  updatedAt: Date;
}

const ContractTemplateSchema = new Schema<ContractTemplateDoc>(
  {
    templateId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true, index: true, trim: true },
    createdBy: { type: String, required: true, trim: true },
    sectionIds: { type: [String], default: [] },
  },
  { timestamps: true }
);

ContractTemplateSchema.index({ name: 'text', description: 'text', category: 'text' });

export const ContractTemplate: Model<ContractTemplateDoc> =
  mongoose.models.ContractTemplate
    ? (mongoose.models.ContractTemplate as Model<ContractTemplateDoc>)
    : mongoose.model<ContractTemplateDoc>('ContractTemplate', ContractTemplateSchema);
