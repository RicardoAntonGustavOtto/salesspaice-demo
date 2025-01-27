export const prompts = {
  brainstorm: {
    prompt: (variables: Record<string, any>) => `
${variables.system_prompt}

Chat History:
${variables.chat_history}

User: ${variables.user_input}
Assistant:`,
    model: "perplexity",  // or whatever model you're using
    provider: "perplexity" as const
  }
} as const; 