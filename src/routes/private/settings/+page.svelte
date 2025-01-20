<!-- @format -->
<script lang="ts">
  import { ownCompany } from "$lib/stores/ownCompany";
  import { Button } from "$lib/components/ui/button";
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";

  let companyName = $ownCompany.name;
  let companyInfo = $ownCompany.info;
  let saved = false;

  function saveSettings() {
    ownCompany.set({
      name: companyName,
      info: companyInfo
    });
    saved = true;
    setTimeout(() => saved = false, 2000);
  }
</script>

<div class="container mx-auto p-6 max-w-2xl">
  <Card>
    <CardHeader>
      <CardTitle>Company Settings</CardTitle>
    </CardHeader>
    <CardContent>
      <form on:submit|preventDefault={saveSettings} class="space-y-4">
        <div class="space-y-2">
          <label for="companyName" class="text-sm font-medium">Company Name</label>
          <input
            id="companyName"
            type="text"
            bind:value={companyName}
            class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter your company name"
          />
        </div>

        <div class="space-y-2">
          <label for="companyInfo" class="text-sm font-medium">Company Information</label>
          <textarea
            id="companyInfo"
            bind:value={companyInfo}
            class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[150px]"
            placeholder="Enter a detailed description of your company's products and services"
          />
        </div>

        <div class="flex justify-end gap-2">
          <Button type="submit">Save Settings</Button>
        </div>

        {#if saved}
          <p class="text-green-600 text-sm">Settings saved successfully!</p>
        {/if}
      </form>
    </CardContent>
  </Card>
</div> 