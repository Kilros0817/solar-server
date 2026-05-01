import express, { Request, Response } from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import {
  getOrBuildReport,
  generatePDFFromHTML,
  markdownToHTML
} from '../utils/analysis';
import { AnalysisReport } from '../utils/analysis/core/types';

dotenv.config();

const router = express.Router();

console.log("API KEY EXISTS:", !!process.env.OPENAI_API_KEY);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Format seconds into a human-readable duration.
 * Uses minutes when the value is less than 1 hour.
 */
function formatDuration(seconds: number | null): string {
  if (seconds === null) return 'N/A';
  const hours = Math.round(seconds / 3600);
  if (hours === 0) {
    const minutes = Math.round(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  return `${hours} hour${hours !== 1 ? 's' : ''}`;
}

/**
 * Generate OpenAI prompt for report generation
 */
function generateOpenAIPrompt(report: AnalysisReport): string {
  // Build detailed division data for the prompt
  const divisionEntries = Object.entries(report.division_rollup);

  const divisionData = divisionEntries
    .map(([division, stats]) => {
      return `  - ${division}:
      - Sections: ${stats.section_count}
      - Avg Assign to Request: ${formatDuration(stats.avg_assign_to_request)}
      - Avg Request to Approve: ${formatDuration(stats.avg_request_to_approve)}
      - Total Rejects: ${stats.total_rejects}
      - Total Reassigns: ${stats.total_reassigns}
      - Bottleneck: ${stats.bottleneck_stage || 'N/A'}`;
    })
    .join('\n');

  // Pre-compute bottleneck analysis so OpenAI has concrete content to write about
  const bottleneckLines = divisionEntries
    .filter(([, stats]) => stats.bottleneck_stage)
    .map(([division, stats]) => {
      const stageTime = stats.bottleneck_stage === 'assign_to_request'
        ? formatDuration(stats.avg_assign_to_request)
        : formatDuration(stats.avg_request_to_approve);
      return `  - ${division}: bottleneck at "${stats.bottleneck_stage}" stage (avg ${stageTime}), ${stats.total_rejects} reject(s), ${stats.total_reassigns} reassign(s)`;
    })
    .join('\n');

  // Pre-compute recommendations hints
  const highRejectDivisions = divisionEntries
    .filter(([, s]) => s.total_rejects > 0)
    .map(([d, s]) => `${d} (${s.total_rejects} rejects)`);
  const highReassignDivisions = divisionEntries
    .filter(([, s]) => s.total_reassigns > 0)
    .map(([d, s]) => `${d} (${s.total_reassigns} reassigns)`);
  const slowAssignDivisions = divisionEntries
    .filter(([, s]) => s.avg_assign_to_request !== null && s.avg_assign_to_request > 3600)
    .sort(([, a], [, b]) => (b.avg_assign_to_request ?? 0) - (a.avg_assign_to_request ?? 0))
    .map(([d, s]) => `${d} (${formatDuration(s.avg_assign_to_request)})`);

  return `You are generating a professional analytics report for a solar contract management system. 
Write complete, specific content for every section using the data provided. Do NOT write placeholder text like "to be added" or "details here".

DATA:
Summary:
- Total workflows: ${report.summary.total_workflows}
- Completed: ${report.summary.completed_workflows} (${report.summary.completion_rate_percent}%)
- Avg cycle time: ${formatDuration(report.summary.average_cycle_time)}
- Documents analyzed: ${report.documents.length}

Division Performance:
${divisionData}

Bottleneck Analysis (pre-computed):
${bottleneckLines || '  - No bottlenecks identified'}

Divisions with rejects: ${highRejectDivisions.length ? highRejectDivisions.join(', ') : 'None'}
Divisions with reassigns: ${highReassignDivisions.length ? highReassignDivisions.join(', ') : 'None'}
Slowest assign-to-request divisions: ${slowAssignDivisions.length ? slowAssignDivisions.join(', ') : 'None'}

INSTRUCTIONS:
Generate a complete HTML report with these sections. Every section must contain real, specific content derived from the data above — no placeholders.

1. Executive Summary: Summarize overall workflow health, completion rate, and cycle time in 2-3 sentences.
2. Key Metrics: List the summary numbers in a clear format.
3. Division Performance: For each division, describe its performance using the stats above.
4. Bottleneck Analysis: For each division with a bottleneck, explain which stage is slow and what the numbers suggest.
5. Recommendations: Based on the reject/reassign/bottleneck data, give 3-5 specific, actionable recommendations.
6. Technical Details: List the raw metrics (section counts, stage durations) in a structured format.

Return ONLY valid HTML using h1, h2, h3, p, ul, li, strong tags. No markdown, no code fences.`;
}

/**
 * Generate fallback basic report when OpenAI fails
 */
async function generateFallbackReport(error: unknown): Promise<{ pdfBuffer: Buffer; filename: string } | null> {
  const result = await getOrBuildReport();
  if (!result) {
    return null;
  }

  const { report } = result;

  // Build division details for fallback report
  const divisionDetails = Object.entries(report.division_rollup)
    .map(([division, stats]) => {
      return `### ${division}
- Sections: ${stats.section_count}
- Avg Assign to Request: ${formatDuration(stats.avg_assign_to_request)}
- Avg Request to Approve: ${formatDuration(stats.avg_request_to_approve)}
- Total Rejects: ${stats.total_rejects}
- Total Reassigns: ${stats.total_reassigns}
- Bottleneck: ${stats.bottleneck_stage || 'N/A'}`;
    })
    .join('\n\n');

  const basicReport = `# Analytics Report

## Summary
- Total Workflows: ${report.summary.total_workflows}
- Completed Workflows: ${report.summary.completed_workflows}
- Completion Rate: ${report.summary.completion_rate_percent}%
- Average Cycle Time: ${formatDuration(report.summary.average_cycle_time)}

## Division Performance
${divisionDetails}

## Note
OpenAI report generation failed. This is a basic report.

Error: ${typeof error === 'string' ? error.substring(0, 200) : String(error).substring(0, 200)}

Generated: ${new Date().toLocaleString()}`;

  // Convert markdown to HTML and generate PDF
  const htmlContent = markdownToHTML(basicReport);
  const pdfBuffer = await generatePDFFromHTML(htmlContent);

  return {
    pdfBuffer,
    filename: `analytics-report-basic-${Date.now()}.pdf`
  };
}

/**
 * GET /analysis/report
 * Fetches docHistories + sectionHistories from subgraph and returns a
 * computed workflow analytics report — no AI involved.
 * Now with caching!
 */
router.get('/report', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await getOrBuildReport();

    if (!result) {
      res.status(502).json({ isSuccess: false, error: 'Failed to fetch data from subgraph' });
      return;
    }

    res.json({ isSuccess: true, report: result.report });
  } catch (error) {
    console.error('Analysis report error:', error);
    res.status(500).json({ isSuccess: false, error: String(error) });
  }
});

