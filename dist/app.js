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
const api_1 = __importDefault(require("./routes/api"));
const clause_1 = __importDefault(require("./routes/clause"));
const section_1 = __importDefault(require("./routes/section"));
const contract_1 = __importDefault(require("./routes/contract"));
const upload_1 = __importDefault(require("./routes/upload"));
const subgraph_1 = __importDefault(require("./routes/subgraph"));
const support_1 = __importDefault(require("./routes/support"));
const analysis_1 = __importDefault(require("./routes/analysis"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const connectionString = `mongodb+srv://${process.env.USER_NAME}:${encodeURIComponent(process.env.PASSWORD)}@cluster0.dwfddsb.mongodb.net/solar?retryWrites=true&w=majority`;
mongoose_1.default.connect(connectionString, {}).then(() => {
    console.log('Connected to Database');
}).catch((error) => {
    console.error('Error connecting to Database:', error);
});
const corsOptions = {
    origin: ["http://localhost:3000", "https://app.tomeblock.com", "https://www.tomeblock.com"],
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
    .use("/support", support_1.default)
    .use("/subgraph", subgraph_1.default)
    .use("/analysis", analysis_1.default);
app.listen(8085, () => {
    console.log("the server is running on port 8085");
});
