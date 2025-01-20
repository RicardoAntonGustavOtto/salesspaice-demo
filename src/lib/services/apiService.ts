export type ModelProvider = 'gpt-4' | 'gpt-3.5-turbo' | 'claude-2' | 'palm-2';

export async function callProxy(prompt: string, provider: ModelProvider, model: string) {
  // ... existing code ...
}