"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureContractTemplatesSeeded = ensureContractTemplatesSeeded;
const ContractTemplate_1 = require("../models/ContractTemplate");
const seedContractTemplates = [
    {
        templateId: 'service-agreement',
        name: 'Service Agreement',
        description: 'Standard service agreement for professional services',
        category: 'Services',
        createdBy: 'System',
        sectionIds: ['tc-v1', 'pp-v1', 'term-v1', 'ip-v1'],
    },
    {
        templateId: 'nda',
        name: 'Non-Disclosure Agreement',
        description: 'Protect confidential information and trade secrets',
        category: 'Legal',
        createdBy: 'System',
        sectionIds: ['term-v1', 'term-v2'],
    },
    {
        templateId: 'employment',
        name: 'Employment Contract',
        description: 'Comprehensive employment agreement template',
        category: 'HR',
        createdBy: 'System',
        sectionIds: ['tc-v1', 'pp-v1', 'term-v1'],
    },
    {
        templateId: 'saas-agreement',
        name: 'SaaS Agreement',
        description: 'Software as a Service subscription agreement',
        category: 'Technology',
        createdBy: 'System',
        sectionIds: ['tc-v2', 'pp-v2', 'term-v1', 'ip-v3'],
    },
    {
        templateId: 'vendor-agreement',
        name: 'Vendor Agreement',
        description: 'Agreement with suppliers and vendors',
        category: 'Procurement',
        createdBy: 'System',
        sectionIds: ['tc-v1', 'pp-v1', 'term-v1'],
    },
    {
        templateId: 'partnership',
        name: 'Partnership Agreement',
        description: 'Business partnership and collaboration agreement',
        category: 'Business',
        createdBy: 'System',
        sectionIds: ['tc-v2', 'pp-v3', 'term-v1', 'ip-v2'],
    },
    {
        templateId: 'consulting',
        name: 'Consulting Agreement',
        description: 'Independent contractor and consulting services',
        category: 'Services',
        createdBy: 'System',
        sectionIds: ['tc-v3', 'pp-v1', 'term-v2'],
    },
    {
        templateId: 'lease',
        name: 'Commercial Lease',
        description: 'Commercial property lease agreement',
        category: 'Real Estate',
        createdBy: 'System',
        sectionIds: ['tc-v1', 'pp-v1', 'term-v1'],
    },
    {
        templateId: 'license',
        name: 'License Agreement',
        description: 'Software or IP licensing agreement',
        category: 'Technology',
        createdBy: 'System',
        sectionIds: ['tc-v2', 'pp-v2', 'ip-v3'],
    },
];
async function ensureContractTemplatesSeeded() {
    if (seedContractTemplates.length === 0)
        return;
    await ContractTemplate_1.ContractTemplate.bulkWrite(seedContractTemplates.map((t) => ({
        updateOne: {
            filter: { templateId: t.templateId },
            update: {
                $set: {
                    name: t.name,
                    description: t.description,
                    category: t.category,
                    createdBy: t.createdBy,
                    sectionIds: t.sectionIds,
                },
            },
            upsert: true,
        },
    })));
}
