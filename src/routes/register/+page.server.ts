/** @format */

import type { PageServerLoad, Actions } from "./$types.js";
import { fail } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { formSchema } from "./schema";
import { setError } from "sveltekit-superforms";
import { redirect } from "@sveltejs/kit";

export const load: PageServerLoad = async () => {
  return {
    form: await superValidate(zod(formSchema)),
  };
};

export const actions: Actions = {
  default: async (event) => {
    const form = await superValidate(event, zod(formSchema));
    if (!form.valid) {
      return fail(400, {
        form,
      });
    }

    // Create user in Supabase
    const supabase = event.locals.supabase;
    const { username, password, confirmPassword, companyId, newCompanyName } = form.data;
    
    // Double check password match (although schema should catch this)
    if (password !== confirmPassword) {
      return setError(form, "confirmPassword", "Passwords don't match");
    }

    try {
      // Create the user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: username,
        password: password,
        options: {
          emailRedirectTo: `${event.url.origin}/auth/callback`
        }
      });
      
      if (authError) {
        console.error("Auth error:", authError);
        if (authError.message.includes("already registered")) {
          return setError(form, "username", "This email is already registered");
        }
        return setError(form, "username", authError.message);
      }

      const userId = authData.user?.id;
      if (!userId) {
        throw new Error("User creation failed");
      }

      // Handle company association
      if (companyId) {
        // Update existing company with new user
        const { error: updateError } = await supabase
          .from("owncompany")
          .update({ user_id: userId })
          .eq("id", companyId);

        if (updateError) {
          console.error("Error updating company:", updateError);
          return setError(form, "companyId", "Failed to associate with company");
        }
      } else if (newCompanyName) {
        // Create new company for user
        const { error: createError } = await supabase
          .from("owncompany")
          .insert([
            {
              user_id: userId,
              name: newCompanyName,
              description: "Your company description goes here...",
              products: [],
            },
          ]);

        if (createError) {
          console.error("Error creating company:", createError);
          return setError(form, "newCompanyName", "Failed to create company");
        }
      }

      // If we get here, everything succeeded
      throw redirect(303, "/login?registered=true");

    } catch (err) {
      if (err instanceof Error) {
        console.error("Registration error:", err);
        return setError(form, "username", "Registration failed. Please try again.");
      }
      // If it's a redirect, throw it
      throw err;
    }
  },
};
