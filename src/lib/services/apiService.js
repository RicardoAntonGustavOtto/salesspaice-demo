/** @format */

/**
 * @typedef {'openai' | 'anthropic' | 'perplexity'} ModelProvider
 */

const API_BASE_URL = "https://sales-spaice-api-rickenforcer488.replit.app/api";

/**
 * Call the AI model proxy with a message
 * @param {string} message - The message to send to the model
 * @param {ModelProvider} modelProvider - The AI model provider to use
 * @param {string} modelName - The specific model name
 * @returns {Promise<string>} The model's response
 */
export async function callProxy(message, modelProvider, modelName) {
  try {
    // Debug logging
    console.log("Making API call with:", { modelProvider, modelName });
    
    const response = await fetch(`${API_BASE_URL}/${modelProvider}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, modelName }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("API Response:", data);

    switch (modelProvider) {
      case "openai":
        return data.choices[0].message.content;
      case "anthropic":
        return data[0].messageList[1].content;
      case "perplexity":
        return data;
      default:
        throw new Error(`Unknown model provider: ${modelProvider}`);
    }
  } catch (error) {
    console.error("API call failed:", error);
    throw error;
  }
}

/**
 * Generate research about a company
 * @param {string} companyName - Name of the company
 * @param {string} companyWebsite - Website of the company
 * @returns {Promise<string>} Research results
 */
export async function generateCompanyResearch(companyName, companyWebsite) {
  try {
    const response = await fetch("/api/research", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        companyName,
        companyWebsite,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate research");
    }

    const data = await response.json();
    return data.research;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

/**
 * Generate a cold calling script
 * @param {string} companyInfo - Information about the company
 * @returns {Promise<string>} Generated script
 */
export async function generateColdCallScript(companyInfo) {
  const prompt = `Based on this company information, generate a natural cold calling script:
${companyInfo}

Include:
1. Introduction
2. Value proposition
3. Qualifying questions
4. Handling common objections
5. Next steps

Make it sound natural and conversational.`;

  return callProxy(prompt, "openai", "gpt-3.5-turbo");
}

/**
 * Generate a brainstorming session
 * @param {string} topic - Topic to brainstorm about
 * @returns {Promise<string>} Brainstorming results
 */
export async function generateBrainstormSession(topic) {
  const prompt = `Let's brainstorm ideas about: ${topic}

Please provide:
1. Key challenges
2. Potential solutions
3. Creative approaches
4. Action items
5. Next steps

Format the response in markdown with clear sections.`;

  return callProxy(prompt, "openai", "gpt-3.5-turbo");
}

/**
 * Generate analysis from annual report
 * @param {string} companyName - Name of the company
 * @param {string} companyWebsite - Website of the company
 * @param {string} fileData - Base64 encoded file data
 * @returns {Promise<string>} Analysis results
 */
export async function generateAnnualReportAnalysis(
  companyName,
  companyWebsite,
  fileData
) {
  const prompt = `Please analyze this annual report for ${companyName} (${companyWebsite}):
${fileData}

Please provide:
1. Key financial metrics and trends
2. Business strategy insights
3. Market position analysis
4. Risk factors
5. Growth opportunities
6. Notable developments

Format the response in markdown.`;

  return callProxy(prompt, "openai", "gpt-3.5-turbo");
}

/**
 * Generate prospect research
 * @param {string} companyName - Name of the company
 * @param {string} prospectUrl - LinkedIn profile URL of the prospect
 * @returns {Promise<string>} Prospect research results
 */
export async function generateProspectResearch(companyName, prospectUrl) {
  const prompt = `Please analyze this prospect for ${companyName}:
LinkedIn Profile: ${prospectUrl}

Please provide:
1. Background summary
2. Current role and responsibilities
3. Career progression
4. Key achievements
5. Potential pain points or needs
6. Conversation starters
7. Recommended approach

Format the response in markdown.`;

  return callProxy(prompt, "openai", "gpt-3.5-turbo");
}
