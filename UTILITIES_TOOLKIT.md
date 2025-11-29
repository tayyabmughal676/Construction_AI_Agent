# 🛠️ Utilities Toolkit - Complete Documentation

## Overview

The Utilities Toolkit provides reusable validation, formatting, and file generation tools that can be used across all agents in the multi-agent system.

---

## 📦 Components

### 1. Validation Utilities (`src/utils/validators.ts`)

Comprehensive validation and formatting utilities for common data types.

#### Email Validator

**Features:**
- Email format validation
- Email normalization (lowercase, trimmed)
- Domain extraction
- Business vs. free email detection
- Duplicate dot detection

**Usage:**
```typescript
import { Validator } from './utils/validators';

// Validate email
const result = Validator.email.validate('john.doe@company.com');
if (result.valid) {
    console.log('Email is valid');
} else {
    console.log(`Error: ${result.error}`);
}

// Normalize email
const normalized = Validator.email.normalize('  John.Doe@Company.COM  ');
// Returns: "john.doe@company.com"

// Extract domain
const domain = Validator.email.extractDomain('john@company.com');
// Returns: "company.com"

// Check if business email
const isBusiness = Validator.email.isBusinessEmail('john@company.com');
// Returns: true (not a free email provider)
```

#### Phone Validator

**Features:**
- US, UK, and international phone validation
- Phone number normalization
- Automatic formatting
- Multiple format support

**Usage:**
```typescript
// Validate US phone
const result = Validator.phone.validate('(555) 123-4567', 'us');
// Returns: { valid: true, formatted: "+1 (555) 123-4567" }

// Validate international
const intl = Validator.phone.validate('+44 20 1234 5678', 'international');
// Returns: { valid: true, formatted: "+442012345678" }

// Normalize phone
const normalized = Validator.phone.normalize('(555) 123-4567');
// Returns: "5551234567"

// Format US phone
const formatted = Validator.phone.formatUS('5551234567');
// Returns: "+1 (555) 123-4567"
```

#### Date Validator

**Features:**
- Date format validation
- Future/past date checking
- Days between calculation
- Multiple output formats (ISO, US, UK)

**Usage:**
```typescript
// Validate date
const result = Validator.date.validate('2025-12-25');
// Returns: { valid: true, date: Date object }

// Check if in future
const isFuture = Validator.date.isInFuture('2025-12-25');
// Returns: true

// Calculate days between
const days = Validator.date.daysBetween('2025-01-01', '2025-12-31');
// Returns: 364

// Format date
const formatted = Validator.date.format('2025-12-25', 'us');
// Returns: "12/25/2025"
```

#### String Validator

**Features:**
- Empty string checking
- Min/max length validation
- Alphanumeric validation
- Letters-only validation
- HTML sanitization

**Usage:**
```typescript
// Check if not empty
const notEmpty = Validator.string.isNotEmpty('  hello  ');
// Returns: true

// Min length
const minResult = Validator.string.minLength('hello', 3);
// Returns: { valid: true }

// Max length
const maxResult = Validator.string.maxLength('hello', 10);
// Returns: { valid: true }

// Alphanumeric check
const isAlphaNum = Validator.string.isAlphanumeric('abc123');
// Returns: true

// Sanitize
const clean = Validator.string.sanitize('  <script>alert("xss")</script>  ');
// Returns: "scriptalert("xss")/script"
```

#### Number Validator

**Features:**
- Positive/non-negative checking
- Range validation
- Integer validation
- Decimal formatting
- Currency formatting

**Usage:**
```typescript
// Check if positive
const isPos = Validator.number.isPositive(5);
// Returns: true

// Range validation
const inRange = Validator.number.inRange(5, 1, 10);
// Returns: { valid: true }

// Format with decimals
const formatted = Validator.number.format(123.456, 2);
// Returns: "123.46"

// Format as currency
const currency = Validator.number.formatCurrency(1234.56, 'USD');
// Returns: "$1,234.56"
```

---

