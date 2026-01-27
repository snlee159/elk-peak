import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * CONTACT FORM SUBMISSION ENDPOINT
 * 
 * Capability: Submit contact form data
 * Security: Write-only, validates input, rate-limited, origin-checked
 * 
 * This endpoint:
 * 1. Validates and saves submission to Supabase database
 * 2. Sends email notification via Resend (server-side)
 * 
 * Resend API key stored securely in Supabase secrets (never exposed to client).
 * 
 * Input validation:
 * - name: 1-100 chars
 * - email: valid email format
 * - message: 1-1000 chars
 * - Optional: company (if provided, 1-100 chars)
 */

interface ContactFormData {
  name: string;
  email: string;
  message: string;
  company?: string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimits = new Map<string, RateLimitEntry>();

function getRateLimitKey(req: Request): string {
  const ip = req.headers.get("x-forwarded-for") || 
             req.headers.get("x-real-ip") || 
             "unknown";
  return ip;
}

function checkRateLimit(key: string, maxRequests = 5, windowMs = 3600000): boolean {
  const now = Date.now();
  const entry = rateLimits.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimits.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateInput(data: any): { valid: boolean; error?: string; data?: ContactFormData } {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Invalid request body" };
  }

  const { name, email, message, company } = data;

  // Validate name
  if (!name || typeof name !== "string" || name.trim().length < 1 || name.length > 100) {
    return { valid: false, error: "Name must be between 1 and 100 characters" };
  }

  // Validate email
  if (!email || typeof email !== "string" || !validateEmail(email)) {
    return { valid: false, error: "Valid email address is required" };
  }

  // Validate message
  if (!message || typeof message !== "string" || message.trim().length < 1 || message.length > 1000) {
    return { valid: false, error: "Message must be between 1 and 1000 characters" };
  }

  // Validate company if provided
  if (company !== undefined && company !== null && company !== "") {
    if (typeof company !== "string" || company.length > 100) {
      return { valid: false, error: "Company name must be 100 characters or less" };
    }
  }

  return {
    valid: true,
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
      company: company ? company.trim() : undefined,
    },
  };
}

function getCorsHeaders(origin: string | null): HeadersInit {
  const allowedOrigins = Deno.env.get("ALLOWED_ORIGINS")?.split(",") || [];
  
  const allowOrigin = allowedOrigins.length === 0 
    ? (origin || "*")
    : (origin && allowedOrigins.some(o => origin.includes(o.trim()))) 
      ? origin 
      : "null";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    // Check origin allowlist for write operations
    const allowedOrigins = Deno.env.get("ALLOWED_ORIGINS")?.split(",") || [];
    if (allowedOrigins.length > 0) {
      const isAllowed = origin && allowedOrigins.some(o => origin.includes(o.trim()));
      if (!isAllowed) {
        return new Response(
          JSON.stringify({ error: "Origin not allowed" }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Rate limiting - 5 submissions per hour per IP
    const rateLimitKey = getRateLimitKey(req);
    if (!checkRateLimit(rateLimitKey)) {
      return new Response(
        JSON.stringify({ error: "Too many submissions. Please try again later." }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse and validate input
    const body = await req.json();
    const validation = validateInput(body);
    
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const contactData = validation.data!;

    // Get Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Store contact submission in database
    const { data: submission, error: dbError } = await supabase
      .from("contact_submissions")
      .insert({
        name: contactData.name,
        email: contactData.email,
        company: contactData.company,
        message: contactData.message,
        status: "new",
      })
      .select()
      .single();

    if (dbError) {
      return new Response(
        JSON.stringify({ error: "Failed to save message" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 2. Send email notification via Resend (server-side)
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const resendToEmail = Deno.env.get("RESEND_TO_EMAIL");

    if (resendApiKey && resendToEmail) {
      // Resend is configured, send email
      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Contact Form <onboarding@resend.dev>", // Use your verified domain or resend.dev for testing
            to: [resendToEmail],
            subject: `New Contact from ${contactData.name}`,
            html: `
              <h2>New Contact Form Submission</h2>
              <p><strong>Name:</strong> ${contactData.name}</p>
              <p><strong>Email:</strong> ${contactData.email}</p>
              <p><strong>Company:</strong> ${contactData.company || "Not provided"}</p>
              <p><strong>Message:</strong></p>
              <p>${contactData.message.replace(/\n/g, '<br>')}</p>
              <hr>
              <p><small>Submission ID: ${submission.id}</small></p>
            `,
          }),
        });

        if (!emailResponse.ok) {
          // Email failed but database save succeeded - silent fail
          await emailResponse.text();
        }
      } catch (emailError) {
        // Email failed but database save succeeded - silent fail
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Message sent successfully",
        id: submission.id 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
