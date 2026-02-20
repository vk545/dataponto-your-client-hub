import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Web Push encryption utilities
async function sendWebPush(subscription: { endpoint: string; p256dh: string; auth: string }, payload: string, vapidPublicKey: string, vapidPrivateKey: string) {
  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'TTL': '86400',
    },
    body: payload,
  });
  return response;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { title, body, sender_id, type } = await req.json();

    // Get all push subscriptions (optionally exclude sender)
    let query = supabase.from('push_subscriptions').select('*');
    
    // Only filter by sender_id if it's a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (sender_id && uuidRegex.test(sender_id)) {
      query = query.neq('user_id', sender_id);
    }

    const { data: subscriptions, error } = await query;

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch subscriptions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: 'No subscriptions found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = JSON.stringify({ title, body, type: type || 'message' });
    const results: string[] = [];

    for (const sub of subscriptions) {
      try {
        const response = await fetch(sub.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
            'TTL': '86400',
          },
          body: payload,
        });

        if (response.status === 410 || response.status === 404) {
          // Subscription expired, remove it
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
          results.push(`Removed expired subscription ${sub.id}`);
        } else if (!response.ok) {
          const text = await response.text();
          results.push(`Failed for ${sub.id}: ${response.status} - ${text}`);
        } else {
          results.push(`Sent to ${sub.id}`);
        }
      } catch (e) {
        results.push(`Error for ${sub.id}: ${e.message}`);
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
