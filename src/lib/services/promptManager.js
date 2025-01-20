/** @format */
import { prompts } from "../promptmanager/prompts.js";

export function getPrompt(promptId, variables = {}) {
  // Debug logging
  console.log("Loaded prompts:", prompts);
  console.log("Looking for promptId:", promptId);

  // Get the prompt template from the YAML file
  if (!prompts || !prompts.prompts) {
    console.error("Invalid prompts structure:", prompts);
    throw new Error("Prompts configuration not loaded correctly");
  }

  const promptTemplate = Object.values(prompts.prompts).find(
    (p) => p.id === promptId
  );

  // Debug logging
  console.log("Found template:", promptTemplate);

  if (!promptTemplate) {
    throw new Error(`Prompt template "${promptId}" not found`);
  }

  // Replace variables in the template
  let finalPrompt = promptTemplate.content;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    finalPrompt = finalPrompt.replace(regex, value || ""); // Handle undefined values
  });

  // Return both the processed prompt and the configuration, using the configured values
  return {
    prompt: finalPrompt,
    model: promptTemplate.model,
    provider: promptTemplate.provider,
  };
}