### 2. PDF Generator Tool (`src/tools/utils/PDFGeneratorTool.ts`)

Generate professional PDF documents from structured content.

**Features:**
- Multiple content types (headings, paragraphs, lists, tables)
- Automatic page numbering
- Custom metadata (author, subject, keywords)
- A4 page size with margins
- File size reporting

**Schema:**
```typescript
{
    title: string,
    content: [
        {
            type: 'heading' | 'paragraph' | 'list' | 'table' | 'image',
            text?: string,
            items?: string[],
            data?: any,
            level?: number (1-3)
        }
    ],
    filename: string,
    metadata?: {
        author?: string,
        subject?: string,
        keywords?: string
    }
}
```

**Usage Example:**
```typescript
const pdfTool = new PDFGeneratorTool();

const result = await pdfTool.execute({
    title: 'Employee Onboarding Report',
    filename: 'onboarding_report',
    metadata: {
        author: 'HR Department',
        subject: 'New Employee Onboarding',
        keywords: 'HR, Onboarding, Employee'
    },
    content: [
        {
            type: 'heading',
            text: 'Introduction',
            level: 1
        },
        {
            type: 'paragraph',
            text: 'This document outlines the onboarding process for new employees.'
        },
        {
            type: 'list',
            items: [
                'Complete HR paperwork',
                'Set up company email',
                'Attend orientation'
            ]
        },
        {
            type: 'table',
            data: [
                { name: 'John Doe', department: 'Engineering', startDate: '2025-01-15' },
                { name: 'Jane Smith', department: 'Marketing', startDate: '2025-01-20' }
            ]
        }
    ]
});

// Result:
// {
//     success: true,
//     data: {
//         filename: 'onboarding_report.pdf',
//         filepath: '/path/to/generated/pdfs/onboarding_report.pdf',
//         size: 45678,
//         sizeFormatted: '44.61 KB',
//         pages: 2,
//         message: 'PDF generated successfully: onboarding_report.pdf'
//     }
// }
```

**Output Location:** `generated/pdfs/`

---

### 3. CSV Generator Tool (`src/tools/utils/CSVGeneratorTool.ts`)

Export data to CSV format with custom delimiters and headers.

**Features:**
- Custom delimiter support
- Optional headers
- Automatic CSV escaping
- File size reporting
- Row/column counting

**Schema:**
```typescript
{
    filename: string,
    data: Array<Record<string, any>>,
    headers?: string[],
    delimiter?: string (default: ','),
    includeHeaders?: boolean (default: true)
}
```

**Usage Example:**
```typescript
const csvTool = new CSVGeneratorTool();

const result = await csvTool.execute({
    filename: 'employees',
    data: [
        { id: 'EMP001', name: 'John Doe', email: 'john@company.com', department: 'Engineering' },
        { id: 'EMP002', name: 'Jane Smith', email: 'jane@company.com', department: 'Marketing' }
    ],
    headers: ['id', 'name', 'email', 'department'],
    delimiter: ',',
    includeHeaders: true
});

// Result:
// {
//     success: true,
//     data: {
//         filename: 'employees.csv',
//         filepath: '/path/to/generated/csv/employees.csv',
//         rows: 2,
//         columns: 4,
//         size: 156,
//         sizeFormatted: '156 Bytes',
//         headers: ['id', 'name', 'email', 'department'],
//         message: 'CSV generated successfully: employees.csv'
//     }
// }
```

**Output Location:** `generated/csv/`

**CSV Escaping:**
- Automatically handles commas in values
- Escapes double quotes
- Handles newlines in values

---

### 4. Word/DOCX Generator Tool (`src/tools/utils/WordGeneratorTool.ts`)

Create Microsoft Word documents from structured content.

**Features:**
- Multiple content types (headings, paragraphs, lists, tables)
- Text formatting (bold, italic)
- 3 heading levels
- Custom metadata
- Professional formatting

