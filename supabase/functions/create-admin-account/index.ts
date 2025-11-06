import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Input validation schema
    const createAdminSchema = z.object({
      email: z.string().email('Neplatný email').max(255, 'Email je príliš dlhý'),
      password: z.string().min(8, 'Heslo musí mať minimálne 8 znakov').max(100, 'Heslo je príliš dlhé'),
      fullName: z.string().trim().min(2, 'Meno musí mať minimálne 2 znaky').max(100, 'Meno je príliš dlhé'),
      phone: z.string().regex(/^(\+421|0)?[0-9]{9}$/, 'Neplatné telefónne číslo'),
    });

    // Validate inputs
    const validation = createAdminSchema.safeParse(body);
    if (!validation.success) {
      const errorMessage = validation.error.errors[0]?.message || 'Neplatné vstupné údaje';
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, password, fullName, phone } = validation.data;

    // Normalize phone number to +421XXXXXXXXX format
    let normalizedPhone = phone.replace(/[\s\-]/g, ''); // Remove spaces and dashes
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '+421' + normalizedPhone.slice(1);
    } else if (!normalizedPhone.startsWith('+')) {
      normalizedPhone = '+421' + normalizedPhone;
    }
    
    // Validate final phone format
    if (!/^\+421[0-9]{9}$/.test(normalizedPhone)) {
      return new Response(
        JSON.stringify({ error: 'Neplatný formát telefónneho čísla' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Extract and verify authenticated user from JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user has admin role using service role client
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError || !roles || !roles.some(r => r.role === 'admin')) {
      console.log('Create Admin Account: Access denied - user is not admin');
      return new Response(
        JSON.stringify({ error: 'Iba administrátor môže vytvoriť administrátorský účet' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create user using Admin API (secure method)
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for admin-created accounts
      user_metadata: {
        full_name: fullName,
        phone: normalizedPhone,
      },
    });

    if (createError) {
      console.error('Create Admin Account: Failed to create user:', createError);
      
      // Map errors to user-friendly messages
      let userMessage = 'Nepodarilo sa vytvoriť používateľa';
      if (createError.message?.includes('already registered')) {
        userMessage = 'Používateľ s týmto emailom už existuje';
      } else if (createError.message?.includes('password')) {
        userMessage = 'Slabé heslo. Použite silnejšie heslo.';
      }
      
      return new Response(
        JSON.stringify({ error: userMessage }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!newUser.user) {
      return new Response(
        JSON.stringify({ error: 'Nepodarilo sa vytvoriť používateľa' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update phone in profiles (triggers will create the profile)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ phone: normalizedPhone })
      .eq('user_id', newUser.user.id);

    if (profileError) {
      console.error('Create Admin Account: Failed to update profile:', profileError);
    }

    // Add admin role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: newUser.user.id, role: 'admin' });

    if (roleError) {
      console.error('Create Admin Account: Failed to assign admin role:', roleError);
      
      // Rollback: delete the created user
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      
      return new Response(
        JSON.stringify({ error: 'Nepodarilo sa vytvoriť administrátorský účet. Skúste to znova.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Audit log: record admin account creation
    console.log(`AUDIT: Admin account created | CreatedBy: ${user.id} (${user.email}) | NewAdmin: ${newUser.user.id} (${email}) | Timestamp: ${new Date().toISOString()}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId: newUser.user.id,
        message: 'Administrátorský účet bol úspešne vytvorený' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Create Admin Account: Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Vyskytla sa chyba pri vytváraní účtu. Skúste to znova.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
