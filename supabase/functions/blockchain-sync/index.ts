import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BlockchainMessage {
  hash: string;
  from: string;
  to: string;
  content: string;
  timestamp: number;
  verified: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, data } = await req.json();

    switch (action) {
      case 'sync_message':
        return await syncMessageToBlockchain(supabase, data);
      case 'verify_message':
        return await verifyBlockchainMessage(supabase, data);
      case 'get_blockchain_status':
        return await getBlockchainStatus(supabase);
      default:
        throw new Error('Unknown action');
    }
  } catch (error) {
    console.error('Blockchain sync error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function syncMessageToBlockchain(supabase: any, data: any) {
  const { messageId, blockchainHash, gasUsed, transactionFee } = data;

  // Update message with blockchain verification
  const { error } = await supabase
    .from('messages')
    .update({
      blockchain_hash: blockchainHash,
      blockchain_verified: true,
      gas_used: gasUsed,
      transaction_fee: transactionFee
    })
    .eq('id', messageId);

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, message: 'Message synced to blockchain' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function verifyBlockchainMessage(supabase: any, data: any) {
  const { hash, signature } = data;

  // In a real implementation, this would verify the signature against the blockchain
  // For now, we'll simulate blockchain verification
  const verified = hash && signature && hash.length === 66; // Basic validation

  const { error } = await supabase
    .from('messages')
    .update({ blockchain_verified: verified })
    .eq('blockchain_hash', hash);

  if (error) throw error;

  return new Response(
    JSON.stringify({ verified, message: 'Message verification completed' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getBlockchainStatus(supabase: any) {
  // Get blockchain statistics
  const { data: totalMessages } = await supabase
    .from('messages')
    .select('id', { count: 'exact' });

  const { data: verifiedMessages } = await supabase
    .from('messages')
    .select('id', { count: 'exact' })
    .eq('blockchain_verified', true);

  const { data: recentActivity } = await supabase
    .from('messages')
    .select('created_at, blockchain_verified, gas_used')
    .order('created_at', { ascending: false })
    .limit(10);

  return new Response(
    JSON.stringify({
      total_messages: totalMessages?.length || 0,
      verified_messages: verifiedMessages?.length || 0,
      verification_rate: totalMessages?.length 
        ? ((verifiedMessages?.length || 0) / totalMessages.length * 100).toFixed(2)
        : '0',
      recent_activity: recentActivity || [],
      ganache_connected: true,
      network: 'Ganache Local (Chain ID: 1337)'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}