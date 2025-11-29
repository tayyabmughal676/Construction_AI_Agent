import type {BaseTool, ToolResult} from '../../agents/types';
import {z} from 'zod';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const PDFGeneratorSchema = z.object({
    title: z.string(),
    content: z.array(z.object({
        type: z.enum(['heading', 'paragraph', 'list', 'table', 'image']),
        text: z.string().optional(),
        items: z.array(z.string()).optional(),
        data: z.any().optional(),
        level: z.number().optional(),
    })),
    filename: z.string(),
    metadata: z.object({
        author: z.string().optional(),
        subject: z.string().optional(),
        keywords: z.string().optional(),
    }).optional(),
});

export class PDFGeneratorTool implements BaseTool {
    name = 'pdf_generator';
    description = 'Generate PDF documents from structured content';

    private outputDir = path.join(process.cwd(), 'generated', 'pdfs');

    constructor() {
        // Ensure output directory exists
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, {recursive: true});
        }
    }

    async execute(params: any): Promise<ToolResult> {
        try {
            const validated = PDFGeneratorSchema.parse(params);

            const filename = validated.filename.endsWith('.pdf')
                ? validated.filename
                : `${validated.filename}.pdf`;

            const filepath = path.join(this.outputDir, filename);

            // Create PDF document
            const doc = new PDFDocument({
                size: 'A4',
                margins: {
                    top: 50,
                    bottom: 50,
                    left: 50,
                    right: 50,
                },
                info: {
                    Title: validated.title,
                    Author: validated.metadata?.author || 'Multi-Agent System',
                    Subject: validated.metadata?.subject,
                    Keywords: validated.metadata?.keywords,
                },
            });

            // Pipe to file
            const stream = fs.createWriteStream(filepath);
            doc.pipe(stream);

            // Add title
            doc.fontSize(24)
                .font('Helvetica-Bold')
                .text(validated.title, {align: 'center'})
                .moveDown(2);

            // Add content
            for (const section of validated.content) {
                switch (section.type) {
                    case 'heading':
                        const headingSize = section.level === 1 ? 18 : section.level === 2 ? 16 : 14;
                        doc.fontSize(headingSize)
                            .font('Helvetica-Bold')
                            .text(section.text || '', {align: 'left'})
                            .moveDown(0.5);
                        break;

                    case 'paragraph':
                        doc.fontSize(12)
                            .font('Helvetica')
                            .text(section.text || '', {align: 'justify'})
                            .moveDown(1);
                        break;

                    case 'list':
                        if (section.items) {
                            doc.fontSize(12).font('Helvetica');
                            section.items.forEach(item => {
                                doc.text(`• ${item}`, {indent: 20});
                            });
                            doc.moveDown(1);
                        }
                        break;

                    case 'table':
                        if (section.data && Array.isArray(section.data)) {
                            doc.fontSize(10).font('Helvetica');

                            // Simple table rendering
                            const tableData = section.data as any[];
                            if (tableData.length > 0) {
                                // Header
                                const headers = Object.keys(tableData[0]);
                                doc.font('Helvetica-Bold');
                                doc.text(headers.join(' | '), {indent: 20});
                                doc.font('Helvetica');

                                // Rows
                                tableData.forEach(row => {
                                    const values = headers.map(h => row[h] || '');
                                    doc.text(values.join(' | '), {indent: 20});
                                });
                                doc.moveDown(1);
                            }
                        }
                        break;
                }
            }

            // Add footer with page numbers
            const pages = doc.bufferedPageRange();
            for (let i = 0; i < pages.count; i++) {
                doc.switchToPage(i);
                doc.fontSize(10)
                    .font('Helvetica')
                    .text(
                        `Page ${i + 1} of ${pages.count}`,
                        50,
                        doc.page.height - 50,
                        {align: 'center'}
                    );
            }

            // Finalize PDF
            doc.end();

            // Wait for stream to finish
            await new Promise<void>((resolve, reject) => {
                stream.on('finish', () => resolve());
                stream.on('error', reject);
            });

            const stats = fs.statSync(filepath);

            return {
                success: true,
                data: {
                    filename,
                    filepath,
                    size: stats.size,
                    sizeFormatted: this.formatBytes(stats.size),
                    pages: doc.bufferedPageRange().count,
                    message: `PDF generated successfully: ${filename}`,
                },
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error generating PDF',
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
