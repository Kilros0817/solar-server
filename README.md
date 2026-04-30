# Nifty Royale API

Version : 2.0.0

## Setup

### Local dev environment

Database Setup

1. Install MongoDB on local machine
2. Create a database name "core-records"

Running server

1. cd into folder in terminal and run "npm i"
2. run "npm start

Server now running on <http://localhost:8085>

## Analytics API Endpoints

### GET `/analysis/report`
Returns cached analytics report with workflow performance data.

**Response:**
```json
{
  "isSuccess": true,
  "report": {
    "summary": {
      "total_workflows": 10,
      "completed_workflows": 5,
      "completion_rate_percent": 50.0,
      "average_cycle_time": 3600,
      "time_unit": "seconds"
    },
    "throughput_by_week": {
      "2024-W01": 2,
      "2024-W02": 3
    },
    "division_rollup": {
      "Legal": {
        "section_count": 5,
        "avg_assign_to_request": 1200,
        "avg_request_to_approve": 1800,
        "total_rejects": 2,
        "total_reassigns": 1,
        "bottleneck_stage": "request_to_approve"
      }
    },
    "documents": [...]
  }
}
```

### GET `/analysis/download-report`
Generates a downloadable report using OpenAI. Supports both markdown and HTML formats.

**Query Parameters:**
- `format` (optional): `markdown` (default) or `html`

**Example:**
```
GET /analysis/download-report?format=html
```

**Response:** Returns a downloadable file with the generated report.

## Caching Strategy

The analytics system implements a two-layer caching strategy:

1. **Subgraph Data Cache**: Raw subgraph data is cached for 10 minutes
2. **Report Cache**: Generated reports are cached based on data hash

Cache keys:
- `analysis:subgraph:data` - Raw subgraph query results
- `analysis:report:{dataHash}` - Generated report for specific data

## Environment Variables

Required for analytics:
- `OPENAI_API_KEY` - OpenAI API key for report generation
- `REDIS_HOST` - Redis host for caching
- `REDIS_PORT` - Redis port
- `REDIS_PASSWORD` - Redis password
- `SUBGRAPH_URL` - GraphQL subgraph endpoint