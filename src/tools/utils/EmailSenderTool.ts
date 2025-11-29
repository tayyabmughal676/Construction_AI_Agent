import type {BaseTool, ToolResult} from '../../agents/types';
import {z} from 'zod';
import nodemailer from 'nodemailer';
import {Validator} from '../../utils/validators';

const EmailSenderSchema = z.object({
    to: z.union([z.string(), z.array(z.string())]),
    subject: z.string(),
    body: z.string(),
    html: z.boolean().optional().default(false),
    cc: z.union([z.string(), z.array(z.string())]).optional(),
    bcc: z.union([z.string(), z.array(z.string())]).optional(),
    attachments: z.array(z.object({
        filename: z.string(),
        path: z.string(),
    })).optional(),
});

export class EmailSenderTool implements BaseTool {
    name = 'email_sender';
    description = 'Send emails with optional attachments (PDF, CSV, Excel, Word)';

    private transporter?: nodemailer.Transporter;

    constructor() {
        // Initialize email transporter only if SMTP is configured
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });
        }
    }

    async execute(params: any): Promise<ToolResult> {
        try {
            // Check if email is configured
            if (!this.transporter) {
                return {
                    success: false,
                    error: 'Email not configured. Please set SMTP_USER and SMTP_PASS in .env file',
                };
            }

            const validated = EmailSenderSchema.parse(params);

            // Validate email addresses
            const toEmails = Array.isArray(validated.to) ? validated.to : [validated.to];
            for (const email of toEmails) {
                const validation = Validator.email.validate(email);
                if (!validation.valid) {
                    return {
                        success: false,
                        error: `Invalid recipient email: ${email} - ${validation.error}`,
                    };
                }
            }

            // Validate CC emails if provided
            if (validated.cc) {
                const ccEmails = Array.isArray(validated.cc) ? validated.cc : [validated.cc];
                for (const email of ccEmails) {
                    const validation = Validator.email.validate(email);
                    if (!validation.valid) {
                        return {
                            success: false,
                            error: `Invalid CC email: ${email} - ${validation.error}`,
                        };
                    }
                }
            }

            // Validate BCC emails if provided
            if (validated.bcc) {
                const bccEmails = Array.isArray(validated.bcc) ? validated.bcc : [validated.bcc];
                for (const email of bccEmails) {
                    const validation = Validator.email.validate(email);
                    if (!validation.valid) {
                        return {
                            success: false,
                            error: `Invalid BCC email: ${email} - ${validation.error}`,
                        };
                    }
                }
            }

            // Prepare email options
            const mailOptions: nodemailer.SendMailOptions = {
                from: process.env.SMTP_FROM || process.env.SMTP_USER,
                to: Array.isArray(validated.to) ? validated.to.join(', ') : validated.to,
                subject: validated.subject,
                [validated.html ? 'html' : 'text']: validated.body,
            };

            if (validated.cc) {
                mailOptions.cc = Array.isArray(validated.cc) ? validated.cc.join(', ') : validated.cc;
            }

            if (validated.bcc) {
                mailOptions.bcc = Array.isArray(validated.bcc) ? validated.bcc.join(', ') : validated.bcc;
            }

            if (validated.attachments && validated.attachments.length > 0) {
                mailOptions.attachments = validated.attachments;
            }

            // Send email
            const info = await this.transporter.sendMail(mailOptions);

            return {
                success: true,
                data: {
                    messageId: info.messageId,
                    recipients: toEmails.length,
                    subject: validated.subject,
                    hasAttachments: (validated.attachments?.length || 0) > 0,
                    attachmentCount: validated.attachments?.length || 0,
                    message: `Email sent successfully to ${toEmails.length} recipient(s)`,
                },
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error sending email',
            };
        }
    }

    // Test email configuration
    async testConnection(): Promise<boolean> {
        if (!this.transporter) return false;
        try {
            await this.transporter.verify();
            return true;
        } catch {
            return false;
        }
    }
}
