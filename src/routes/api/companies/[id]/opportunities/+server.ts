import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, locals: { supabase } }) => {
    const opportunity = await request.json();

    // Remove any undefined or empty string values
    const cleanedOpportunity = {
        name: opportunity.name,
        target_customer_id: params.id,
        description: opportunity.description,
        stage: opportunity.stage,
        type: opportunity.type,
        probability: opportunity.probability,
        currency: opportunity.currency,
        amount: opportunity.amount,
        next_step: opportunity.next_step || null,
        // Only include close_date if it's not empty
        ...(opportunity.close_date ? { close_date: opportunity.close_date } : {})
    };

    const { data, error } = await supabase
        .from('opportunities')
        .insert(cleanedOpportunity)
        .select()
        .single();

    if (error) {
        console.error('Error creating opportunity:', error);
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    return json(data);
};

export const DELETE: RequestHandler = async ({ params, url, locals: { supabase } }) => {
    const opportunityId = url.searchParams.get('opportunityId');

    if (!opportunityId) {
        return new Response(JSON.stringify({ error: 'Opportunity ID is required' }), { 
            status: 400,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    const { error } = await supabase
        .from('opportunities')
        .delete()
        .eq('id', opportunityId)
        .eq('target_customer_id', params.id);

    if (error) {
        console.error('Error deleting opportunity:', error);
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    return new Response(null, { status: 204 });
}; 