import type {BaseTool, ToolResult} from '../../agents/types';
import {z} from 'zod';
import {AlignmentType, Document, HeadingLevel, Packer, Paragraph, TableCell, TableRow, TextRun, WidthType} from 'docx';
import fs from 'fs';
import path from 'path';

const WordGeneratorSchema = z.object({
    title: z.string(),
    content: z.array(z.object({
        type: z.enum(['heading', 'paragraph', 'list', 'table']),
        text: z.string().optional(),
        items: z.array(z.string()).optional(),
        data: z.any().optional(),
        level: z.number().optional().default(1),
        bold: z.boolean().optional().default(false),
        italic: z.boolean().optional().default(false),
    })),
    filename: z.string(),
    metadata: z.object({
        author: z.string().optional(),
        subject: z.string().optional(),
        keywords: z.string().optional(),
    }).optional(),
});

export class WordGeneratorTool implements BaseTool {
    name = 'word_generator';
    description = 'Generate Word/DOCX documents from structured content';

    private outputDir = path.join(process.cwd(), 'generated', 'docx');

    constructor() {
        // Ensure output directory exists
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, {recursive: true});
        }
    }

    async execute(params: any): Promise<ToolResult> {
        try {
            const validated = WordGeneratorSchema.parse(params);

            const filename = validated.filename.endsWith('.docx')
                ? validated.filename
                : `${validated.filename}.docx`;

            const filepath = path.join(this.outputDir, filename);

            // Build document sections
            const sections: Paragraph[] = [];

            // Add title
            sections.push(
                new Paragraph({
                    text: validated.title,
                    heading: HeadingLevel.TITLE,
                    alignment: AlignmentType.CENTER,
                    spacing: {after: 400},
                })
            );

            // Add content
            for (const section of validated.content) {
                switch (section.type) {
                    case 'heading':
                        const headingLevel = section.level === 1
                            ? HeadingLevel.HEADING_1
                            : section.level === 2
                                ? HeadingLevel.HEADING_2
                                : HeadingLevel.HEADING_3;

                        sections.push(
                            new Paragraph({
                                text: section.text || '',
                                heading: headingLevel,
                                spacing: {before: 200, after: 100},
                            })
                        );
                        break;

                    case 'paragraph':
                        sections.push(
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: section.text || '',
                                        bold: section.bold,
                                        italics: section.italic,
                                    }),
                                ],
                                spacing: {after: 200},
                            })
                        );
                        break;

                    case 'list':
                        if (section.items) {
                            section.items.forEach(item => {
                                sections.push(
                                    new Paragraph({
                                        text: `• ${item}`,
                                        spacing: {after: 100},
                                        indent: {left: 720}, // 0.5 inch
                                    })
                                );
                            });
                        }
                        break;

                    case 'table':
                        if (section.data && Array.isArray(section.data)) {
                            const tableData = section.data as any[];
                            if (tableData.length > 0) {
                                const headers = Object.keys(tableData[0]);

                                // Create table rows
                                const rows: TableRow[] = [];

                                // Header row
                                rows.push(
                                    new TableRow({
                                        children: headers.map(header =>
                                            new TableCell({
                                                children: [
                                                    new Paragraph({
                                                        children: [
                                                            new TextRun({
                                                                text: header,
                                                                bold: true,
                                                            }),
                                                        ],
                                                    }),
                                                ],
                                                width: {
                                                    size: 100 / headers.length,
                                                    type: WidthType.PERCENTAGE,
                                                },
                                            })
                                        ),
                                    })
                                );

                                // Data rows
                                tableData.forEach(row => {
                                    rows.push(
                                        new TableRow({
                                            children: headers.map(header =>
                                                new TableCell({
                                                    children: [
                                                        new Paragraph({
                                                            text: String(row[header] || ''),
                                                        }),
                                                    ],
                                                    width: {
                                                        size: 100 / headers.length,
                                                        type: WidthType.PERCENTAGE,
                                                    },
                                                })
                                            ),
                                        })
                                    );
                                });

                                // Note: Tables need to be added differently in docx
                                // For now, we'll convert to text representation
                                sections.push(
                                    new Paragraph({
                                        text: '[Table data - see raw data]',
                                        spacing: {after: 200},
                                    })
                                );
                            }
                        }
                        break;
                }
            }

            // Create document
            const doc = new Document({
                creator: validated.metadata?.author || 'Multi-Agent System',
                title: validated.title,
                subject: validated.metadata?.subject,
                keywords: validated.metadata?.keywords,
                sections: [
                    {
                        properties: {},
                        children: sections,
                    },
                ],
            });

            // Generate buffer
            const buffer = await Packer.toBuffer(doc);

            // Write to file
            fs.writeFileSync(filepath, buffer);

            const stats = fs.statSync(filepath);

            return {
                success: true,
                data: {
                    filename,
                    filepath,
                    size: stats.size,
                    sizeFormatted: this.formatBytes(stats.size),
                    sections: validated.content.length,
                    message: `Word document generated successfully: ${filename}`,
                },
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error generating Word document',
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
