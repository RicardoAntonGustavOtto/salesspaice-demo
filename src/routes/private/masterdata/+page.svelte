<!-- @format -->
<script>
  import { fade } from "svelte/transition";
  import { onMount } from "svelte";

  export let data;
  $: ({ supabase, user } = data);

  $: {
    console.log("Supabase client:", supabase);
    console.log("User data:", user);
  }

  let companyData = {
    name: "",
    description: "",
    products: [],
  };
  let isLoading = true;
  let isSaving = false;
  let isModalOpen = false;
  let isDeleteModalOpen = false;
  let newProduct = {
    name: "",
    description: "",
    tags: [],
    id: null,
    created_at: null,
  };
  let productToDelete = null;
  let newTag = "";
  let error = null;
  let saveError = null;

  async function loadCompanyData() {
    try {
      isLoading = true;
      error = null;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id) throw new Error("No user logged in");

      const { data, error: err } = await supabase
        .from("owncompany")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (err) throw err;

      if (data) {
        companyData = data;
      } else {
        // Create initial company data if none exists
        const { data: newData, error: createError } = await supabase
          .from("owncompany")
          .insert([
            {
              user_id: user.id,
              name: "Your Company Name",
              description: "Your company description goes here...",
              products: [],
            },
          ])
          .select()
          .single();

        if (createError) throw createError;
        companyData = newData;
      }
    } catch (err) {
      console.error("Error loading company data:", err);
      error = err.message;
    } finally {
      isLoading = false;
    }
  }

  onMount(async () => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.user?.id) throw new Error("No user logged in");

      loadCompanyData();
    } catch (err) {
      console.error("Error initializing:", err);
      error = err.message;
    }
  });

  async function saveCompanyData() {
    try {
      isSaving = true;
      saveError = null;

      // Get the current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user?.id) throw new Error("No user logged in");

      // First check if company exists
      const { data: existingCompany, error: checkError } = await supabase
        .from("owncompany")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      let result;
      if (existingCompany) {
        // Update existing company
        result = await supabase
          .from("owncompany")
          .update({
            name: companyData.name,
            description: companyData.description,
          })
          .eq("user_id", user.id)
          .select()
          .single();
      } else {
        // Insert new company
        result = await supabase
          .from("owncompany")
          .insert([
            {
              user_id: user.id,
              name: companyData.name,
              description: companyData.description,
              products: [],
            },
          ])
          .select()
          .single();
      }

      if (result.error) throw result.error;
      companyData = result.data;
      alert("Changes saved successfully!");
    } catch (err) {
      console.error("Error saving company data:", err);
      saveError = err.message;
    } finally {
      isSaving = false;
    }
  }

  function openModal() {
    isModalOpen = true;
  }

  function closeModal() {
    isModalOpen = false;
    newProduct = {
      name: "",
      description: "",
      tags: [],
      id: null,
      created_at: null,
    };
    newTag = "";
  }

  async function addProduct() {
    if (newProduct.name && newProduct.description) {
      try {
        error = null;
        isSaving = true;

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user?.id) throw new Error("No user logged in");

        // Get current company data to ensure we have the latest products
        const { data: currentCompany, error: fetchError } = await supabase
          .from("owncompany")
          .select("products")
          .eq("user_id", user.id)
          .single();

        if (fetchError) throw fetchError;

        // Create new products array with the new product
        const updatedProducts = [
          ...(currentCompany.products || []),
          {
            id: Date.now(), // Add an ID for better management
            name: newProduct.name,
            description: newProduct.description,
            tags: newProduct.tags,
            created_at: new Date().toISOString(),
          },
        ];

        // Update the database
        const { error: updateError } = await supabase
          .from("owncompany")
          .update({
            products: updatedProducts,
          })
          .eq("user_id", user.id);

        if (updateError) throw updateError;

        // Update local state
        companyData.products = updatedProducts;
        closeModal();
      } catch (err) {
        console.error("Error adding product:", err);
        error = err.message;
      } finally {
        isSaving = false;
      }
    }
  }

  function addTag() {
    if (newTag.trim() && !newProduct.tags.includes(newTag.trim())) {
      newProduct.tags = [...newProduct.tags, newTag.trim()];
      newTag = "";
    }
  }

  function removeTag(tag) {
    newProduct.tags = newProduct.tags.filter((t) => t !== tag);
  }

  function openDeleteModal(product) {
    productToDelete = product;
    isDeleteModalOpen = true;
  }

  function closeDeleteModal() {
    isDeleteModalOpen = false;
    productToDelete = null;
  }

  async function deleteProduct() {
    if (productToDelete) {
      try {
        error = null;
        isSaving = true;

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user?.id) throw new Error("No user logged in");

        // Get current company data to ensure we have the latest products
        const { data: currentCompany, error: fetchError } = await supabase
          .from("owncompany")
          .select("products")
          .eq("user_id", user.id)
          .single();

        if (fetchError) throw fetchError;

        // Filter out the product to delete
        const updatedProducts = (currentCompany.products || []).filter(
          (product) => product.id !== productToDelete.id
        );

        // Update the database
        const { error: updateError } = await supabase
          .from("owncompany")
          .update({
            products: updatedProducts,
          })
          .eq("user_id", user.id);

        if (updateError) throw updateError;

        // Update local state
        companyData.products = updatedProducts;
        closeDeleteModal();
      } catch (err) {
        console.error("Error deleting product:", err);
        error = err.message;
      } finally {
        isSaving = false;
      }
    }
  }
