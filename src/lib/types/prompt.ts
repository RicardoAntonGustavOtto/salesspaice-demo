export interface Prompt {
  id: string;
  name: string;
  model: string;
  provider: string;
  content: string;
}

export interface ModelOption {
  provider: string;
  label: string;
}

export interface ModelOptions {
  [key: string]: ModelOption;
}

export type PromptUpdate = Partial<Prompt>; 