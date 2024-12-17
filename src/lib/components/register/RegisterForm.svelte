<!-- @format -->
<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import * as Form from "$lib/components/ui/form/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { formSchema, type FormSchema } from "../../../routes/register/schema";
  import {
    type SuperValidated,
    type Infer,
    superForm,
  } from "sveltekit-superforms";
  import { zodClient } from "sveltekit-superforms/adapters";

  export let data: SuperValidated<Infer<FormSchema>>;

  const form = superForm(data, {
    validators: zodClient(formSchema),
  });

  const { form: formData, enhance } = form;
</script>

<div class="flex justify-center items-center h-screen">
  <Card.Root class="mx-auto max-w-sm">
    <Card.Header>
      <Card.Title class="text-2xl">Register</Card.Title>
      <Card.Description
        >Enter your email below to register to your account</Card.Description
      >
    </Card.Header>
    <Card.Content>
      <form method="POST" use:enhance>
        <div class="grid gap-4">
          <div class="grid gap-2">
            <Form.Field {form} name="username">
              <Form.Control>
                {#snippet children({ props })}
                  <Form.Label>Username</Form.Label>
                  <Input
                    {...props}
                    bind:value={$formData.username}
                    type="text"
                  />
                {/snippet}
              </Form.Control>
              <Form.FieldErrors />
            </Form.Field>
          </div>
          <div class="grid gap-2">
            <div class="flex items-center">
              <Form.Field {form} name="password" class="w-full">
                <Form.Control>
                  {#snippet children({ props })}
                    <Form.Label>Password</Form.Label>
                    <Input
                      {...props}
                      bind:value={$formData.password}
                      type="password"
                    />
                  {/snippet}
                </Form.Control>
                <Form.FieldErrors />
              </Form.Field>
            </div>
          </div>
          <Form.Button type="submit" class="w-full">Register</Form.Button>
        </div>
        <div class="mt-4 text-center text-sm">
          Already have an account?
          <a href="##" class="underline"> Sign in </a>
        </div>
      </form>
    </Card.Content>
  </Card.Root>
</div>
