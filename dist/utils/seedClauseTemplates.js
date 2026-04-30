"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureClauseTemplatesSeeded = ensureClauseTemplatesSeeded;
const ClauseTemplate_1 = require("../models/ClauseTemplate");
const lexicalJson_1 = require("./lexicalJson");
const seedClauseTemplates = [
    {
        templateId: 'c1',
        name: 'Force Majeure',
        description: 'Protection for unforeseeable circumstances',
        content: 'Neither party shall be liable for any failure or delay in performing its obligations under this Agreement where such failure or delay results from any cause beyond the reasonable control of that party.',
        category: 'Risk Management',
    },
    {
        templateId: 'c2',
        name: 'Confidentiality Obligation',
        description: 'Standard confidentiality requirements',
        content: 'Each party agrees to maintain the confidentiality of all Confidential Information disclosed by the other party and to use such information solely for the purposes of this Agreement.',
        category: 'Legal',
    },
    {
        templateId: 'c3',
        name: 'Non-Solicitation',
        description: 'Prevent employee poaching',
        content: 'During the term of this Agreement and for a period of twelve (12) months thereafter, neither party shall directly or indirectly solicit for employment any employee of the other party.',
        category: 'Legal',
    },
    {
        templateId: 'c4',
        name: 'Limitation of Liability',
        description: 'Cap on liability exposure',
        content: "In no event shall either party's aggregate liability exceed the total amount paid under this Agreement in the twelve (12) months preceding the claim.",
        category: 'Risk Management',
    },
    {
        templateId: 'c5',
        name: 'Governing Law',
        description: 'Jurisdiction and applicable law',
        content: 'This Agreement shall be governed by and construed in accordance with the laws of [Jurisdiction], without regard to its conflict of law provisions.',
        category: 'Legal',
    },
    {
        templateId: 'c6',
        name: 'Assignment Rights',
        description: 'Control over contract assignment',
        content: 'Neither party may assign this Agreement without the prior written consent of the other party, except in the case of a merger or acquisition.',
        category: 'Legal',
    },
    {
        templateId: 'c7',
        name: 'Audit Rights',
        description: 'Right to audit compliance',
        content: "Customer shall have the right, upon reasonable notice, to audit Vendor's compliance with the terms of this Agreement, including security and data protection measures.",
        category: 'Compliance',
    },
    {
        templateId: 'c8',
        name: 'Warranties & Representations',
        description: 'Standard business warranties',
        content: 'Each party represents and warrants that it has full power and authority to enter into this Agreement and that its performance will not violate any other agreement.',
        category: 'Legal',
    },
    {
        templateId: 'c9',
        name: 'Indemnification',
        description: 'Mutual indemnification provisions',
        content: 'Each party agrees to indemnify and hold harmless the other party from any claims, damages, or expenses arising from its breach of this Agreement or negligent acts.',
        category: 'Risk Management',
    },
    {
        templateId: 'c10',
        name: 'Data Protection',
        description: 'GDPR-compliant data handling',
        content: "Vendor shall process personal data only in accordance with Customer's written instructions and comply with all applicable data protection laws including GDPR.",
        category: 'Compliance',
    },
    {
        templateId: 'c11',
        name: 'Dispute Resolution',
        description: 'Escalation and arbitration process',
        content: 'Any disputes shall first be subject to good-faith negotiation. If unresolved within 30 days, disputes shall be resolved through binding arbitration.',
        category: 'Legal',
    },
    {
        templateId: 'c12',
        name: 'Amendment Process',
        description: 'How to modify the agreement',
        content: 'This Agreement may only be amended by written agreement signed by authorized representatives of both parties.',
        category: 'Legal',
    },
    {
        templateId: 'c13',
        name: 'Severability',
        description: "Invalid provisions don't void contract",
        content: 'If any provision of this Agreement is held to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.',
        category: 'Legal',
    },
    {
        templateId: 'c14',
        name: 'Entire Agreement',
        description: 'Supersedes prior agreements',
        content: 'This Agreement constitutes the entire agreement between the parties and supersedes all prior negotiations, representations, or agreements.',
        category: 'Legal',
    },
    {
        templateId: 'c15',
        name: 'Notice Provisions',
        description: 'How to provide official notices',
        content: 'All notices under this Agreement shall be in writing and sent to the addresses specified herein via email or certified mail.',
        category: 'Administrative',
    },
];
async function ensureClauseTemplatesSeeded() {
    if (seedClauseTemplates.length === 0)
        return;
    await ClauseTemplate_1.ClauseTemplate.bulkWrite(seedClauseTemplates.map((t) => ({
        updateOne: {
            filter: { templateId: t.templateId },
            update: {
                $set: {
                    name: t.name,
                    description: t.description,
                    content: (0, lexicalJson_1.plainTextToLexicalJson)(t.content),
                    category: t.category,
                },
            },
            upsert: true,
        },
    })));
}
