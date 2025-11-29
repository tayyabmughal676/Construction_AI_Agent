import type {BaseTool, ToolResult} from '../../agents/types';
import {z} from 'zod';
import fs from 'fs';
import path from 'path';

const CSVGeneratorSchema = z.object({
    filename: z.string(),
    data: z.array(z.record(z.string(), z.any())),
    headers: z.array(z.string()).optional(),
    delimiter: z.string().optional().default(','),
    includeHeaders: z.boolean().optional().default(true),
});

export class CSVGeneratorTool implements BaseTool {
    name = 'csv_generator';
    description = 'Generate CSV files from structured data with custom delimiters and headers';

    private outputDir = path.join(process.cwd(), 'generated', 'csv');

    constructor() {
        // Ensure output directory exists
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, {recursive: true});
        }
    }

    async execute(params: any): Promise<ToolResult> {
        try {
            const validated = CSVGeneratorSchema.parse(params);

            if (validated.data.length === 0) {
                return {
                    success: false,
                    error: 'No data provided for CSV generation',
                };
            }

            const filename = validated.filename.endsWith('.csv')
                ? validated.filename
                : `${validated.filename}.csv`;

            const filepath = path.join(this.outputDir, filename);

            // Determine headers
            const headers = validated.headers || Object.keys(validated.data[0] || {});

            // Build CSV content
            const csvLines: string[] = [];

            // Add headers if requested
            if (validated.includeHeaders) {
                csvLines.push(this.escapeCSVRow(headers, validated.delimiter));
            }

            // Add data rows
            for (const row of validated.data) {
                const values = headers.map(header => {
                    const value = row[header];
                    return value !== null && value !== undefined ? String(value) : '';
                });
                csvLines.push(this.escapeCSVRow(values, validated.delimiter));
            }

            const csvContent = csvLines.join('\n');

            // Write to file
            fs.writeFileSync(filepath, csvContent, 'utf-8');

            const stats = fs.statSync(filepath);

            return {
                success: true,
                data: {
                    filename,
                    filepath,
                    rows: validated.data.length,
                    columns: headers.length,
                    size: stats.size,
                    sizeFormatted: this.formatBytes(stats.size),
                    headers,
                    message: `CSV generated successfully: ${filename}`,
                },
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error generating CSV',
            };
        }
    }

    private escapeCSVRow(values: string[], delimiter: string): string {
        return values.map(value => {
            // If value contains delimiter, quotes, or newlines, wrap in quotes and escape quotes
            if (value.includes(delimiter) || value.includes('"') || value.includes('\n')) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        }).join(delimiter);
    }

    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
}
