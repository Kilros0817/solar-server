"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const ClauseTemplate_1 = require("../models/ClauseTemplate");
const SectionTemplate_1 = require("../models/SectionTemplate");
const ContractTemplate_1 = require("../models/ContractTemplate");
const seedClauseTemplates_1 = require("../utils/seedClauseTemplates");
const seedSectionTemplates_1 = require("../utils/seedSectionTemplates");
const seedContractTemplates_1 = require("../utils/seedContractTemplates");
dotenv_1.default.config();
async function reseedTemplates() {
    console.log('Connected to PostgreSQL database');
    try {
        const clauseDeleted = await ClauseTemplate_1.ClauseTemplate.deleteMany({});
        const sectionDeleted = await SectionTemplate_1.SectionTemplate.deleteMany({});
        const contractDeleted = await ContractTemplate_1.ContractTemplate.deleteMany({});
        console.log(`Deleted ${clauseDeleted.deletedCount} clause templates, ${sectionDeleted.deletedCount} section templates, and ${contractDeleted.deletedCount} contract templates`);
        await (0, seedClauseTemplates_1.ensureClauseTemplatesSeeded)();
        console.log('Clause templates seeded (content stored as Lexical JSON)');
        await (0, seedSectionTemplates_1.ensureSectionTemplatesSeeded)();
        console.log('Section templates seeded');
        await (0, seedContractTemplates_1.ensureContractTemplatesSeeded)();
        console.log('Contract templates seeded');
    }
    catch (error) {
        console.error('Reseed failed:', error);
        process.exit(1);
    }
}
reseedTemplates();
