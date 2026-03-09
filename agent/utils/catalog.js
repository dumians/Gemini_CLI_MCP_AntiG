/**
 * Agentic Data Mesh: Catalog & Governance Utility
 * Centralizes agent discovery and enforces data contracts.
 */

/**
 * The Standard Data Product Contract.
 * Every agent in the mesh MUST return an object that satisfies this structure.
 */
export const DataProductContract = {
    domain: (val) => typeof val === 'string' && val.length > 0,
    data: (val) => typeof val === 'string' || (typeof val === 'object' && val !== null),
    metadata: (val) => typeof val === 'object' && val !== null && 'confidence' in val && 'source' in val,
    insights: (val) => typeof val === 'string'
};

/**
 * Agent Registry
 * Stores metadata about available agents for dynamic discovery by the Orchestrator.
 */
export const AgentRegistry = [
    {
        id: "financial_agent",
        name: "FinancialAgent",
        domain: "Finance",
        specialty: "Oracle ERP, Invoices, Suppliers, Graph Grounding",
        toolName: "call_financial_agent"
    },
    {
        id: "retail_agent",
        name: "RetailAgent",
        domain: "Retail",
        specialty: "Spanner Global Inventory, Transactions, Supply Chain Grounding",
        toolName: "call_retail_agent"
    },
    {
        id: "analytics_agent",
        name: "AnalyticsAgent",
        domain: "Analytics",
        specialty: "BigQuery Marketing Segments, AlloyDB CRM Data",
        toolName: "call_analytics_agent"
    },
    {
        id: "hr_agent",
        name: "HRAgent",
        domain: "HR",
        specialty: "Oracle HR, Employee Recruitment, Department Resource Planning",
        toolName: "call_hr_agent"
    }
];

/**
 * Validates a Data Product against the mesh contract.
 * @param {object} product The agent's response.
 * @param {string} agentName Name of the responding agent.
 * @returns {object} The validated product.
 * @throws {Error} If validation fails.
 */
export function validateDataProduct(product, agentName) {
    const errors = [];

    for (const [key, validator] of Object.entries(DataProductContract)) {
        if (!(key in product) || !validator(product[key])) {
            errors.push(`Missing or invalid field: ${key}`);
        }
    }

    if (errors.length > 0) {
        console.error(`[Data Contract Violation] Agent: ${agentName}`, errors);
        throw new Error(`Data Product from ${agentName} violated the mesh contract: ${errors.join(', ')}`);
    }

    return product;
}

/**
 * Generates the Gemini function declarations for the Orchestrator 
 * dynamically from the Agent Registry.
 */
export function getDiscoveryTools() {
    return [
        {
            functionDeclarations: AgentRegistry.map(agent => ({
                name: agent.toolName,
                description: `Delegate a query to the ${agent.domain} Specialist (${agent.specialty}).`,
                parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] }
            }))
        }
    ];
}
