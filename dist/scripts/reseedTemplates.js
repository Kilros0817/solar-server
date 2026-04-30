"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const ClauseTemplate_1 = require("../models/ClauseTemplate");
const SectionTemplate_1 = require("../models/SectionTemplate");
const seedClauseTemplates_1 = require("../utils/seedClauseTemplates");
const seedSectionTemplates_1 = require("../utils/seedSectionTemplates");
dotenv_1.default.config();
const connectionString = `mongodb+srv://${process.env.USER_NAME}:${encodeURIComponent(process.env.PASSWORD)}@cluster0.dwfddsb.mongodb.net/solar?retryWrites=true&w=majority`;
async function reseedTemplates() {
    await mongoose_1.default.connect(connectionString);
    console.log('Connected to database');
    try {
        const clauseDeleted = await ClauseTemplate_1.ClauseTemplate.deleteMany({});
        const sectionDeleted = await SectionTemplate_1.SectionTemplate.deleteMany({});
        console.log(`Deleted ${clauseDeleted.deletedCount} clause templates and ${sectionDeleted.deletedCount} section templates`);
        await (0, seedClauseTemplates_1.ensureClauseTemplatesSeeded)();
        console.log('Clause templates seeded (content stored as Lexical JSON)');
        await (0, seedSectionTemplates_1.ensureSectionTemplatesSeeded)();
        console.log('Section templates seeded');
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('Disconnected');
    }
}
reseedTemplates().catch((err) => {
    console.error('Reseed failed:', err);
    process.exit(1);
});
