import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  const url = new URL(req.url)
  const campaignId = url.searchParams.get('campaign_id')
  const redirectUrl = url.searchParams.get('url') || 'https://tickofiesta.com'

  if (campaignId) {
    // Utilisation de la fonction SQL (RPC) pour une incrémentation atomique
    // C'est beaucoup plus efficace que de faire un select puis un update
    await supabase
      .rpc('increment_campaign_clicks', { campaign_id_input: campaignId })
  }

  // Redirige l'utilisateur immédiatement après l'appel
  return Response.redirect(decodeURIComponent(redirectUrl), 302)
})