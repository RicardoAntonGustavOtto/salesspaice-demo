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
    console.log(form.data);

    // Create user in Supabase
    const supabase = event.locals.supabase;
    const { error } = await supabase.auth.signInWithPassword({
      email: form.data.username,
      password: form.data.password,
    });
    if (error) {
      console.log(error);
      return setError(form, "password", "Invalid email or password");
    } else {
      return redirect(303, "/private/dashboard");
    }
  },
};
