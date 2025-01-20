import { writable } from 'svelte/store';
import type { Company } from '$lib/types/company';

function createCompanyStore() {
  const { subscribe, set, update } = writable<Company | null>(null);

  return {
    subscribe,
    set,
    update,
    updateResearch: (research_result: any[]) => 
      update(company => company ? { ...company, research_result } : null),
    updateAnnualReport: (annual_report: any) => 
      update(company => company ? { ...company, annual_report } : null),
    updateProspects: (prospects: any[]) => 
      update(company => company ? { ...company, prospects } : null),
    updateColdCallingGuides: (cold_calling_guides: any[]) => 
      update(company => company ? { ...company, cold_calling_guides } : null),
    updateEmailDrafts: (cold_email_drafts: any[]) => 
      update(company => company ? { ...company, cold_email_drafts } : null),
    clear: () => set(null)
  };
}

export const companyStore = createCompanyStore(); 