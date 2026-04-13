import fs from 'fs';
import path from 'path';
import { logger } from "./logging_service.js";

export class MCPToolbox {
    constructor() {
        this.csvMapping = {
            'ebs_agent': 'ebs_orders.csv',
            'jde_agent': 'jde_accounts.csv',
            'siebel_agent': 'siebel_leads.csv',
            'brm_agent': 'brm_invoices.csv',
            'flexcube_agent': 'flexcube_transactions.csv'
        };
    }

    /**
     * Provides a standardized local read_csv fallback tool.
     */
    getFallbackCsvTool(agentId) {
        const fileName = this.csvMapping[agentId] || `${agentId}.csv`;
        
        return {
            name: "read_csv",
            description: `Standardized CSV reader utility for domain ${agentId}. Reads from test-data.`,
            inputSchema: { type: "object", properties: {} },
            _client: {
                callTool: async () => {
                    const csvPath = path.join(process.cwd(), 'test-data', fileName);
                    if (fs.existsSync(csvPath)) {
                        const content = fs.readFileSync(csvPath, 'utf8');
                        return { content: [{ text: content }] };
                    } else {
                        logger.log("MCPToolbox", `Fallback file missing: ${csvPath}`, "WARNING");
                        return { content: [{ text: `Data not found at: ${csvPath}` }] };
                    }
                }
            }
        };
    }

    /**
     * Checks if a domain requires fallback tools and injects them.
     */
    injectStandardTools(tools, agentId, domain) {
        const fallbackDomains = ["Oracle EBS", "JD Edwards", "Siebel CRM", "Oracle BRM", "Oracle FlexCube", "EBS", "JDE", "Siebel", "BRM", "FlexCube"];
        
        if (tools.length === 0 && fallbackDomains.includes(domain)) {
            logger.log("MCPToolbox", `Injecting standard read_csv tool from MCP Toolbox for: ${domain}`, "INFO");
            tools.push(this.getFallbackCsvTool(agentId));
        }
        return tools;
    }
}

export const mcpToolbox = new MCPToolbox();
