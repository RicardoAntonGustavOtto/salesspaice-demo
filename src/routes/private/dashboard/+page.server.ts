import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
    const { data: companies } = await supabase
        .from('targetcompanies')
        .select(`
            *,
            notesCount:notes(count),
            meetingsCount:meetings(count),
            lastActivity:activities(
                created_at
            )
        `)
        .order('name');

    return {
        companies: companies?.map(company => ({
            ...company,
            notesCount: company.notesCount?.[0]?.count ?? 0,
            meetingsCount: company.meetingsCount?.[0]?.count ?? 0,
            lastActivity: company.lastActivity?.[0]?.created_at ? 
                new Date(company.lastActivity[0].created_at).toLocaleDateString() : 
                'Never'
        }))
    };
}; 