</script>

<div class="container mx-auto py-6 px-6 space-y-6">
  <div class="flex justify-between items-center">
    <h1 class="text-3xl font-bold tracking-tight">Master Data</h1>
  </div>

  {#if isLoading}
    <div class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-8 w-8 border-2 border-muted border-t-foreground" />
    </div>
  {:else if error}
    <div class="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg">
      {error}
    </div>
  {:else}
    <div class="grid gap-6">
      <!-- Company Information -->
      <div class="space-y-4">
        <div class="grid gap-4">
          <div>
            <label for="companyName" class="block text-sm font-medium mb-1">Company Name</label>
            <input
              type="text"
              id="companyName"
              bind:value={companyData.name}
              class="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label for="companyDescription" class="block text-sm font-medium mb-1">Information</label>
            <textarea
              id="companyDescription"
              bind:value={companyData.description}
              rows="4"
              class="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            ></textarea>
          </div>
          <div class="flex justify-end">
            <button
              on:click={saveCompanyData}
              disabled={isSaving}
              class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <!-- Products Section -->
      <div class="space-y-4">
        <h2 class="text-xl font-semibold tracking-tight">Products</h2>
        {#if companyData.products?.length === 0}
          <div class="flex flex-col items-center justify-center min-h-[20vh]">
            <button
              on:click={openModal}
              class="border-2 border-dashed border-muted rounded-lg p-12 hover:border-muted/80 hover:bg-muted/5 transition-colors"
            >
              <span class="text-xl">+</span>
              <p class="mt-2 text-muted-foreground">
                No products added yet. Click to add your first product.
              </p>
            </button>
          </div>
        {:else}
          <div class="rounded-lg border bg-card p-6 shadow-sm relative">
            {#if isLoading}
              <div class="absolute inset-0 bg-background/80 flex items-center justify-center">
                <div class="animate-spin rounded-full h-8 w-8 border-2 border-muted border-t-foreground"></div>
              </div>
            {/if}
            <div class="space-y-4">
              {#each companyData.products as product (product.id)}
                <div class="rounded-lg border border-input p-4">
                  <h3 class="font-semibold">{product.name}</h3>
                  <p class="text-muted-foreground mt-1">{product.description}</p>
                  {#if product.tags?.length > 0}
                    <div class="flex flex-wrap gap-2 mt-2">
                      {#each product.tags as tag}
                        <span class="px-2 py-1 bg-muted rounded-full text-sm">
                          {tag}
                        </span>
                      {/each}
                    </div>
                  {/if}
                  <div class="flex justify-between items-center mt-2">
                    <span class="text-xs text-muted-foreground">
                      Added: {new Date(product.created_at).toLocaleDateString()}
                    </span>
                    <button
                      on:click={() => openDeleteModal(product)}
                      class="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          </div>
          <div class="flex justify-end">
            <button
              on:click={openModal}
              class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Add Product
            </button>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<!-- Add Product Modal -->
{#if isModalOpen}
  <div
    class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
    transition:fade
  >
    <div
      class="bg-white p-6 rounded-lg w-full max-w-md mx-4 shadow-lg"
      on:click|stopPropagation
    >
      <h2 class="text-xl font-semibold mb-4">Add New Product</h2>
      {#if error}
        <div
          class="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600"
        >
          {error}
        </div>
      {/if}
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2" for="productName"
            >Product Name</label
          >
          <input
            type="text"
            id="productName"
            bind:value={newProduct.name}
            class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-gray-400"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2" for="productDescription"
            >Product Description</label
          >
          <textarea
            id="productDescription"
            bind:value={newProduct.description}
            rows="4"
            class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-gray-400"
          ></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Tags</label>
          <div class="flex gap-2 mb-2">
            <input
              type="text"
              bind:value={newTag}
              placeholder="Add a tag"
              class="flex-1 px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all duration-200"
              on:keydown={(e) => e.key === "Enter" && addTag()}
            />
            <button
              on:click={addTag}
              class="px-4 py-2 border border-gray-200 bg-white text-gray-900 rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              Add
            </button>
          </div>
          {#if newProduct.tags.length > 0}
            <div class="flex flex-wrap gap-2">
              {#each newProduct.tags as tag}
                <span
                  class="px-3 py-1 rounded-full border border-gray-200 bg-white text-gray-900 flex items-center gap-2"
                >
                  {tag}
                  <button
                    on:click={() => removeTag(tag)}
                    class="text-gray-500 hover:text-gray-700 transition-all duration-200"
                  >
                    ×
                  </button>
                </span>
              {/each}
            </div>
          {/if}
        </div>
        <div class="flex gap-3 mt-6">
          <button
            on:click={addProduct}
            disabled={isSaving}
            class="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative"
          >
            {#if isSaving}
              <div class="absolute inset-0 flex items-center justify-center">
                <div
                  class="animate-spin rounded-full h-5 w-5 border-2 border-white border-r-transparent"
                ></div>
              </div>
              <span class="opacity-0">Save</span>
            {:else}
              Save
            {/if}
          </button>
          <button
            on:click={closeModal}
            disabled={isSaving}
            class="flex-1 px-4 py-2 border border-gray-200 bg-white text-gray-900 rounded-lg hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Delete Confirmation Modal -->
{#if isDeleteModalOpen}
  <div
    class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
    transition:fade
  >
    <div
      class="bg-white p-6 rounded-lg w-full max-w-md mx-4 shadow-lg"
      on:click|stopPropagation
    >
      <h2 class="text-xl font-semibold mb-4">Delete Product</h2>
      <p class="text-gray-600 mb-6">
        Are you sure you want to delete product "{productToDelete?.name}"?
      </p>
      <div class="flex gap-3">
        <button
          on:click={deleteProduct}
          class="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200"
        >
          DELETE
        </button>
        <button
          on:click={closeDeleteModal}
          class="flex-1 px-4 py-2 border border-gray-200 bg-white text-gray-900 rounded-lg hover:bg-gray-50 transition-all duration-200"
        >
          Go back
        </button>
      </div>
    </div>
  </div>
{/if}
