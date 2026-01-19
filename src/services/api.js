import { supabase } from "@/lib/supabase";

/**
 * Authenticate admin with password
 * @param {string} password - The password to authenticate with
 * @returns {Promise<{authenticated: boolean, isAdmin?: boolean}>}
 */
export async function adminAuth(password) {
  try {
    const { data, error } = await supabase.functions.invoke("admin-auth", {
      body: { password },
    });

    if (error) {
      throw new Error(error.message || "Authentication failed");
    }

    return data;
  } catch (error) {
    throw new Error(error.message || "Error authenticating. Please try again.");
  }
}