/**
 * GET /analysis/download-report
 * Generates a PDF report using OpenAI and returns it as a downloadable file
 */
router.get('/download-report', async (_req: Request, res: Response): Promise<void> => {
  try {
    // Get the report (cached or fresh)
    const result = await getOrBuildReport();

    if (!result) {
      res.status(502).json({ isSuccess: false, error: 'Failed to fetch data from subgraph' });
      return;
    }

    const { report } = result;

    const prompt = generateOpenAIPrompt(report);

    // Check if OpenAI client is initialized
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    // Use OpenAI SDK
    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Create HTML reports for PDF conversion. Return clean HTML with h1, h2, h3, p, ul, li tags. No markdown or explanations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });
    } catch (openaiError: any) {
      console.error('OpenAI API call failed:', openaiError);
      throw new Error(`OpenAI API error: ${openaiError.message || 'Unknown error'}`);
    }

    if (!completion.choices || completion.choices.length === 0) {
      throw new Error('OpenAI API returned no response choices');
    }

    const reportContent = completion.choices[0].message.content;

    if (!reportContent) {
      throw new Error('OpenAI API returned empty response content');
    }

    // Strip markdown code fences (e.g. ```html ... ```) that the model may wrap around the HTML
    const cleanedContent = reportContent
      .replace(/^```(?:html)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    // Generate PDF from HTML content
    const pdfBuffer = await generatePDFFromHTML(cleanedContent);

    // Set PDF headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="analytics-report-${Date.now()}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length.toString());

    res.send(pdfBuffer);

  } catch (error) {
    console.error('Download report error:', error);

    // Try to provide a fallback basic report if OpenAI fails
    try {
      const fallbackResult = await generateFallbackReport(error);
      if (fallbackResult) {
        const { pdfBuffer, filename } = fallbackResult;

        // Set PDF headers for fallback
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length.toString());

        res.send(pdfBuffer);
        return;
      }
    } catch (fallbackError) {
      console.error('Fallback report generation also failed:', fallbackError);
    }

    res.status(500).json({
      isSuccess: false,
      error: String(error),
      message: 'Failed to generate report'
    });
  }
});

export default router;