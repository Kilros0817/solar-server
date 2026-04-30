"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReportHTML = void 0;
const generateReportHTML = (report) => {
    const { summary, throughput_by_week, division_rollup } = report;
    const throughputRows = Object.entries(throughput_by_week)
        .map(([week, count]) => `<tr><td>${week}</td><td>${count}</td></tr>`)
        .join('');
    const divisionRows = Object.entries(division_rollup)
        .map(([division, stats]) => `
      <tr>
        <td>${division}</td>
        <td>${stats.section_count}</td>
        <td>${stats.avg_assign_to_request || 'N/A'}</td>
        <td>${stats.avg_request_to_approve || 'N/A'}</td>
        <td>${stats.total_rejects}</td>
        <td>${stats.total_reassigns}</td>
        <td>${stats.bottleneck_stage || 'N/A'}</td>
      </tr>
    `)
        .join('');
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Solar DMS Analytics Report</title>
  <style>
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      line-height: 1.6; 
      margin: 0; 
      padding: 20px; 
      color: #333;
      background-color: #f8f9fa;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #3498db;
    }
    
    h1 { 
      color: #2c3e50; 
      margin: 0 0 10px 0;
      font-size: 2.5rem;
    }
    
    .subtitle {
      color: #7f8c8d;
      font-size: 1.1rem;
      margin-bottom: 20px;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    
    .summary-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    
    .summary-card h3 {
      margin: 0 0 10px 0;
      font-size: 1rem;
      opacity: 0.9;
    }
    
    .summary-card .value {
      font-size: 2rem;
      font-weight: bold;
      margin: 0;
    }
    
    .section {
      margin-bottom: 40px;
    }
    
    .section h2 {
      color: #34495e;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #e0e0e0;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    
    th {
      background-color: #3498db;
      color: white;
      padding: 12px;
      text-align: left;
    }
    
    td {
      padding: 12px;
      border-bottom: 1px solid #e0e0e0;
    }
    
    tr:nth-child(even) {
      background-color: #f8f9fa;
    }
    
    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 12px;
      color: #95a5a6;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
    }
    
    .timestamp {
      font-size: 0.9rem;
      color: #7f8c8d;
      margin-top: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Solar DMS Analytics Report</h1>
      <div class="subtitle">Comprehensive Workflow Performance Analysis</div>
      <div class="timestamp">Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
    </div>
    
    <div class="summary-grid">
      <div class="summary-card">
        <h3>Total Workflows</h3>
        <p class="value">${summary.total_workflows}</p>
      </div>
      <div class="summary-card">
        <h3>Completed Workflows</h3>
        <p class="value">${summary.completed_workflows}</p>
      </div>
      <div class="summary-card">
        <h3>Completion Rate</h3>
        <p class="value">${summary.completion_rate_percent}%</p>
      </div>
      <div class="summary-card">
        <h3>Avg Cycle Time</h3>
        <p class="value">${summary.average_cycle_time || 'N/A'} ${summary.time_unit}</p>
      </div>
    </div>
    
    <div class="section">
      <h2>Throughput by Week</h2>
      <table>
        <thead>
          <tr>
            <th>Week</th>
            <th>Completed Workflows</th>
          </tr>
        </thead>
        <tbody>
          ${throughputRows}
        </tbody>
      </table>
    </div>
    
    <div class="section">
      <h2>Division Performance Rollup</h2>
      <table>
        <thead>
          <tr>
            <th>Division</th>
            <th>Sections</th>
            <th>Avg Assign→Request</th>
            <th>Avg Request→Approve</th>
            <th>Total Rejects</th>
            <th>Total Reassigns</th>
            <th>Bottleneck Stage</th>
          </tr>
        </thead>
        <tbody>
          ${divisionRows}
        </tbody>
      </table>
    </div>
    
    <div class="footer">
      <p>Solar DMS - Contract Management System</p>
      <p>Confidential - For Internal Use Only</p>
    </div>
  </div>
</body>
</html>`;
};
exports.generateReportHTML = generateReportHTML;
