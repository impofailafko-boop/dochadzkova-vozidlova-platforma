import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Input validation schema
    const questionSchema = z.object({
      question: z.string().trim().min(1, 'Otázka nemôže byť prázdna').max(1000, 'Otázka je príliš dlhá'),
    });

    const validation = questionSchema.safeParse(body);
    if (!validation.success) {
      const errorMessage = validation.error.errors[0]?.message || 'Neplatná otázka';
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { question } = validation.data;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract and verify authenticated user from JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user has admin role
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError || !roles || !roles.some(r => r.role === 'admin')) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - len admini môžu používať AI reports' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('AI Reports: Admin user authenticated successfully');
    const authenticatedUserId = user.id;

    // Fetch relevant data from database
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const [attendanceRes, drivesRes, fuelingsRes, projectsRes, vehiclesRes, profilesRes] = await Promise.all([
      supabase.from('attendance').select('*').gte('date', firstDayOfMonth).lte('date', lastDayOfMonth),
      supabase.from('vehicle_logs').select('*, vehicles(*), projects(*), profiles(full_name)').gte('date', firstDayOfMonth).lte('date', lastDayOfMonth),
      supabase.from('fuel_logs').select('*, vehicles(*), projects(*), profiles(full_name)').gte('date', firstDayOfMonth).lte('date', lastDayOfMonth),
      supabase.from('projects').select('*'),
      supabase.from('vehicles').select('*'),
      supabase.from('profiles').select('full_name, user_id'),
    ]);

    // Prepare context for AI
    const context = `
Dáta z firemného systému za aktuálny mesiac (${firstDayOfMonth} až ${lastDayOfMonth}):

DOCHÁDZKA:
${JSON.stringify(attendanceRes.data, null, 2)}

JAZDY VOZIDIEL:
${JSON.stringify(drivesRes.data, null, 2)}

TANKOVANIA:
${JSON.stringify(fuelingsRes.data, null, 2)}

PROJEKTY:
${JSON.stringify(projectsRes.data, null, 2)}

VOZIDLÁ:
${JSON.stringify(vehiclesRes.data, null, 2)}

ZAMESTNANCI:
${JSON.stringify(profilesRes.data, null, 2)}
`;

    const systemPrompt = `Si AI asistent pre analýzu firemných dát spoločnosti.
Máš prístup k dátam o dochádzke, jazdách vozidiel, tankovaní a projektoch.

Tvoja úloha:
- Analyzuj poskytnuté dáta a odpovedaj na otázky používateľa
- Buď konkrétny a uvádzaj presné čísla a štatistiky
- Poskytuj praktické odporúčania a návrhy na zlepšenie
- Odpovedaj VÝHRADNE v slovenčine
- Buď stručný ale informatívny
- Ak sa pýtajú na dáta, ktoré nemáš, povedz to jasne
- NIKDY nepoužívaj markdown formátovanie, úvodzovky alebo špeciálne znaky
- Odpovedaj ako v bežnej konverzácii - čistý text bez formátovania

Formátuj odpovede prehľadne:
- Používaj zoznamy cez pomlčky
- Pre nový riadok použi jednoducho Enter
- Nepouživaj markdown, úvodzovky, hviezdičky ani iné špeciálne znaky
- Píš v prirodzenom, konverzačnom štýle

Ak dáta chýbajú alebo sú neúplné, povedz to používateľovi a pracuj s tým, čo máš.`;

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `${context}\n\nOtázka používateľa: ${question}` },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Prekročený limit požiadaviek. Skúste to neskôr.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Potrebné doplniť kredity v Lovable AI workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Chyba AI služby' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Stream the response back
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
      },
    });

  } catch (error) {
    console.error('Error in ai-reports function:', error);
    return new Response(
      JSON.stringify({ error: 'Vyskytla sa chyba pri spracovaní požiadavky. Skúste to znova.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
