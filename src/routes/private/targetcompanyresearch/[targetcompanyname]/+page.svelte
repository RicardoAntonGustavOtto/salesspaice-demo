<!-- @format -->
<script>
  import { page } from "$app/stores";
  import { fade } from "svelte/transition";
  import { writable } from "svelte/store";
  import { browser } from "$app/environment";
  import { marked } from "marked";
  import { onMount } from "svelte";

  import { enhance } from "$app/forms";
  import { callProxy } from "$lib/services/apiService";
  import { goto } from "$app/navigation";
  import { ownCompany } from "$lib/stores/ownCompany";
  import { getPrompt } from "$lib/services/promptManager";
  import * as pdfjs from "pdfjs-dist";

  $: ({ supabase, user } = data);

  $: {
    console.log("Supabase client:", supabase);
    console.log("User data:", user);
  }
  let targetCompanyData = null;

  let selectedResearchIndex = null;

  export let data;
  let ownCompanyName = "Devii.io";
  let company = data?.company || null;
  let isLoading = false;
  let loading = false;
  let error = null;
  let showResearchModal = false;
  let researchLoading = false;
  let researchResult = "";
  let editedResearch = "";
  let fileInput;
  let uploadError = null;
  let uploadLoading = false;
  let uploadProgress = 0;
  let showPreviewModal = false;
  let previewFile = null;
  let showProspectModal = false;
  let showEditModal = false;
  let editingCompany = {
    name: "",
    website: "",
  };

  // New prospect form data
  let newProspect = {
    name: "",
    title: "",
    email: "",
    phone: "",
    notes: "",
  };

  onMount(() => {
    loadCompany();
  });

  async function loadCompany() {
    try {
      isLoading = true;
      error = null;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id) throw new Error("No user logged in");

      let targetCompanyName = decodeURIComponent(
        $page.params.targetcompanyname
      );
      targetCompanyName =
        targetCompanyName[0].toUpperCase() + targetCompanyName.slice(1);
      const { data, error: err } = await supabase
        .from("targetcompanies")
        .select("*")
        .eq("name", targetCompanyName)
        .single();

      if (err) throw err;
      company = data;
      console.log("Target company data:", targetCompanyData);
    } catch (err) {
      console.error("Error loading companies:", err);
      error = err.message;
    } finally {
      isLoading = false;
    }
  }

  // Set up the worker using dynamic import
  if (typeof window !== "undefined") {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.mjs",
      import.meta.url
    ).toString();
  }

  // Add selectedResearchIndex at the top with other variables

  // Tabs for different sections
  const tabs = [
    { id: "research", label: "Research" },
    { id: "annual-reports", label: "Annual Reports" },
    { id: "prospects", label: "Prospects" },
    { id: "cold-calling", label: "Cold Calling Guides" },
    { id: "email-drafts", label: "Prospecting Email" }, // Add this new tab
  ];

  let activeTab = "research";

  // Initialize activeTab based on URL parameter
  $: activeTab = $page.url.searchParams.get("tab") || "research";

  // Configure marked to sanitize HTML
  marked.setOptions({
    sanitize: true,
    breaks: true,
  });

  // Function to safely render markdown
  function renderMarkdown(content) {
    try {
      return marked(content);
    } catch (e) {
      console.error("Markdown parsing error:", e);
      return content;
    }
  }

  async function handleAIResearch() {
    // Check if company info is missing
    if (!company?.name || !company?.website) {
      error = "Company information is missing";
      return;
    }

    // Modal & Error handling
    showResearchModal = true;
    researchLoading = true;
    error = null;

    try {
      if (!ownCompanyName) {
        throw new Error("Company name not loaded yet. Please try again.");
      }

      // Get the right prompt
      const { prompt, model, provider } = getPrompt("research_targetcompany", {
        targetcompany_name: company.name,
        targetcompany_website: company.website,
      });

      const research = await callProxy(prompt, provider, model);

      // Parse citations from the research content
      const researchContent = research.choices[0].message.content;

      // Create new research object
      const newResearch = {
        research_date: new Date().toISOString(),
        research_content: researchContent,
        citations: research.citations || [],
      };

      // Get current research array or initialize empty array
      const currentResearch = company.research_result || [];

      // Create the new research array
      const updatedResearch = [...currentResearch, newResearch];

      // Update database with new research array
      const { data: updatedCompany, error: updateError } = await supabase
        .from("targetcompanies")
        .update({
          research_result: updatedResearch,
        })
        .eq("id", company.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update local state
      company = updatedCompany;

      // Update sessionStorage
      sessionStorage.setItem("selectedCompany", JSON.stringify(company));

      // Update the research result state
      researchResult = researchContent;
      editedResearch = researchContent;

      // Close modal after successful save
      closeResearchModal();
    } catch (err) {
      error = "Failed to generate AI research. Please try again.";
      console.error("AI Research failed:", err);
    } finally {
      researchLoading = false;
    }
  }

  async function saveResearch() {
    if (!company || !editedResearch || selectedResearchIndex === null) return;

    try {
      loading = true;
      error = null;

      // Get current research array or initialize empty array
      const currentResearch = company.research_result || [];

      // Create updated research array
      const updatedResearch = [...currentResearch];
      updatedResearch[selectedResearchIndex] = {
        ...updatedResearch[selectedResearchIndex],
        research_content: editedResearch,
        research_date: new Date().toISOString(),
      };

      // Update research in database
      const { data: updatedCompany, error: updateError } = await supabase
        .from("targetcompanies")
        .update({
          research_result: updatedResearch,
        })
        .eq("id", company.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update local state
      company = updatedCompany;

      // Update sessionStorage
      sessionStorage.setItem("selectedCompany", JSON.stringify(company));

      // Close modal
      closeResearchModal();
    } catch (err) {
      console.error("Error saving research:", err);
      error = err.message;
    } finally {
      loading = false;
    }
  }

  function closeResearchModal() {
    showResearchModal = false;
    researchResult = "";
    editedResearch = "";
  }

  async function extractTextFromPDF(url) {
    try {
      const pdf = await pdfjs.getDocument(url).promise;
      let fullText = "";

      // Extract text from each page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(" ");
        fullText += pageText + "\n\n";
      }

      return fullText;
    } catch (err) {
      console.error("Error extracting PDF text:", err);
      throw err;
    }
  }

  async function handleFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    uploadLoading = true;
    uploadError = null;
    uploadProgress = 0;

    try {
      let content;
      if (file.type === "application/pdf") {
        // For PDF files, we'll store both the file and extracted text
        const formData = new FormData();
        formData.append("file", file);

        // Upload the PDF file
        const { data: uploadResult, error: uploadError } =
          await supabase.storage
            .from("salesspaice-files")
            .upload(`${company.id}/${file.name}`, file, {
              cacheControl: "3600",
              upsert: true,
            });

        if (uploadError) throw uploadError;

        // Get the public URL
        const {
          data: { publicUrl },
        } = supabase.storage
          .from("salesspaice-files")
          .getPublicUrl(`${company.id}/${file.name}`);

        // Extract text from the PDF
        const extractedText = await extractTextFromPDF(
          URL.createObjectURL(file)
        );

        content = {
          type: "pdf",
          url: publicUrl,
          fileName: file.name,
          content: extractedText, // Store the extracted text
        };
      } else {
        // For text files, read the content directly
        content = {
          type: "text",
          content: await file.text(),
          fileName: file.name,
        };
      }

      // Update company record with file content
      const { data, error: updateError } = await supabase
        .from("targetcompanies")
        .update({
          annual_report: content,
        })
        .eq("id", company.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update local state
      company = data;

      // Update sessionStorage
      sessionStorage.setItem("selectedCompany", JSON.stringify(company));

      uploadProgress = 100;
    } catch (err) {
      uploadError = err.message;
      console.error("Upload error:", err);
    } finally {
      uploadLoading = false;
      if (fileInput) fileInput.value = "";
    }
  }

  function deleteReport(index) {
    company.annualReports = company.annualReports.filter((_, i) => i !== index);
    companiesStore.update((companies) => {
      const updatedCompanies = companies.map((c) =>
        c?.name?.toLowerCase() === company?.name?.toLowerCase() ? company : c
      );
      return updatedCompanies;
    });
  }

  function previewReport(report) {
    previewFile = report;
    showPreviewModal = true;
  }

  function openProspectModal() {
    showProspectModal = true;
    newProspect = {
      name: "",
      title: "",
      email: "",
      phone: "",
      notes: "",
    };
  }

  function closeProspectModal() {
    showProspectModal = false;
  }

  async function saveProspect() {
    if (!company || !newProspect.name) return;

    try {
      const prospect = {
        ...newProspect,
        id: crypto.randomUUID(),
        dateAdded: new Date().toISOString(),
      };

      const { data, error: updateError } = await supabase
        .from("targetcompanies")
        .update({
          prospects: [...(company.prospects || []), prospect],
        })
        .eq("id", company.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update local state
      company = data;

      // Update sessionStorage
      sessionStorage.setItem("selectedCompany", JSON.stringify(company));

      closeProspectModal();
    } catch (err) {
      console.error("Error saving prospect:", err);
      error = err.message;
    }
  }

  function openEditModal() {
    editingCompany = {
      name: company.name,
      website: company.website,
    };
    showEditModal = true;
  }

  function closeEditModal() {
    showEditModal = false;
  }

  function saveCompanyEdit() {
    if (editingCompany.name && editingCompany.website) {
      company = {
        ...company,
        name: editingCompany.name,
        website: editingCompany.website,
      };

      companiesStore.update((companies) => {
        const updatedCompanies = companies.map((c) =>
          c?.name?.toLowerCase() === company?.name?.toLowerCase()
            ? { ...company }
            : c
        );
        return updatedCompanies;
      });

      closeEditModal();
    }
  }

  // Add these new variables
  let showEditProspectModal = false;
  let editingProspect = null;

  // Add these new functions
  function openEditProspectModal(prospect) {
    editingProspect = { ...prospect };
    showEditProspectModal = true;
  }

  function closeEditProspectModal() {
    showEditProspectModal = false;
    editingProspect = null;
  }

  function saveProspectEdit() {
    if (!editingProspect?.name) return;

    company.prospects = company.prospects.map((p) =>
      p.id === editingProspect.id ? { ...editingProspect } : p
    );

    companiesStore.update((companies) => {
      const updatedCompanies = companies.map((c) =>
        c?.name?.toLowerCase() === company?.name?.toLowerCase()
          ? { ...company }
          : c
      );
      return updatedCompanies;
    });

    closeEditProspectModal();
  }

  // Add these new variables
  let selectedResearch = null;
  let selectedReport = null;
  let selectedProspect = null;
  let showColdCallModal = false;

  function openColdCallModal() {
    showColdCallModal = true;
    selectedProspect = null;
    selectedResearch = null;
    selectedReport = null;
  }

  function closeColdCallModal() {
    showColdCallModal = false;
  }

  async function generateColdCall() {
    try {
      loading = true;
      error = null;

      if (!$ownCompany.name) {
        throw new Error("Company name not loaded yet. Please try again.");
      }

      // Create the variables object
      const promptVariables = {
        prospect_name: selectedProspect?.name || "", // Changed from prospect_name
        targetcompany_annualreport: selectedReport || "", // Changed from targetcompany_annualreport_research
        targetcompany_research: selectedResearch?.research_content || "",
        prospect_info: selectedProspect
          ? `Name: ${selectedProspect.name}
             Title: ${selectedProspect.title}
             Email: ${selectedProspect.email}
             Phone: ${selectedProspect.phone}
             Notes: ${selectedProspect.notes}`
          : "",
        owncompany_name: $ownCompany.name,
      };

      // Debug log
      console.log("Prompt Variables:", promptVariables);

      // Get the prompt
      const { prompt, model, provider } = getPrompt(
        "generate_targetcompany_coldcallingguide",
        promptVariables
      );

      // Debug log
      console.log("Generated Prompt:", prompt);

      const response = await callProxy(prompt, provider, model);
      const guideContent = response.choices?.[0]?.message?.content || response;

      const guide = {
        id: crypto.randomUUID(),
        prospect: selectedProspect || {
          name: "[PROSPECT NAME]",
          title: "Unknown",
          email: "",
          phone: "",
          notes: "Generic guide",
        },
        content: guideContent,
        generated_at: new Date().toISOString(),
      };

      const { data: updatedCompany, error: updateError } = await supabase
        .from("targetcompanies")
        .update({
          cold_calling_guides: [...(company.cold_calling_guides || []), guide],
        })
        .eq("id", company.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update local state
      company = updatedCompany;

      // Update sessionStorage
      sessionStorage.setItem("selectedCompany", JSON.stringify(company));

      closeColdCallModal();
    } catch (err) {
      console.error("Error generating cold call guide:", err);
      error = err.message;
    } finally {
      loading = false;
    }
  }

  async function deleteCompany() {
    if (!confirm("Are you sure you want to delete this company?")) return;

    try {
      const { error: deleteError } = await supabase
        .from("targetcompanies")
        .delete()
        .eq("id", company.id);

      if (deleteError) throw deleteError;

      // Use goto instead of window.location
      await goto("/target-company", { replaceState: true });
    } catch (err) {
      console.error("Error deleting company:", err);
      error = err.message;
    }
  }

  async function deleteProspect(prospectId) {
    if (!confirm("Are you sure you want to delete this prospect?")) return;

    try {
      const updatedProspects = company.prospects.filter(
        (p) => p.id !== prospectId
      );

      const { data: updatedCompany, error: updateError } = await supabase
        .from("targetcompanies")
        .update({
          prospects: updatedProspects,
        })
        .eq("id", company.id)
        .select()
        .single();

      if (updateError) throw updateError;

      company = updatedCompany;
    } catch (err) {
      console.error("Error deleting prospect:", err);
      error = err.message;
    }
  }

  async function deleteGuide(guideId) {
    if (!confirm("Are you sure you want to delete this guide?")) return;

    try {
      const updatedGuides = company.cold_calling_guides.filter(
        (g) => g.id !== guideId
      );

      const { data: updatedCompany, error: updateError } = await supabase
        .from("targetcompanies")
        .update({
          cold_calling_guides: updatedGuides,
        })
        .eq("id", company.id)
        .select()
        .single();

      if (updateError) throw updateError;

      company = updatedCompany;
    } catch (err) {
      console.error("Error deleting guide:", err);
      error = err.message;
    }
  }

  // Add this function to handle file deletion
  async function deleteAnnualReport() {
    if (!confirm("Are you sure you want to delete this annual report?")) return;

    try {
      // First delete from storage if it's a PDF
      if (company.annual_report.type === "pdf") {
        const { error: storageError } = await supabase.storage
          .from("salesspaice-files")
          .remove([`${company.id}/${company.annual_report.fileName}`]);

        if (storageError) throw storageError;
      }

      // Then update the company record
      const { data: updatedCompany, error: updateError } = await supabase
        .from("targetcompanies")
        .update({
          annual_report: null,
        })
        .eq("id", company.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update local state
      company = updatedCompany;

      // Update sessionStorage
      sessionStorage.setItem("selectedCompany", JSON.stringify(company));
    } catch (err) {
      console.error("Error deleting annual report:", err);
      error = err.message;
    }
  }

  let research = "";
  let citations = [];

  async function generateResearch() {
    loading = true;
    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetCompany: data.targetCompany,
          prompt: "Research about " + data.targetCompany,
        }),
      });
      const result = await response.json();
      research = result.research.content;
      citations = result.citations || []; // Get citations directly from the response
    } catch (error) {
      console.error("Error:", error);
    } finally {
      loading = false;
    }
  }

  // Add to the variables at the top of the script
  let showAnnualReportResearchModal = false;
  let annualReportResearchLoading = false;
  let annualReportResearchResult = "";

  // Add these functions before the closing script tag
  async function handleAnnualReportResearch() {
    if (!company?.annual_report) {
      error = "No annual report available to analyze";
      return;
    }

    showAnnualReportResearchModal = true;
    annualReportResearchLoading = true;
    error = null;

    try {
      if (!$ownCompany.name) {
        throw new Error("Company name not loaded yet. Please try again.");
      }

      // Get the annual report content
      const annualReportContent = company.annual_report.content;

      // Get the right prompt with properly formatted variables
      const { prompt, model, provider } = getPrompt("analyze_annualreport", {
        owncompany_name: $ownCompany.name, // Changed from owncompany_info
        targetcompany_name: company.name,
        targetcompany_annualreport: annualReportContent || "",
      });
      console.log("prompt used for AI:", prompt);
      // Call the API and get the response
      const response = await callProxy(prompt, provider, model);

      // Extract the content from the response
      const researchContent =
        response.choices?.[0]?.message?.content || response;

      if (!researchContent) {
        throw new Error("Failed to get analysis content from API response");
      }

      // Update database with research result
      const { data: updatedCompany, error: updateError } = await supabase
        .from("targetcompanies")
        .update({
          annual_report_research: researchContent,
        })
        .eq("id", company.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update local state
      company = updatedCompany;
      annualReportResearchResult = researchContent;

      // Update sessionStorage
      sessionStorage.setItem("selectedCompany", JSON.stringify(company));
    } catch (err) {
      error = "Failed to analyze annual report. Please try again.";
      console.error("Annual Report Analysis failed:", err);
    } finally {
      annualReportResearchLoading = false;
    }
  }

  function closeAnnualReportResearchModal() {
    showAnnualReportResearchModal = false;
    annualReportResearchResult = "";
  }

  // Add to the variables at the top
  let showFullAnalysisModal = false;

  // Add this function
  function openFullAnalysis() {
    showFullAnalysisModal = true;
  }

  // Add this function near the other delete functions
  async function deleteAnnualReportAnalysis() {
    if (!confirm("Are you sure you want to delete this analysis?")) return;

    try {
      const { data: updatedCompany, error: updateError } = await supabase
        .from("targetcompanies")
        .update({
          annual_report_research: null,
        })
        .eq("id", company.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update local state
      company = updatedCompany;

      // Update sessionStorage
      sessionStorage.setItem("selectedCompany", JSON.stringify(company));
    } catch (err) {
      console.error("Error deleting analysis:", err);
      error = err.message;
    }
  }

  // Add these new variables with the other modal/state variables
  let showEmailDraftModal = false;
  let selectedEmailResearch = null;
  let selectedEmailReport = null;
  let selectedEmailProspect = null;
  let selectedEmailGuide = null;

  // Add these new functions
  function openEmailDraftModal() {
    showEmailDraftModal = true;
    selectedEmailResearch = null;
    selectedEmailReport = null;
    selectedEmailProspect = null;
    selectedEmailGuide = null;
  }

  function closeEmailDraftModal() {
    showEmailDraftModal = false;
  }

  async function generateEmailDraft() {
    try {
      loading = true;
      error = null;

      if (!$ownCompany.name) {
        throw new Error("Company name not loaded yet. Please try again.");
      }

      // Create the variables object
      const promptVariables = {
        prospectName: selectedEmailProspect?.name || "",
        targetcompany_annualreport: selectedEmailReport || "",
        targetcompany_name: company.name,
        targetcompany_research: selectedEmailResearch?.research_content || "",
        targetcompany_coldcallingguide: selectedEmailGuide?.content || "",
        prospect_info: selectedEmailProspect
          ? `Name: ${selectedEmailProspect.name}
             Title: ${selectedEmailProspect.title}
             Email: ${selectedEmailProspect.email}
             Phone: ${selectedEmailProspect.phone}
             Notes: ${selectedEmailProspect.notes}`
          : "",
        owncompany_name: $ownCompany.name,
      };

      // Debug log
      console.log("Prompt Variables:", promptVariables);

      // Get the prompt
      const { prompt, model, provider } = getPrompt(
        "prospecting_email",
        promptVariables
      );

      // Debug log
      console.log("Generated Prompt:", prompt);

      const response = await callProxy(prompt, provider, model);
      const draftContent = response.choices?.[0]?.message?.content || response;

      const draft = {
        id: crypto.randomUUID(),
        prospect: selectedEmailProspect || {
          name: "[PROSPECT NAME]",
          title: "Unknown",
          email: "",
          phone: "",
          notes: "Generic draft",
        },
        content: draftContent,
        generated_at: new Date().toISOString(),
      };

      const { data: updatedCompany, error: updateError } = await supabase
        .from("targetcompanies")
        .update({
          cold_email_drafts: [...(company.cold_email_drafts || []), draft],
        })
        .eq("id", company.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update local state
      company = updatedCompany;

      // Update sessionStorage
      sessionStorage.setItem("selectedCompany", JSON.stringify(company));

      closeEmailDraftModal();
    } catch (err) {
      console.error("Error generating email draft:", err);
      error = err.message;
    } finally {
      loading = false;
    }
  }

  // Add delete function for email drafts
  async function deleteEmailDraft(draftId) {
    if (!confirm("Are you sure you want to delete this email draft?")) return;

    try {
      const updatedDrafts = company.cold_email_drafts.filter(
        (d) => d.id !== draftId
      );

      const { data: updatedCompany, error: updateError } = await supabase
        .from("targetcompanies")
        .update({
          cold_email_drafts: updatedDrafts,
        })
        .eq("id", company.id)
        .select()
        .single();

      if (updateError) throw updateError;

      company = updatedCompany;
    } catch (err) {
      console.error("Error deleting email draft:", err);
      error = err.message;
    }
  }
</script>

<div class="max-w-7xl mx-auto p-6">
  {#if loading}
    <div class="flex justify-center items-center h-64">
      <div
        class="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-b-black"
      ></div>
    </div>
  {:else if error}
    <div class="text-center text-red-600 p-4">
      {error}
    </div>
  {:else if !company}
    <div class="text-center text-gray-600 p-4">Company not found</div>
  {:else}
    <!-- Company Header -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <div class="flex justify-between items-start">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">{company.name}</h1>
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            class="text-gray-600 hover:text-gray-900 transition-all duration-200 mt-2 inline-block"
          >
            {company.website}
          </a>
          <div class="flex gap-4 mt-4">
            <div class="flex items-center gap-2">
              <div
                class={`w-3 h-3 rounded-full ${
                  company.research_result ? "bg-green-500" : "bg-orange-500"
                } animate-pulse`}
              ></div>
              <span class="text-sm text-gray-600">Research</span>
            </div>
            <div class="flex items-center gap-2">
              <div
                class={`w-3 h-3 rounded-full ${
                  company.annual_report ? "bg-green-500" : "bg-orange-500"
                } animate-pulse`}
              ></div>
              <span class="text-sm text-gray-600">Annual Report</span>
            </div>
          </div>
        </div>
        <div class="flex gap-2">
          <button
            on:click={openEditModal}
            class="p-2 text-gray-600 hover:text-gray-900 transition-all duration-200"
            title="Edit Company"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"
              />
              <path
                fill-rule="evenodd"
                d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
          <button
            on:click={deleteCompany}
            class="p-2 text-red-600 hover:text-red-800 transition-all duration-200"
            title="Delete Company"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Tabs Navigation -->
    <div class="border-b border-gray-200 mb-6">
      <nav class="-mb-px flex space-x-8">
        {#each tabs as tab}
          <button
            class="py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
              {activeTab === tab.id
              ? 'border-black text-black'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'}"
            on:click={() => (activeTab = tab.id)}
          >
            {tab.label}
          </button>
        {/each}
      </nav>
    </div>

    <!-- Tab Content -->
    <div class="bg-white rounded-lg shadow-md p-6">
      {#if activeTab === "research"}
        <div class="space-y-4">
          {#if company.research_result && company.research_result.length > 0}
            {#each company.research_result as research, index}
              <div class="border rounded-lg p-4 bg-white">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <!-- Document Icon -->
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-6 w-6 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2H7a2 2 0 01-2-2z"
                      />
                    </svg>

                    <!-- Date -->
                    <span class="text-sm text-gray-600">
                      {new Date(research.research_date).toLocaleDateString()}
                    </span>
                  </div>

                  <div class="flex items-center gap-2">
                    <!-- Eye Icon -->
                    <button
                      on:click={() => {
                        showResearchModal = true;
                        editedResearch = research.research_content;
                        selectedResearchIndex = index;
                      }}
                      class="p-2 text-gray-600 hover:text-gray-900 transition-all duration-200"
                      title="View Research"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path
                          fill-rule="evenodd"
                          d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </button>

                    <!-- Trash Icon -->
                    <button
                      on:click={async () => {
                        if (
                          confirm(
                            "Are you sure you want to delete this research?"
                          )
                        ) {
                          try {
                            // Get current research array or initialize empty array
                            const currentResearch =
                              company.research_result || [];

                            // Create updated research array
                            const updatedResearch = [...currentResearch];
                            updatedResearch.splice(index, 1);

                            // Update research in database
                            const { data: updatedCompany, error: updateError } =
                              await supabase
                                .from("targetcompanies")
                                .update({
                                  research_result: updatedResearch,
                                })
                                .eq("id", company.id)
                                .select()
                                .single();

                            if (updateError) throw updateError;

                            // Update local state
                            company = updatedCompany;

                            // Update sessionStorage
                            sessionStorage.setItem(
                              "selectedCompany",
                              JSON.stringify(company)
                            );
                          } catch (err) {
                            console.error("Error deleting research:", err);
                            error = err.message;
                          }
                        }
                      }}
                      class="p-2 text-red-600 hover:text-red-800 transition-all duration-200"
                      title="Delete Research"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            {/each}
          {:else}
            <p class="text-gray-500">No research available.</p>
          {/if}
          <button
            on:click={handleAIResearch}
            class="mt-4 px-4 py-2 border border-gray-200 bg-white text-gray-900 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center gap-2"
          >
            Do AI Research
          </button>
        </div>
      {:else if activeTab === "annual-reports"}
        <div class="space-y-4">
          {#if company.annual_report}
            <div class="border rounded p-4">
              <div class="flex justify-between items-start mb-2">
                <div>
                  <h4 class="font-semibold">
                    {company.annual_report.fileName}
                  </h4>
                </div>
                <div class="flex gap-2">
                  <!-- Add Research Button -->
                  <button
                    on:click={handleAnnualReportResearch}
                    class="px-4 py-2 border border-gray-200 bg-white text-gray-900 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center gap-2"
                    disabled={annualReportResearchLoading}
                  >
                    {#if annualReportResearchLoading}
                      <div
                        class="animate-spin rounded-full h-4 w-4 border-2 border-gray-200 border-b-black"
                      ></div>
                    {/if}
                    Analyze Report
                  </button>
                  <!-- Existing buttons -->
                </div>
              </div>

              <!-- Display existing research if available -->
              {#if company.annual_report_research}
                <div class="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div class="flex justify-between items-start">
                    <h5 class="font-medium mb-2">Analysis Results:</h5>
                    <div class="flex gap-2">
                      <button
                        on:click={openFullAnalysis}
                        class="p-2 text-gray-600 hover:text-gray-900 transition-all duration-200"
                        title="View Full Analysis"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path
                            fill-rule="evenodd"
                            d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                            clip-rule="evenodd"
                          />
                        </svg>
                      </button>
                      <button
                        on:click={deleteAnnualReportAnalysis}
                        class="p-2 text-red-600 hover:text-red-800 transition-all duration-200"
                        title="Delete Analysis"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clip-rule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div class="markdown-content line-clamp-3">
                    {@html renderMarkdown(company.annual_report_research)}
                  </div>
                </div>
              {/if}
            </div>
          {:else}
            <p class="text-gray-500">No annual report available.</p>
          {/if}

          <!-- Upload button section -->
          <div class="mt-4">
            <input
              type="file"
              accept=".txt,.pdf"
              bind:this={fileInput}
              on:change={handleFileUpload}
              class="hidden"
              id="annual-report-upload"
            />
            <label
              for="annual-report-upload"
              class="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-200 bg-white text-gray-900 rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              {uploadLoading ? "Uploading..." : "Upload Annual Report"}
            </label>

            {#if uploadLoading}
              <div class="mt-4 relative">
                <div class="bg-gray-200 rounded-full h-2.5">
                  <div
                    class="bg-black h-2.5 rounded-full transition-all duration-300"
                    style="width: {uploadProgress}%"
                  />
                </div>
                <p class="text-sm text-gray-600 mt-1">
                  Upload Progress: {uploadProgress}%
                </p>
              </div>
            {/if}

            {#if uploadError}
              <p class="text-red-500 mt-2">{uploadError}</p>
            {/if}
          </div>
        </div>
      {:else if activeTab === "prospects"}
        <div class="space-y-4">
          {#if company.prospects && company.prospects.length > 0}
            {#each company.prospects as prospect}
              <div class="border rounded p-4">
                <div class="flex justify-between items-start mb-2">
                  <div>
                    <h4 class="font-semibold">{prospect.name}</h4>
                    <p class="text-sm text-gray-500">
                      {prospect.title || "No title"}
                    </p>
                  </div>
                  <div class="flex gap-2">
                    <div class="text-right">
                      <p class="text-sm text-gray-600">{prospect.email}</p>
                      <p class="text-sm text-gray-600">{prospect.phone}</p>
                      <p class="text-xs text-gray-400">
                        Added: {new Date(
                          prospect.dateAdded
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      on:click={() => deleteProspect(prospect.id)}
                      class="p-1 text-red-600 hover:text-red-800 transition-all duration-200"
                      title="Delete Prospect"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <p class="text-gray-600 mt-2">{prospect.notes || "No notes"}</p>
              </div>
            {/each}
          {:else}
            <p class="text-gray-500">No prospects added yet.</p>
          {/if}
          <button
            on:click={openProspectModal}
            class="mt-4 px-4 py-2 border border-gray-200 bg-white text-gray-900 rounded-lg hover:bg-gray-50 transition-all duration-200"
          >
            Add Prospect
          </button>
        </div>
      {:else if activeTab === "cold-calling"}
        <div class="space-y-4">
          {#if company.cold_calling_guides && company.cold_calling_guides.length > 0}
            {#each company.cold_calling_guides as guide}
              <div class="border rounded p-4">
                <div class="flex justify-between items-start mb-2">
                  <div>
                    <h4 class="font-semibold">{guide.prospect.name}</h4>
                    <p class="text-sm text-gray-500">
                      Generated: {new Date(
                        guide.generated_at
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    on:click={() => deleteGuide(guide.id)}
                    class="p-1 text-red-600 hover:text-red-800 transition-all duration-200"
                    title="Delete Guide"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
                <div class="markdown-content mt-4">
                  {@html renderMarkdown(guide.content)}
                </div>
              </div>
            {/each}
          {:else}
            <p class="text-gray-500">No cold calling guides available.</p>
          {/if}
          <button
            on:click={openColdCallModal}
            class="mt-4 px-4 py-2 border border-gray-200 bg-white text-gray-900 rounded-lg hover:bg-gray-50 transition-all duration-200"
          >
            Generate Cold Calling Guide
          </button>
        </div>
      {:else if activeTab === "email-drafts"}
        <div class="space-y-4">
          {#if company.cold_email_drafts && company.cold_email_drafts.length > 0}
            {#each company.cold_email_drafts as draft}
              <div class="border rounded p-4">
                <div class="flex justify-between items-start mb-2">
                  <div>
                    <h4 class="font-semibold">{draft.prospect.name}</h4>
                    <p class="text-sm text-gray-500">
                      Generated: {new Date(
                        draft.generated_at
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    on:click={() => deleteEmailDraft(draft.id)}
                    class="p-1 text-red-600 hover:text-red-800 transition-all duration-200"
                    title="Delete Draft"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
                <div class="markdown-content mt-4">
                  {@html renderMarkdown(draft.content)}
                </div>
              </div>
            {/each}
          {:else}
            <p class="text-gray-500">No Prospecting Email available.</p>
          {/if}
          <button
            on:click={openEmailDraftModal}
            class="mt-4 px-4 py-2 border border-gray-200 bg-white text-gray-900 rounded-lg hover:bg-gray-50 transition-all duration-200"
          >
            Generate Email Draft
          </button>
        </div>
      {/if}
    </div>
  {/if}

  {#if showResearchModal}
    <div
      class="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center"
      transition:fade={{ duration: 200 }}
      on:click|self={closeResearchModal}
    >
      <div
        class="bg-white p-6 rounded-lg w-full max-w-4xl mx-4 shadow-xl h-[90vh] flex flex-col overflow-hidden"
        on:click|stopPropagation
      >
        <div class="flex justify-between items-start mb-4">
          <h2 class="text-xl font-semibold">AI Research Results</h2>
          <button
            class="text-gray-500 hover:text-gray-700"
            on:click={closeResearchModal}
          >
            ×
          </button>
        </div>

        {#if researchLoading}
          <div class="flex flex-col items-center justify-center py-12">
            <div
              class="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-b-black mb-4"
            ></div>
            <p class="text-gray-600">Generating AI Research...</p>
          </div>
        {:else if error}
          <div class="text-red-600 p-4 text-center">
            {error}
          </div>
        {:else}
          <form
            class="flex flex-col flex-grow overflow-hidden"
            on:submit|preventDefault={saveResearch}
          >
            <div class="flex flex-col flex-grow overflow-auto">
              <textarea
                bind:value={editedResearch}
                class="w-full p-4 border border-gray-200 rounded-lg mb-4 focus:outline-none focus:border-black focus:ring-1 focus:ring-black resize-none transition-all duration-200 flex-grow font-mono text-sm leading-relaxed min-h-[50vh]"
                placeholder="AI research results will appear here..."
              ></textarea>

              <!-- Add Citations Section -->
              {#if company?.research_result?.[selectedResearchIndex]?.citations?.length > 0}
                <div class="border-t pt-4 mb-4">
                  <h3 class="text-lg font-semibold mb-2">Sources:</h3>
                  <ul class="pl-5 list-none space-y-2">
                    {#each company.research_result[selectedResearchIndex].citations as citation}
                      <li>
                        <a
                          href={citation}
                          target="_blank"
                          rel="noopener noreferrer"
                          class="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {citation}
                        </a>
                      </li>
                    {/each}
                  </ul>
                </div>
              {/if}

              <div class="space-y-4 flex-shrink-0 mt-auto">
                <div class="flex justify-end gap-3">
                  <button
                    type="button"
                    class="px-4 py-2 border border-gray-200 bg-white text-gray-900 rounded-lg hover:bg-gray-50 transition-all duration-200"
                    on:click={closeResearchModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    class="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-200"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save Research"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        {/if}
      </div>
    </div>
  {/if}

  {#if showPreviewModal}
    <div
      class="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center"
      transition:fade={{ duration: 200 }}
      on:click|self={() => (showPreviewModal = false)}
    >
      <div
        class="bg-white p-6 rounded-lg w-full max-w-4xl mx-4 shadow-xl max-h-[90vh] overflow-auto"
        on:click|stopPropagation
      >
        <div class="flex justify-between items-start mb-4">
          <h2 class="text-xl font-semibold">
            Preview: {previewFile?.fileName}
          </h2>
          <button
            class="text-gray-500 hover:text-gray-700"
            on:click={() => (showPreviewModal = false)}
          >
            ×
          </button>
        </div>
        <div class="mt-4">
          {#if previewFile?.type.includes("pdf")}
            <iframe
              src={previewFile?.url}
              title={previewFile?.fileName}
              class="w-full h-[75vh]"
            ></iframe>
          {:else}
            <div class="text-center text-gray-600">
              Preview not available for this file type
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}

  {#if showProspectModal}
    <div
      class="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center"
      transition:fade={{ duration: 200 }}
      on:click|self={closeProspectModal}
    >
      <div
        class="bg-white p-6 rounded-lg w-full max-w-4xl mx-4 shadow-xl min-h-[80vh] flex flex-col"
        on:click|stopPropagation
      >
        <div class="flex justify-between items-start mb-4">
          <h2 class="text-xl font-semibold">Add New Prospect</h2>
          <button
            class="text-gray-500 hover:text-gray-700"
            on:click={closeProspectModal}
          >
            ×
          </button>
        </div>

        <div class="flex-grow space-y-4">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700"
              >Name</label
            >
            <input
              type="text"
              id="name"
              bind:value={newProspect.name}
              class="mt-1 block w-full rounded-lg border-gray-200 shadow-sm focus:border-black focus:ring-1 focus:ring-black p-2 transition-all duration-200"
            />
          </div>

          <div>
            <label for="title" class="block text-sm font-medium text-gray-700"
              >Title</label
            >
            <input
              type="text"
              id="title"
              bind:value={newProspect.title}
              class="mt-1 block w-full rounded-lg border-gray-200 shadow-sm focus:border-black focus:ring-1 focus:ring-black p-2 transition-all duration-200"
            />
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-gray-700"
              >Email</label
            >
            <input
              type="email"
              id="email"
              bind:value={newProspect.email}
              class="mt-1 block w-full rounded-lg border-gray-200 shadow-sm focus:border-black focus:ring-1 focus:ring-black p-2 transition-all duration-200"
            />
          </div>

          <div>
            <label for="phone" class="block text-sm font-medium text-gray-700"
              >Phone</label
            >
            <input
              type="tel"
              id="phone"
              bind:value={newProspect.phone}
              class="mt-1 block w-full rounded-lg border-gray-200 shadow-sm focus:border-black focus:ring-1 focus:ring-black p-2 transition-all duration-200"
            />
          </div>

          <div>
            <label for="notes" class="block text-sm font-medium text-gray-700"
              >Notes</label
            >
            <textarea
              id="notes"
              bind:value={newProspect.notes}
              rows="3"
              class="w-full flex-grow p-4 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black resize-none transition-all duration-200"
            ></textarea>
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <button
            class="px-4 py-2 border border-gray-200 bg-white text-gray-900 rounded-lg hover:bg-gray-50 transition-all duration-200"
            on:click={closeProspectModal}
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-200"
            on:click={saveProspect}
          >
            Save Prospect
          </button>
        </div>
      </div>
    </div>
  {/if}

  {#if showEditModal}
    <div
      class="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center"
      transition:fade={{ duration: 200 }}
      on:click|self={closeEditModal}
    >
      <div
        class="bg-white p-6 rounded-lg w-full max-w-md mx-4 shadow-xl"
        on:click|stopPropagation
      >
        <div class="flex justify-between items-start mb-4">
          <h2 class="text-xl font-semibold">Edit Company</h2>
          <button
            class="text-gray-500 hover:text-gray-700"
            on:click={closeEditModal}
          >
            ×
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <label
              for="editName"
              class="block text-sm font-medium text-gray-700"
              >Company Name</label
            >
            <input
              type="text"
              id="editName"
              bind:value={editingCompany.name}
              class="mt-1 block w-full rounded-lg border-gray-200 shadow-sm focus:border-black focus:ring-1 focus:ring-black p-2 transition-all duration-200"
            />
          </div>

          <div>
            <label
              for="editWebsite"
              class="block text-sm font-medium text-gray-700">Website</label
            >
            <input
              type="text"
              id="editWebsite"
              bind:value={editingCompany.website}
              class="mt-1 block w-full rounded-lg border-gray-200 shadow-sm focus:border-black focus:ring-1 focus:ring-black p-2 transition-all duration-200"
            />
          </div>

          <div class="flex justify-end gap-3 mt-6">
            <button
              class="px-4 py-2 border border-gray-200 bg-white text-gray-900 rounded-lg hover:bg-gray-50 transition-all duration-200"
              on:click={closeEditModal}
            >
              Cancel
            </button>
            <button
              class="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-200"
              on:click={saveCompanyEdit}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}

  {#if showEditProspectModal}
    <div
      class="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center"
      transition:fade={{ duration: 200 }}
      on:click|self={closeEditProspectModal}
    >
      <div
        class="bg-white p-6 rounded-lg w-full max-w-md mx-4 shadow-xl"
        on:click|stopPropagation
      >
        <div class="flex justify-between items-start mb-4">
          <h2 class="text-xl font-semibold">Edit Prospect</h2>
          <button
            class="text-gray-500 hover:text-gray-700"
            on:click={closeEditProspectModal}
          >
            ×
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <label
              for="editProspectName"
              class="block text-sm font-medium text-gray-700">Name</label
            >
            <input
              type="text"
              id="editProspectName"
              bind:value={editingProspect.name}
              class="mt-1 block w-full rounded-lg border-gray-200 shadow-sm focus:border-black focus:ring-1 focus:ring-black p-2 transition-all duration-200"
            />
          </div>

          <div>
            <label
              for="editProspectTitle"
              class="block text-sm font-medium text-gray-700">Title</label
            >
            <input
              type="text"
              id="editProspectTitle"
              bind:value={editingProspect.title}
              class="mt-1 block w-full rounded-lg border-gray-200 shadow-sm focus:border-black focus:ring-1 focus:ring-black p-2 transition-all duration-200"
            />
          </div>

          <div>
            <label
              for="editProspectEmail"
              class="block text-sm font-medium text-gray-700">Email</label
            >
            <input
              type="email"
              id="editProspectEmail"
              bind:value={editingProspect.email}
              class="mt-1 block w-full rounded-lg border-gray-200 shadow-sm focus:border-black focus:ring-1 focus:ring-black p-2 transition-all duration-200"
            />
          </div>

          <div>
            <label
              for="editProspectPhone"
              class="block text-sm font-medium text-gray-700">Phone</label
            >
            <input
              type="tel"
              id="editProspectPhone"
              bind:value={editingProspect.phone}
              class="mt-1 block w-full rounded-lg border-gray-200 shadow-sm focus:border-black focus:ring-1 focus:ring-black p-2 transition-all duration-200"
            />
          </div>

          <div>
            <label
              for="editProspectNotes"
              class="block text-sm font-medium text-gray-700">Notes</label
            >
            <textarea
              id="editProspectNotes"
              bind:value={editingProspect.notes}
              rows="3"
              class="w-full flex-grow p-4 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black resize-none transition-all duration-200"
            ></textarea>
          </div>

          <div class="flex justify-end gap-3 mt-6">
            <button
              class="px-4 py-2 border border-gray-200 bg-white text-gray-900 rounded-lg hover:bg-gray-50 transition-all duration-200"
              on:click={closeEditProspectModal}
            >
              Cancel
            </button>
            <button
              class="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-200"
              on:click={saveProspectEdit}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}

  {#if showColdCallModal}
    <div
      class="fixed inset-0 bg-black/70 backdrop-blur-md z-20 flex items-center justify-center"
      transition:fade={{ duration: 200 }}
      on:click|self={closeColdCallModal}
    >
      <div
        class="bg-white p-6 rounded-lg w-full max-w-2xl mx-4 shadow-xl"
        on:click|stopPropagation
      >
        <div class="flex justify-between items-start mb-4">
          <h2 class="text-xl font-semibold">Generate Cold Calling Guide</h2>
          <button
            class="text-gray-500 hover:text-gray-700"
            on:click={closeColdCallModal}
          >
            ×
          </button>
        </div>

        <div class="space-y-6">
          <!-- AI Research Section -->
          <div class="border rounded-lg p-4">
            <h3 class="font-semibold mb-3">AI Research</h3>
            {#if company.research_result}
              <div class="space-y-2">
                {#each company.research_result as research}
                  <label
                    class="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-gray-200 transition-all duration-200 {selectedResearch ===
                    research
                      ? 'bg-gray-50 border-gray-200'
                      : ''}"
                  >
                    <div
                      class="relative flex items-center justify-center w-5 h-5 mt-0.5"
                    >
                      <input
                        type="radio"
                        name="research"
                        class="peer absolute opacity-0 w-5 h-5 cursor-pointer"
                        bind:group={selectedResearch}
                        value={research}
                      />
                      <div
                        class="w-5 h-5 border-2 border-gray-300 rounded peer-checked:border-black peer-checked:bg-black transition-all duration-200"
                      ></div>
                      <svg
                        class="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity duration-200"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M5 13l4 4L19 7"
                        ></path>
                      </svg>
                    </div>
                    <div class="flex-grow">
                      <div class="font-medium">
                        Research from {new Date(
                          research.research_date
                        ).toLocaleDateString()}
                      </div>
                      <div class="text-sm text-gray-500 mt-2 line-clamp-2">
                        {research.research_content.substring(0, 150)}...
                      </div>
                    </div>
                  </label>
                {/each}
              </div>
            {:else}
              <div class="text-gray-500 mb-3">No AI research available.</div>
              <button
                on:click={() => {
                  closeColdCallModal();
                  handleAIResearch();
                }}
                class="px-3 py-1 text-sm border border-gray-200 bg-white text-gray-900 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                Generate AI Research First
              </button>
            {/if}
          </div>

          <!-- Annual Reports Section -->
          <div class="border rounded-lg p-4">
            <h3 class="font-semibold mb-3">Annual Reports</h3>
            {#if company.annual_report_research && company.annual_report_research}
              <div class="space-y-2">
                <label
                  class="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-gray-200 transition-all duration-200 {selectedReport ===
                  company.annual_report_research
                    ? 'bg-gray-50 border-gray-200'
                    : ''}"
                >
                  <div
                    class="relative flex items-center justify-center w-5 h-5 mt-0.5"
                  >
                    <input
                      type="radio"
                      name="report"
                      class="peer absolute opacity-0 w-5 h-5 cursor-pointer"
                      bind:group={selectedReport}
                      value={company.annual_report_research}
                    />
                    <div
                      class="w-5 h-5 border-2 border-gray-300 rounded peer-checked:border-black peer-checked:bg-black transition-all duration-200"
                    ></div>
                    <svg
                      class="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity duration-200"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                  </div>
                  <div class="flex-grow">
                    <div class="font-medium">
                      {company.annual_report_research.substring(0, 150)}...
                    </div>
                  </div>
                </label>
              </div>
            {:else}
              <div class="text-gray-500 mb-3">No annual reports available.</div>
              <label
                for="annual-report-upload"
                class="inline-flex px-3 py-1 text-sm border border-gray-200 bg-white text-gray-900 rounded-lg hover:bg-gray-50 transition-all duration-200 cursor-pointer"
                on:click={() => {
                  closeColdCallModal();
                  activeTab = "annual-reports";
                  setTimeout(
                    () =>
                      document.getElementById("annual-report-upload").click(),
                    100
                  );
                }}
              >
                Upload Annual Report Research
              </label>
            {/if}
          </div>

          <!-- Prospects Section -->
          <div class="border rounded-lg p-4">
            <h3 class="font-semibold mb-3">Select Prospect</h3>
            {#if company.prospects && company.prospects.length > 0}
              <div class="space-y-2">
                {#each company.prospects as prospect}
                  <label
                    class="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-gray-200 transition-all duration-200 {selectedProspect ===
                    prospect
                      ? 'bg-gray-50 border-gray-200'
                      : ''}"
                  >
                    <div
                      class="relative flex items-center justify-center w-5 h-5 mt-0.5"
                    >
                      <input
                        type="radio"
                        name="prospect"
                        class="peer absolute opacity-0 w-5 h-5 cursor-pointer"
                        bind:group={selectedProspect}
                        value={prospect}
                      />
                      <div
                        class="w-5 h-5 border-2 border-gray-300 rounded peer-checked:border-black peer-checked:bg-black transition-all duration-200"
                      ></div>
                      <svg
                        class="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity duration-200"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M5 13l4 4L19 7"
                        ></path>
                      </svg>
                    </div>
                    <div class="flex-grow">
                      <div class="font-medium">{prospect.name}</div>
                      <div class="text-sm text-gray-500">{prospect.title}</div>
                      <div class="text-sm text-gray-500 mt-1">
                        {prospect.email} • {prospect.phone}
                      </div>
                    </div>
                  </label>
                {/each}
              </div>
            {:else}
              <div class="text-gray-500 mb-3">No prospects available.</div>
              <button
                on:click={openProspectModal}
                class="px-3 py-1 text-sm border border-gray-200 bg-white text-gray-900 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                Add Prospect First
              </button>
            {/if}
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-end gap-3 mt-6">
            <button
              class="px-4 py-2 border border-gray-200 bg-white text-gray-900 rounded-lg hover:bg-gray-50 transition-all duration-200"
              on:click={closeColdCallModal}
            >
              Cancel
            </button>
            <button
              class="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              on:click={generateColdCall}
              disabled={(!selectedResearch &&
                !selectedReport &&
                !selectedProspect) ||
                loading}
            >
              {loading ? "Generating..." : "Generate Guide"}
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}

  {#if research}
    <div class="mt-6 prose prose-slate max-w-none">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="mb-6">
          {@html research}
        </div>

        {#if company?.research_citations?.length > 0}
          <div class="mt-6 border-t pt-4">
            <h3 class="text-lg font-semibold mb-2">Sources:</h3>
            <ul class="pl-5 list-none space-y-2">
              {#each company.research_citations as citation}
                <li>
                  <a
                    href={citation}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {citation}
                  </a>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  {#if showAnnualReportResearchModal}
    <div
      class="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center"
      transition:fade={{ duration: 200 }}
      on:click|self={closeAnnualReportResearchModal}
    >
      <div
        class="bg-white p-6 rounded-lg w-full max-w-4xl mx-4 shadow-xl h-[90vh] flex flex-col overflow-hidden"
        on:click|stopPropagation
      >
        <div class="flex justify-between items-start mb-4">
          <h2 class="text-xl font-semibold">Annual Report Analysis</h2>
          <button
            class="text-gray-500 hover:text-gray-700"
            on:click={closeAnnualReportResearchModal}
          >
            ×
          </button>
        </div>

        {#if annualReportResearchLoading}
          <div class="flex flex-col items-center justify-center py-12">
            <div
              class="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-b-black mb-4"
            ></div>
            <p class="text-gray-600">Analyzing Annual Report...</p>
          </div>
        {:else if error}
          <div class="text-red-600 p-4 text-center">
            {error}
          </div>
        {:else}
          <div class="flex-grow overflow-auto">
            <div class="markdown-content">
              {@html renderMarkdown(annualReportResearchResult)}
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-4">
            <button
              class="px-4 py-2 border border-gray-200 bg-white text-gray-900 rounded-lg hover:bg-gray-50 transition-all duration-200"
              on:click={closeAnnualReportResearchModal}
            >
              Close
            </button>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  {#if showFullAnalysisModal}
    <div
      class="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center"
      transition:fade={{ duration: 200 }}
      on:click|self={() => (showFullAnalysisModal = false)}
    >
      <div
        class="bg-white p-6 rounded-lg w-full max-w-4xl mx-4 shadow-xl h-[90vh] flex flex-col overflow-hidden"
        on:click|stopPropagation
      >
        <div class="flex justify-between items-start mb-4">
          <h2 class="text-xl font-semibold">Analysis Results</h2>
          <button
            class="text-gray-500 hover:text-gray-700"
            on:click={() => (showFullAnalysisModal = false)}
          >
            ×
          </button>
        </div>

        <div class="flex-grow overflow-auto">
          <div class="markdown-content">
            {@html renderMarkdown(company.annual_report_research)}
          </div>
        </div>
      </div>
    </div>
  {/if}

  {#if showEmailDraftModal}
    <div
      class="fixed inset-0 bg-black/70 backdrop-blur-md z-20 flex items-center justify-center"
      transition:fade={{ duration: 200 }}
      on:click|self={closeEmailDraftModal}
    >
      <div
        class="bg-white p-6 rounded-lg w-full max-w-2xl mx-4 shadow-xl"
        on:click|stopPropagation
      >
        <div class="flex justify-between items-start mb-4">
          <h2 class="text-xl font-semibold">Generate Email Draft</h2>
          <button
            class="text-gray-500 hover:text-gray-700"
            on:click={closeEmailDraftModal}
          >
            ×
          </button>
        </div>

        <div class="space-y-6">
          <!-- Annual Reports Section -->
          <div class="border rounded-lg p-4">
            <h3 class="font-semibold mb-3">Annual Report Analysis</h3>
            {#if company.annual_report_research}
              <div class="space-y-2">
                <label
                  class="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-gray-200 transition-all duration-200 {selectedEmailReport ===
                  company.annual_report_research
                    ? 'bg-gray-50 border-gray-200'
                    : ''}"
                >
                  <div
                    class="relative flex items-center justify-center w-5 h-5 mt-0.5"
                  >
                    <input
                      type="radio"
                      name="emailReport"
                      class="peer absolute opacity-0 w-5 h-5 cursor-pointer"
                      bind:group={selectedEmailReport}
                      value={company.annual_report_research}
                    />
                    <div
                      class="w-5 h-5 border-2 border-gray-300 rounded peer-checked:border-black peer-checked:bg-black transition-all duration-200"
                    ></div>
                    <svg
                      class="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity duration-200"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                  </div>
                  <div class="flex-grow">
                    <div class="font-medium">Annual Report Analysis</div>
                    <div class="text-sm text-gray-500 mt-2 line-clamp-2">
                      {company.annual_report_research.substring(0, 150)}...
                    </div>
                  </div>
                </label>
              </div>
            {:else}
              <div class="text-gray-500 mb-3">
                No annual report analysis available.
              </div>
              <button
                on:click={() => {
                  closeEmailDraftModal();
                  handleAnnualReportResearch();
                }}
                class="px-3 py-1 text-sm border border-gray-200 bg-white text-gray-900 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                Analyze Annual Report First
              </button>
            {/if}
          </div>

          <!-- Prospects Section -->
          <div class="border rounded-lg p-4">
            <h3 class="font-semibold mb-3">Select Prospect</h3>
            {#if company.prospects && company.prospects.length > 0}
              <div class="space-y-2">
                {#each company.prospects as prospect}
                  <label
                    class="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-gray-200 transition-all duration-200 {selectedEmailProspect ===
                    prospect
                      ? 'bg-gray-50 border-gray-200'
                      : ''}"
                  >
                    <div
                      class="relative flex items-center justify-center w-5 h-5 mt-0.5"
                    >
                      <input
                        type="radio"
                        name="emailProspect"
                        class="peer absolute opacity-0 w-5 h-5 cursor-pointer"
                        bind:group={selectedEmailProspect}
                        value={prospect}
                      />
                      <div
                        class="w-5 h-5 border-2 border-gray-300 rounded peer-checked:border-black peer-checked:bg-black transition-all duration-200"
                      ></div>
                      <svg
                        class="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity duration-200"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M5 13l4 4L19 7"
                        ></path>
                      </svg>
                    </div>
                    <div class="flex-grow">
                      <div class="font-medium">{prospect.name}</div>
                      <div class="text-sm text-gray-500">{prospect.title}</div>
                      <div class="text-sm text-gray-500 mt-1">
                        {prospect.email} • {prospect.phone}
                      </div>
                    </div>
                  </label>
                {/each}
              </div>
            {:else}
              <div class="text-gray-500 mb-3">No prospects available.</div>
              <button
                on:click={openProspectModal}
                class="px-3 py-1 text-sm border border-gray-200 bg-white text-gray-900 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                Add Prospect First
              </button>
            {/if}
          </div>

          <!-- Cold Calling Guide Section -->
          <div class="border rounded-lg p-4">
            <h3 class="font-semibold mb-3">Cold Calling Guide</h3>
            {#if company.cold_calling_guides && company.cold_calling_guides.length > 0}
              <div class="space-y-2">
                {#each company.cold_calling_guides as guide}
                  <label
                    class="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-gray-200 transition-all duration-200 {selectedEmailGuide ===
                    guide
                      ? 'bg-gray-50 border-gray-200'
                      : ''}"
                  >
                    <div
                      class="relative flex items-center justify-center w-5 h-5 mt-0.5"
                    >
                      <input
                        type="radio"
                        name="emailGuide"
                        class="peer absolute opacity-0 w-5 h-5 cursor-pointer"
                        bind:group={selectedEmailGuide}
                        value={guide}
                      />
                      <div
                        class="w-5 h-5 border-2 border-gray-300 rounded peer-checked:border-black peer-checked:bg-black transition-all duration-200"
                      ></div>
                      <svg
                        class="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity duration-200"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M5 13l4 4L19 7"
                        ></path>
                      </svg>
                    </div>
                    <div class="flex-grow">
                      <div class="font-medium">
                        Guide for {guide.prospect.name}
                      </div>
                      <div class="text-sm text-gray-500">
                        Generated: {new Date(
                          guide.generated_at
                        ).toLocaleDateString()}
                      </div>
                      <div class="text-sm text-gray-500 mt-2 line-clamp-2">
                        {guide.content.substring(0, 150)}...
                      </div>
                    </div>
                  </label>
                {/each}
              </div>
            {:else}
              <div class="text-gray-500 mb-3">
                No cold calling guides available.
              </div>
              <button
                on:click={() => {
                  closeEmailDraftModal();
                  activeTab = "cold-calling";
                  openColdCallModal();
                }}
                class="px-3 py-1 text-sm border border-gray-200 bg-white text-gray-900 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                Generate Cold Calling Guide First
              </button>
            {/if}
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-end gap-3 mt-6">
            <button
              class="px-4 py-2 border border-gray-200 bg-white text-gray-900 rounded-lg hover:bg-gray-50 transition-all duration-200"
              on:click={closeEmailDraftModal}
            >
              Cancel
            </button>
            <button
              class="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              on:click={generateEmailDraft}
              disabled={(!selectedEmailResearch &&
                !selectedEmailReport &&
                !selectedEmailProspect &&
                !selectedEmailGuide) ||
                loading}
            >
              {loading ? "Generating..." : "Generate Draft"}
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  :global(.markdown-content) {
    @apply space-y-4 text-gray-600;
  }

  :global(.markdown-content h1) {
    @apply text-2xl font-bold text-gray-900 mt-6 mb-4;
  }

  :global(.markdown-content h2) {
    @apply text-xl font-semibold text-gray-900 mt-5 mb-3;
  }

  :global(.markdown-content h3) {
    @apply text-lg font-semibold text-gray-900 mt-4 mb-2;
  }

  :global(.markdown-content p) {
    @apply leading-relaxed;
  }

  :global(.markdown-content ul) {
    @apply list-disc list-inside space-y-2 ml-4;
  }

  :global(.markdown-content ol) {
    @apply list-decimal list-inside space-y-2 ml-4;
  }

  :global(.markdown-content li) {
    @apply text-gray-600;
  }

  :global(.markdown-content a) {
    @apply text-gray-900 underline hover:text-gray-600 transition-colors duration-200;
  }

  :global(.markdown-content blockquote) {
    @apply pl-4 border-l-4 border-gray-200 italic text-gray-600;
  }

  :global(.markdown-content code) {
    @apply bg-gray-100 px-1 py-0.5 rounded font-mono text-sm;
  }

  :global(.markdown-content pre) {
    @apply bg-gray-100 p-4 rounded-lg overflow-x-auto;
  }

  :global(.markdown-content pre code) {
    @apply bg-transparent p-0;
  }

  :global(.markdown-content table) {
    @apply w-full border-collapse;
  }

  :global(.markdown-content th) {
    @apply border border-gray-200 px-4 py-2 bg-gray-50 text-left font-semibold;
  }

  :global(.markdown-content td) {
    @apply border border-gray-200 px-4 py-2;
  }

  :global(.markdown-content img) {
    @apply max-w-full rounded-lg;
  }

  :global(.markdown-content hr) {
    @apply my-8 border-gray-200;
  }
</style>
