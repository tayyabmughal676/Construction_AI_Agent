import type {BaseTool, ToolResult} from '../../agents/types';
import {z} from 'zod';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const ExcelGeneratorSchema = z.object({
    filename: z.string(),
    sheets: z.array(z.object({
        name: z.string(),
        data: z.array(z.record(z.string(), z.any())),
        headers: z.array(z.string()).optional(),
    })),
    includeHeaders: z.boolean().optional().default(true),
});

export class ExcelGeneratorTool implements BaseTool {
    name = 'excel_generator';
    description = 'Generate Excel (XLSX) files with multiple sheets from structured data';

    private outputDir = path.join(process.cwd(), 'generated', 'excel');

    constructor() {
        // Ensure output directory exists
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, {recursive: true});
        }
    }

    async execute(params: any): Promise<ToolResult> {
        try {
            const validated = ExcelGeneratorSchema.parse(params);

            if (validated.sheets.length === 0) {
                return {
                    success: false,
                    error: 'At least one sheet is required',
                };
            }

            const filename = validated.filename.endsWith('.xlsx')
                ? validated.filename
                : `${validated.filename}.xlsx`;

            const filepath = path.join(this.outputDir, filename);

            // Create workbook
            const workbook = XLSX.utils.book_new();

            let totalRows = 0;
            let totalColumns = 0;

            // Add sheets
            for (const sheet of validated.sheets) {
                if (sheet.data.length === 0) {
                    continue; // Skip empty sheets
                }

                // Determine headers
                const headers = sheet.headers || Object.keys(sheet.data[0] || {});
                totalColumns = Math.max(totalColumns, headers.length);

                // Convert data to array of arrays
                const rows: any[][] = [];

                // Add headers if requested
                if (validated.includeHeaders) {
                    rows.push(headers);
                }

                // Add data rows
                for (const row of sheet.data) {
                    const values = headers.map(header => row[header] ?? '');
                    rows.push(values);
                }

                totalRows += rows.length;

                // Create worksheet
                const worksheet = XLSX.utils.aoa_to_sheet(rows);

                // Auto-size columns
                const columnWidths = headers.map((header, i) => {
                    const maxLength = Math.max(
                        header.length,
                        ...sheet.data.map(row => String(row[header] || '').length)
                    );
                    return {wch: Math.min(maxLength + 2, 50)}; // Cap at 50 characters
                });
                worksheet['!cols'] = columnWidths;

                // Add worksheet to workbook
                XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
            }

            // Write to file
            XLSX.writeFile(workbook, filepath);

            const stats = fs.statSync(filepath);

            return {
                success: true,
                data: {
                    filename,
                    filepath,
                    sheets: validated.sheets.length,
                    totalRows,
                    totalColumns,
                    size: stats.size,
                    sizeFormatted: this.formatBytes(stats.size),
                    message: `Excel file generated successfully: ${filename}`,
                },
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error generating Excel file',
            };
        }
    }

    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
}
