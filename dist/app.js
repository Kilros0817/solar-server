"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const seedClauseTemplates_1 = require("./utils/seedClauseTemplates");
const seedSectionTemplates_1 = require("./utils/seedSectionTemplates");
const seedContractTemplates_1 = require("./utils/seedContractTemplates");
const api_1 = __importDefault(require("./routes/api"));
const clause_1 = __importDefault(require("./routes/clause"));
const section_1 = __importDefault(require("./routes/section"));
const contract_1 = __importDefault(require("./routes/contract"));
const upload_1 = __importDefault(require("./routes/upload"));
const subgraph_1 = __importDefault(require("./routes/subgraph"));
const app = (0, express_1.default)();
dotenv_1.default.config();
const connectionString = `mongodb+srv://${process.env.USER_NAME}:${encodeURIComponent(process.env.PASSWORD)}@cluster0.dwfddsb.mongodb.net/solar?retryWrites=true&w=majority`;
mongoose_1.default.connect(connectionString, {}).then(() => {
    console.log('Connected to Database');
    Promise.all([
        (0, seedClauseTemplates_1.ensureClauseTemplatesSeeded)(),
        (0, seedSectionTemplates_1.ensureSectionTemplatesSeeded)(),
        (0, seedContractTemplates_1.ensureContractTemplatesSeeded)(),
    ])
        .then(() => {
        console.log('Clause templates ensured');
        console.log('Section templates ensured');
        console.log('Contract templates ensured');
    })
        .catch((error) => console.error('Failed to seed templates:', error));
}).catch((error) => {
    console.error('Error connecting to Database:', error);
});
const corsOptions = {
    origin: ["http://localhost:3000"],
    credentials: false,
};
app
    .use((0, cors_1.default)(corsOptions))
    .use(body_parser_1.default.urlencoded({ extended: true }))
    .use(body_parser_1.default.json())
    .use("/api", api_1.default)
    .use("/clause", clause_1.default)
    .use("/section", section_1.default)
    .use("/contract", contract_1.default)
    .use("/upload", upload_1.default)
    .use("/subgraph", subgraph_1.default);
app.listen(8085, () => {
    console.log("the server is running on port 8085");
});
