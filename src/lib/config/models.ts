import type { ModelOptions } from '$lib/types/prompt';

export const MODEL_OPTIONS: ModelOptions = {
  'gpt-4': { provider: 'openai', label: 'GPT-4' },
  'gpt-4-turbo': { provider: 'openai', label: 'GPT-4 Turbo' },
  'gpt-3.5-turbo': { provider: 'openai', label: 'GPT-3.5 Turbo' },
  'claude-3-opus': { provider: 'anthropic', label: 'Claude 3 Opus' },
  'claude-3-sonnet': { provider: 'anthropic', label: 'Claude 3 Sonnet' },
  'claude-3-haiku': { provider: 'anthropic', label: 'Claude 3 Haiku' },
  'llama-3.1-sonar-large-128k-online': { provider: 'perplexity', label: 'Llama 3.1 Sonar Large' },
}; 