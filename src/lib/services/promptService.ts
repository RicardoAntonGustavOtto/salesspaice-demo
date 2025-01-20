import { MODEL_OPTIONS } from '$lib/config/models';
import type { Prompt, PromptUpdate } from '$lib/types/prompt';

export class PromptService {
  private prompts: Record<string, Omit<Prompt, 'name'>>;

  constructor(initialPrompts: Record<string, Omit<Prompt, 'name'>>) {
    this.prompts = initialPrompts;
    this.loadFromStorage();
  }

  getAllPrompts(): Prompt[] {
    return Object.entries(this.prompts).map(([name, prompt]) => ({
      ...prompt,
      name
    }));
  }

  getPrompt(name: string): Prompt | null {
    const prompt = this.prompts[name];
    return prompt ? { ...prompt, name } : null;
  }

  updatePrompt(name: string, update: PromptUpdate): boolean {
    if (this.prompts[name]) {
      this.prompts[name] = {
        ...this.prompts[name],
        ...update
      };
      this.saveToStorage();
      return true;
    }
    return false;
  }

  private saveToStorage(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('savedPrompts', JSON.stringify(this.prompts));
    }
  }

  private loadFromStorage(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('savedPrompts');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.prompts = {
          ...this.prompts,
          ...parsed
        };
      }
    }
  }
} 