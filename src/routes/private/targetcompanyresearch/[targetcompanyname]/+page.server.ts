import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Company } from '$lib/types/company';

interface ParentData {
    company?: Company;
    session: App.Session | null;
    cookies: { name: string; value: string; }[];
}

export const load = (async ({ params, locals: { supabase }, parent }) => {
    const parentData = await parent() as ParentData;
    const targetCompanyName = decodeURIComponent(params.targetcompanyname);
    
    try {
        // Try to get company from parent data first
        if (parentData.company) {
            return {
                company: parentData.company
            };
        }

        // If not in parent data, query the database
        const { data: company, error: err } = await supabase
            .from('targetcompanies')
            .select('*')
            .ilike('name', targetCompanyName)
            .single();

        if (err) {
            console.error('Error fetching company:', err);
            throw error(404, 'Company not found');
        }

        if (!company) {
            console.error('No company found with name:', targetCompanyName);
            throw error(404, 'Company not found');
        }

        return {
            company
        };
    } catch (err) {
        console.error('Unexpected error in load function:', err);
        throw error(404, 'Company not found');
    }
}) satisfies PageServerLoad; 