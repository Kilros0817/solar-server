"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toDiv = toDiv;
const DIVISION_MAP = {
    0: 'NoDivision',
    1: 'Legal',
    2: 'ProjectManagement',
    3: 'Preconstruction',
    4: 'Estimating',
    5: 'Finance',
    6: 'Accounting',
    7: 'RiskManagement',
    8: 'Insurance',
    9: 'Safety',
};
function toDiv(dcategory) {
    return DIVISION_MAP[dcategory] ?? 'NoDivision';
}
