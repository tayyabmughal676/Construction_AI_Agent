import { StateGraph, START, END } from "@langchain/langgraph";
import { LangGraphState } from "./state";
import { AgentRegistry } from "../../agents/AgentRegistry";
import { logger } from "../../config/logger";
import { PDFGeneratorTool } from "../../tools/utils/PDFGeneratorTool";

/**
 * Executive Report Workflow
 * 1. Gather Data (Multi-Agent aggregation)
 * 2. Generate PDF
 * 3. Email Report
 */

const gatherDataNode = async (state: LangGraphState) => {
    logger.info("LangGraph: Gathering executive report data...");
    const registry = AgentRegistry.getInstance();
    const constructionAgent = registry.getAgent('construction');
    const mfgAgent = registry.getAgent('manufacturing');
    const hrAgent = registry.getAgent('hr');

    if (!constructionAgent || !mfgAgent || !hrAgent) {
        return { errors: ["Required agents missing for report generation."] };
    }

    try {
        // Concurrently fetch data
        const [projects, qc, employees] = await Promise.all([
            constructionAgent.executeTool('project_tracker', { action: 'list' }),
            mfgAgent.executeTool('quality_control_logger', { action: 'quality_metrics', period: 30 }),
            hrAgent.executeTool('employee_directory', { action: 'list' })
        ]);

        const aggregatedData = {
            activeProjects: projects.success ? projects.data.projects.length : 0,
            qcPassRate: qc.success ? (qc.data.overallPassRate || "N/A") : "N/A",
            totalEmployees: employees.success ? employees.data.employees.length : 0
        };

        return {
            data: { ...state.data, reportData: aggregatedData },
            results: [{ step: "Gather Data", success: true }]
        };
    } catch (error) {
        return { errors: [error instanceof Error ? error.message : "Error gathering data"] };
    }
};

const generatePDFNode = async (state: LangGraphState) => {
    logger.info("LangGraph: Generating PDF report...");
    
    const reportData = state.data.reportData || { activeProjects: 0, qcPassRate: 'N/A', totalEmployees: 0 };

    const pdfTool = new PDFGeneratorTool();
    const result = await pdfTool.execute({
        title: "Monthly Executive Report",
        filename: state.data.filename || "monthly_executive_report",
        content: [
            {
                type: 'heading',
                text: 'Executive Summary KPI Metrics',
                level: 1
            },
            {
                type: 'paragraph',
                text: `Active Construction Projects: ${reportData.activeProjects}`
            },
            {
                type: 'paragraph',
                text: `Manufacturing QC Pass Rate: ${reportData.qcPassRate}`
            },
            {
                type: 'paragraph',
                text: `Total Workforce Headcount: ${reportData.totalEmployees}`
            }
        ]
    });

    if (result.success) {
        return {
            data: { ...state.data, pdfPath: result.data.filepath, downloadUrl: `/api/files/pdfs/${result.data.filename}` },
            results: [{ step: "Generate PDF", filePath: result.data.filepath, downloadUrl: `/api/files/pdfs/${result.data.filename}` }]
        };
    }
    return { errors: [result.error] };
};

const emailReportNode = async (state: LangGraphState) => {
    logger.info("LangGraph: Emailing executive report...");
    const registry = AgentRegistry.getInstance();
    const hrAgent = registry.getAgent('hr');

    if (!hrAgent) return { errors: ["HR Agent not found"] };

    const emailBody = `
Please find attached the latest automated Executive Summary Report.

Path to PDF: ${state.data.pdfPath}
    `.trim();

    const result = await hrAgent.executeTool('email_sender', {
        to: state.data.execEmail || 'executives@company.com',
        subject: `Monthly Executive Report`,
        body: emailBody
    });

    return {
        results: [{ step: "Email Report", success: result.success }]
    };
};

const checkSuccess = (nextStep: string) => (state: LangGraphState) => {
    if (state.errors.length > 0) return END;
    return nextStep;
};

const workflow = new StateGraph(LangGraphState)
    .addNode("gatherData", gatherDataNode)
    .addNode("generatePDF", generatePDFNode)
    .addNode("emailReport", emailReportNode)
    .addEdge(START, "gatherData")
    .addConditionalEdges("gatherData", checkSuccess("generatePDF"))
    .addConditionalEdges("generatePDF", checkSuccess("emailReport"))
    .addEdge("emailReport", END);

export const executiveReportGraph = workflow.compile();
