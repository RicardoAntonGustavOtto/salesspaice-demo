import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals: { supabase } }) => {
    const { data, error } = await supabase
        .from('targetcompanies')
        .select('research_result')
        .eq('id', params.id)
        .single();

    if (error) {
        console.error('Error fetching research:', error);
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    // Return the latest research result if it exists
    const researchResults = data.research_result || [];
    const latestResearch = researchResults.length > 0 ? researchResults[researchResults.length - 1] : null;
    
    return json(latestResearch);
}; 