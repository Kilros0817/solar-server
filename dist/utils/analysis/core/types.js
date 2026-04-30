"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HISTORIES_QUERY = void 0;
exports.toDiv = toDiv;
exports.HISTORIES_QUERY = `{
  docHistories(orderBy: date) {
    type
    docStatus
    date
    document {
      id
    }
  }
  sectionHistories(orderBy: date) {
    date
    sectionStatus
    type
    section {
      doc {
        id
      }
      id
      divisionLeader {
        firstName
        lastName
        dcategory
      }
    }
  }
  clauseHistories(orderBy: date) {
    type
    date
    clauseStatus
    clause {
      id
      section {
        id
      }
      divisionMember {
        firstName
        lastName
      }
    }
  }
}`;
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
