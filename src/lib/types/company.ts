import type { ProspectProps } from './prospect';

export interface ColdCallingGuide {
  id: string;
  prospect: ProspectProps;
  content: string;
  generated_at: string;
}

export interface EmailDraft {
  id: string;
  prospect: ProspectProps;
  content: string;
  generated_at: string;
}

export interface Company {
  id: string;
  name: string;
  website?: string;
  description?: string;
  research_result?: ResearchResult[];
  prospects?: ProspectProps[];
  annual_report?: AnnualReport[];
  cold_email_drafts?: EmailDraft[];
  cold_calling_guides?: ColdCallingGuide[];
}

export interface ResearchResult {
  research_date: string;
  research_content: string;
  citations?: string[];
}

export interface AnnualReport {
  year: string;
  url: string;
}

export interface PageData {
  company: Company;
}