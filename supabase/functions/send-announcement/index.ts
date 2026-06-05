import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
  }

  try {
    const { title, message, emails } = await req.json();

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "TickoFiesta <notifications@tickofiesta.com>",
        to: emails,
        subject: title,
        html: `
          <div style="background-color: #f3f4f6; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
              
              <div style="background: linear-gradient(135deg, #4f46e5, #c026d3); padding: 40px 20px; text-align: center;">
                <img src="https://kmtnulchjoljeyplfoin.supabase.co/storage/v1/object/public/avatars/logo-tickofiesta.png" alt="TickoFiesta" style="width: 160px; margin-bottom: 24px; display: block; margin-left: auto; margin-right: auto;"/>
                <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700; letter-spacing: 0.5px;">
                  ${title}
                </h1>
              </div>

              <div style="padding: 40px 30px; color: #374151; font-size: 16px; line-height: 1.8;">
                <div style="background-color: #f9fafb; border-left: 4px solid #c026d3; padding: 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
                  <p style="margin: 0;">${message.replace(/\n/g, '<br/>')}</p>
                </div>
                
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 4px 0; font-size: 15px; font-weight: 700; color: #111827;">L'équipe TickoFiesta</p>
                  <p style="margin: 0 0 12px 0; font-size: 13px; color: #7c3aed; font-weight: 500;">Service Relation Organisateurs & Partenaires</p>
                  
                  <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">
                    📧 <a href="mailto:support@tickofiesta.com" style="color: #6b7280; text-decoration: none;">support@tickofiesta.com</a><br/>
                    🌐 <a href="https://www.tickofiesta.com" style="color: #7c3aed; text-decoration: none; font-weight: bold;">www.tickofiesta.com</a>
                  </p>
                </div>
              </div>

              <div style="background-color: #111827; padding: 24px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #1f2937;">
                <p style="margin: 0 0 4px 0; font-weight: bold; color: #ffffff;">TickoFiesta Inc.</p>
                <p style="margin: 0 0 4px 0;">Abidjan, Côte d'Ivoire</p>
                <p style="margin: 0; font-size: 11px; color: #6b7280;">Vous recevez cet e-mail car vous êtes inscrit sur TickoFiesta.</p>
              </div>

            </div>
          </div>
        `
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), { 
      status: res.ok ? 200 : 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
})