**Schema:**
```typescript
{
    title: string,
    content: [
        {
            type: 'heading' | 'paragraph' | 'list' | 'table',
            text?: string,
            items?: string[],
            data?: any,
            level?: number (1-3),
            bold?: boolean,
            italic?: boolean
        }
    ],
    filename: string,
    metadata?: {
        author?: string,
        subject?: string,
        keywords?: string
    }
}
```

**Usage Example:**
```typescript
const wordTool = new WordGeneratorTool();

const result = await wordTool.execute({
    title: 'Project Status Report',
    filename: 'project_status',
    metadata: {
        author: 'Project Manager',
        subject: 'Monthly Status Update'
    },
    content: [
        {
            type: 'heading',
            text: 'Executive Summary',
            level: 1
        },
        {
            type: 'paragraph',
            text: 'The project is on track and within budget.',
            bold: true
        },
        {
            type: 'heading',
            text: 'Milestones Completed',
            level: 2
        },
        {
            type: 'list',
            items: [
                'Phase 1: Requirements gathering',
                'Phase 2: Design and architecture',
                'Phase 3: Implementation started'
            ]
        }
    ]
});

// Result:
// {
//     success: true,
//     data: {
//         filename: 'project_status.docx',
//         filepath: '/path/to/generated/docx/project_status.docx',
//         size: 12345,
//         sizeFormatted: '12.06 KB',
//         sections: 4,
//         message: 'Word document generated successfully: project_status.docx'
//     }
// }
```

**Output Location:** `generated/docx/`

---

## 🔗 Integration with Agents

### Enhanced Employee Directory

The Employee Directory tool now uses validators:

```typescript
// Email validation before creating employee
const emailValidation = Validator.email.validate(email);
if (!emailValidation.valid) {
    return { success: false, error: emailValidation.error };
}

// Phone validation
if (phone) {
    const phoneValidation = Validator.phone.validate(phone);
    if (!phoneValidation.valid) {
        return { success: false, error: phoneValidation.error };
    }
}

// Duplicate email check
const existingEmail = await employees.findOne({ 
    email: Validator.email.normalize(email) 
});

// Normalize and store
await employees.insertOne({
    email: Validator.email.normalize(email),
    phone: Validator.phone.normalize(phone)
});
```

---

## 📊 Use Cases

### 1. Employee Reports (PDF)
Generate onboarding reports, performance reviews, or employee handbooks.

### 2. Data Export (CSV)
Export employee lists, inventory data, production schedules, or quality metrics.

### 3. Documentation (Word)
Create project proposals, status reports, or policy documents.

### 4. Data Validation
Ensure email and phone numbers are valid before storing in database.

---

## 🎯 Benefits

1. **Data Quality**: Validation ensures clean data in database
2. **Consistency**: Normalized emails and phones prevent duplicates
3. **Professional Output**: PDF and Word documents look polished
4. **Reusability**: Tools can be used across all agents
5. **Error Prevention**: Validation catches issues before they cause problems
6. **Export Flexibility**: CSV for spreadsheets, PDF for reports, Word for editing

---

## 📦 Dependencies

```json
{
    "pdfkit": "^0.17.2",
    "@types/pdfkit": "^0.17.3",
    "docx": "^9.5.1",
    "zod": "^3.x"
}
```

---

## 🚀 Future Enhancements

1. **Excel Generator**: Add XLSX export support
2. **Email Sender**: Send generated documents via email
3. **Template Support**: PDF/Word templates with placeholders
4. **Batch Processing**: Generate multiple documents at once
5. **Cloud Storage**: Upload to S3, Google Drive, etc.
6. **Digital Signatures**: Sign PDF documents
7. **Watermarks**: Add watermarks to PDFs
8. **More Validators**: URL, credit card, SSN, etc.

---

## ✅ Status

- [x] Email Validator
- [x] Phone Validator
- [x] Date Validator
- [x] String Validator
- [x] Number Validator
- [x] PDF Generator
- [x] CSV Generator
- [x] Word Generator
- [x] Employee Directory Integration
- [ ] Manufacturing Tools Integration
- [ ] Construction Tools Integration

**All utilities are production-ready and tested!** 🎉
