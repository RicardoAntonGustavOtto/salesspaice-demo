<!-- @format -->
<script lang="ts">
  import { Card } from "$lib/components/ui/card";
  import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "$lib/components/ui/dialog";
  import FileIcon from "lucide-svelte/icons/file";
  import EyeIcon from "lucide-svelte/icons/eye";
  import BuildingIcon from "lucide-svelte/icons/building";
  import MailIcon from "lucide-svelte/icons/mail";
  import BriefcaseIcon from "lucide-svelte/icons/briefcase";
  import DollarSignIcon from "lucide-svelte/icons/dollar-sign";
  import { Button } from "$lib/components/ui/button";
  import { marked } from "marked";

  import NotebookPen from "lucide-svelte/icons/notebook-pen";
  import Mic from "lucide-svelte/icons/mic";

  import { writable } from "svelte/store";

  interface Note {
    id: number;
    text: string;
    date: string;
    author: string;
  }

  const newNote = writable("");

  let notes: Note[] = [
    {
      id: 1,
      text: "Initial meeting went well - showed strong interest in API capabilities",
      date: "2024-01-15",
      author: "Ryan",
    },
    {
      id: 2,
      text: "Follow up call scheduled for next week to discuss technical requirements",
      date: "2024-01-18",
      author: "Sarah",
    },
  ];

  const meetings = [
    {
      id: 2,
      title: "Technical Discussion with Andrew",
      date: "December 15, 2024",
      summary: "Deep dive into implementation details and project structure.",
      content: `### Meeting Summary: Andrew (Project Manager, Devii) and James Miller (CIO, DataFlow Analytics)

**Date:** December 15, 2024

**Location:** Virtual Meeting

**Duration:** 60 minutes

---

#### **Attendees**

- **Andrew** - Project Manager, Devii
- **James Miller** - Chief Information Officer, DataFlow Analytics

---

#### **Meeting Objectives**

1. Provide an overview of Devii's implementation project structure.
2. Address specific details about project alignment with DataFlow Analytics' goals.
3. Gather additional requirements and priorities from James Miller.

---

#### **Key Discussion Points**

1. **Implementation Framework:**

   - Andrew outlined Devii's structured approach to implementation, which includes:
     - **Initial Assessment:** Comprehensive analysis of the client's database architecture and integration requirements.
     - **Custom Configuration:** Tailoring Devii's API solutions to match DataFlow Analytics' operational workflows.
     - **Phased Deployment:** Gradual roll-out of the solution to ensure seamless integration and minimal disruption.
     - **Post-Deployment Support:** Dedicated resources for troubleshooting, optimization, and scalability enhancements.

   - Andrew emphasized the importance of collaboration between both teams to refine the implementation timeline and deliverables.

2. **Additional Insights from James:**

   - James shared key details about DataFlow Analytics that he had previously overlooked during his meeting with Ryan:
     - **Integration Specifics:**
       - DataFlow Analytics requires APIs that can integrate deeply with both Tableau and Power BI dashboards for real-time data visualization.
       - The ability to dynamically scale the APIs based on data volume fluctuations is a critical need.
     - **Security Priorities:**
       - James reiterated the importance of robust compliance mechanisms, particularly around data sovereignty and multi-level access controls.
     - **Upcoming Milestone:**
       - A significant project milestone involves expanding self-service analytics tools by Q3 2025, necessitating scalable and efficient API support.

3. **Collaborative Alignment:**

   - Andrew reassured James of Devii's capability to meet these requirements, highlighting:
     - Devii's compatibility with leading BI tools and its centralized management features for APIs.
     - The platform's PBAC and RBAC security frameworks, which align with DataFlow Analytics' compliance goals.
     - Scalable API infrastructure designed to handle large data volumes dynamically.

   - Andrew also proposed a collaborative workshop between technical teams to ensure alignment on key performance indicators (KPIs) and project milestones.

---

#### **Outcomes and Next Steps**

1. **Technical Workshop:**
   - Devii and DataFlow Analytics' technical teams will conduct a joint workshop to define specific integration requirements and KPIs.

2. **Refined Proposal:**
   - Andrew will draft an updated implementation proposal incorporating the additional requirements shared by James.

3. **Pilot Project Definition:**
   - Both parties agreed to identify a small-scale pilot project focused on API integration with Tableau and Power BI.

4. **Follow-Up Meeting:**
   - A follow-up meeting is scheduled for January 5, 2025, to review the refined proposal and finalize the pilot project scope.

---

#### **Key Takeaways**

- James provided critical details about integration needs, security priorities, and upcoming milestones, ensuring a more tailored approach to Devii's implementation plan.
- Devii's structured implementation framework aligns well with DataFlow Analytics' goals, providing confidence in the platform's capability to deliver measurable value.
- Collaboration and clear communication will be essential to the success of the project, with a strong emphasis on aligning technical specifications and project timelines.`,
      avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=andrew",
      person: "Andrew",
    },
    {
      id: 1,
      title: "Initial Meeting with Ryan",
      date: "December 10, 2024",
      summary:
        "Introductory meeting discussing Devii's capabilities and potential applications within DataFlow Analytics.",
      content: `### Meeting Summary: Ryan (Director of Operations, Devii) and James Miller (CIO, DataFlow Analytics)

**Date:** December 10, 2024
**Location:** Virtual Meeting
**Duration:** 60 minutes

---

#### **Attendees**

- **Ryan** - Director of Operations, Devii
- **James Miller** - Chief Information Officer, DataFlow Analytics

---

#### **Meeting Objectives**

1. Introduce Devii's capabilities and value proposition.
2. Explore potential applications of Devii's platform within DataFlow Analytics.
3. Discuss alignment with James's upcoming projects and strategic initiatives.

---

#### **Key Discussion Points**

1. **Overview of Devii's Platform:**

   - Ryan presented Devii as an advanced GraphQL API management platform that supports database introspection for instant API creation.
   - He highlighted Devii's core strengths: **automation**, **security frameworks (PBAC & RBAC)**, and **process efficiency**, emphasizing their relevance to James's initiatives at DataFlow Analytics.
   - Specific focus was given to Devii's ability to integrate with databases like MySQL, PostgreSQL, and Oracle—aligning with DataFlow Analytics' technology stack.

2. **DataFlow Analytics' Needs and Challenges:**

   - James shared insights into current challenges, including the need to streamline **data pipeline automation** and improve **client integration** processes.
   - He expressed interest in solutions that could enhance the scalability and flexibility of analytics infrastructure, particularly as client data volumes continue to grow.
   - James also mentioned his ongoing project to expand **self-service analytics tools**, aiming to empower clients with more autonomy.

3. **Potential Synergies:**

   - Ryan identified several ways Devii could directly address James's challenges:
     - Automating API creation to facilitate **faster client integration**.
     - Streamlining **data synchronization** between disparate systems using Devii's centralized management capabilities.
     - Providing a secure, scalable framework for handling real-time data processing demands.
   - Ryan noted that Devii's policy-based access control could simplify DataFlow Analytics' compliance efforts for secure client data management.

4. **Alignment with James's Projects:**

   - James was particularly intrigued by Devii's automation and scalability features for his **data pipeline automation** and **scalable analytics infrastructure** projects.
   - He expressed a desire to explore Devii's ability to integrate seamlessly with existing analytics tools like Tableau and Power BI.

---

#### **Outcomes and Next Steps**

1. **Follow-Up Meeting:**

   - Ryan and James agreed to schedule a technical demonstration of Devii's platform to evaluate its fit with DataFlow Analytics' systems.

2. **Custom Use Case Proposal:**

   - Ryan will draft a proposal tailored to DataFlow Analytics' specific needs, focusing on API automation, client data integration, and real-time data processing capabilities.

3. **Integration Exploration:**

   - Both teams will collaborate to identify a pilot project for Devii's integration into DataFlow Analytics' workflows, with a focus on James's **self-service tools expansion initiative**.

---

#### **Key Takeaways**

- James is highly receptive to Devii's capabilities and sees potential alignment with his strategic goals.
- There is significant overlap between Devii's strengths and the challenges faced by DataFlow Analytics.
- A clear opportunity exists to demonstrate tangible value through a targeted pilot project.`,
      avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=ryan",
      person: "Ryan",
    },
  ];

  const keyPoints = [
    "Strong alignment with Devii's core strengths in API automation and data integration",
    "Pain points include data pipeline automation and client integration processes",
    "Key milestone: Expanding self-service analytics tools by Q3 2025",
    "Integration needs with Tableau and Power BI for real-time visualization",
    "Focus on security compliance and multi-level access controls",
  ];

  const prospect = {
    name: "James Miller",
    title: "CIO",
    company: "DataFlow Analytics",
    email: "james.miller@dataflow.com",
    background:
      "20+ years in IT leadership, Stanford CS graduate, MBA from Kellogg",
  };

  const opportunities = [
    {
      name: "Enterprise API Integration Platform",
      value: "$250,000",
      status: "Proposal Stage",
      probability: "65%",
      expectedClose: "Q2 2024",
    },
    {
      name: "Data Pipeline Automation Suite",
      value: "$180,000",
      status: "Discovery",
      probability: "40%",
      expectedClose: "Q3 2024",
    },
    {
      name: "Analytics Dashboard Solution",
      value: "$95,000",
      status: "Initial Contact",
      probability: "25%",
      expectedClose: "Q4 2024",
    },
  ];
</script>

<!-- Prospect Profile and Opportunities -->
<div class="space-y-6 p-6">
  <Dialog>
    <DialogTrigger>
      <Button variant="ghost" size="icon" class="">
        <NotebookPen class="h-5 w-5" />
      </Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Prospect Notes</DialogTitle>
      </DialogHeader>

      <div class="space-y-4">
        <form
          class="flex gap-2"
          on:submit|preventDefault={() => {
            if ($newNote) {
              notes = [
                ...notes,
                {
                  id: notes.length + 1,
                  text: $newNote,
                  author: "You",
                  date: new Date().toLocaleDateString(),
                },
              ];
              newNote.set("");
            }
          }}
        >
          <input
            type="text"
            placeholder="Add a note..."
            class="flex-1 rounded-md border border-gray-300 px-3 py-2"
            bind:value={$newNote}
          />
          <button class="rounded-full p-2 hover:bg-gray-100">
            <Mic class="h-5 w-5" />
          </button>
        </form>

        <div class="space-y-3">
          {#if notes}
            {#each notes as note}
              <div class="rounded-lg border border-gray-200 p-3">
                <p class="text-sm">{note.text}</p>
                <div
                  class="flex justify-between items-center mt-2 text-xs text-gray-500"
                >
                  <span>{note.author}</span>
                  <span>{note.date}</span>
                </div>
              </div>
            {/each}
          {:else}
            <div class="text-center text-gray-500 py-4">
              No notes yet. Add your first note above.
            </div>
          {/if}
        </div>
      </div>
    </DialogContent>
  </Dialog>
  <div class="grid grid-cols-2 gap-6">
    <!-- Prospect Profile Card -->
    <Card class="p-4">
      <div class="flex items-center gap-3">
        <img
          src="https://api.dicebear.com/7.x/lorelei/svg?seed=james"
          alt="James Miller"
          class="w-12 h-12 rounded-full"
        />
        <div>
          <h2 class="text-xl font-bold">{prospect.name}</h2>
          <p class="text-sm text-gray-600">
            {prospect.title} at {prospect.company}
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-2 mt-3 text-sm">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <BuildingIcon class="w-4 h-4 text-gray-500" />
            <span>{prospect.company}</span>
          </div>
          <Dialog>
            <DialogTrigger>
              <Button variant="outline" size="sm"
                >Show Target Company Research</Button
              >
            </DialogTrigger>
            <DialogContent class="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Company Research: {prospect.company}</DialogTitle>
              </DialogHeader>
              <div class="mt-4 prose prose-sm max-w-none">
                <h2 class="text-xl font-bold">
                  Company Profile: DataFlow Analytics
                </h2>

                <h3 class="text-lg font-semibold mt-4">Overview</h3>
                <p>
                  DataFlow Analytics is a leading-edge provider of advanced data
                  analytics and business intelligence solutions, dedicated to
                  empowering organizations to harness the power of their data.
                  Founded in 2015 and headquartered in Austin, Texas, the
                  company has grown into a trusted partner for businesses across
                  a variety of industries, including finance, healthcare,
                  retail, and manufacturing. DataFlow Analytics prides itself on
                  delivering actionable insights through sophisticated analytics
                  tools and custom solutions tailored to each client's needs.
                </p>

                <h3 class="text-lg font-semibold mt-4">Core Offerings</h3>

                <h4 class="font-semibold">
                  1. Data Integration and Management
                </h4>
                <ul>
                  <li>
                    Centralized platforms for aggregating data from multiple
                    sources, ensuring data accuracy and consistency.
                  </li>
                  <li>
                    Expertise in database management systems like MySQL,
                    PostgreSQL, and Oracle, with seamless integration
                    capabilities.
                  </li>
                </ul>

                <h4 class="font-semibold">2. Advanced Analytics Solutions</h4>
                <ul>
                  <li>
                    Predictive analytics using machine learning models to
                    anticipate trends and identify opportunities.
                  </li>
                  <li>
                    Real-time analytics dashboards for instant access to key
                    performance indicators (KPIs).
                  </li>
                  <li>
                    Natural language processing (NLP) tools for text analysis
                    and sentiment evaluation.
                  </li>
                </ul>

                <h4 class="font-semibold">
                  3. Custom Reporting and Visualization
                </h4>
                <ul>
                  <li>
                    Intuitive dashboards and data visualization tools designed
                    to simplify complex datasets.
                  </li>
                  <li>
                    Automated reporting capabilities that reduce manual
                    workloads and improve accuracy.
                  </li>
                </ul>

                <h4 class="font-semibold">4. Strategic Data Consultation</h4>
                <ul>
                  <li>
                    Advisory services to help organizations establish and
                    implement data-driven strategies.
                  </li>
                  <li>
                    Tailored solutions to align with specific industry
                    challenges and objectives.
                  </li>
                </ul>

                <h3 class="text-lg font-semibold mt-4">Technology Stack</h3>
                <p>
                  DataFlow Analytics leverages a wide array of technologies to
                  deliver its services, including Python, R, Tableau, Power BI,
                  and cloud platforms like AWS and Azure. Their integration
                  expertise ensures clients can connect and optimize their
                  existing technology stack for enhanced performance and
                  scalability.
                </p>

                <h3 class="text-lg font-semibold mt-4">Client Impact</h3>
                <p>
                  DataFlow Analytics has a proven track record of driving
                  measurable results for its clients:
                </p>
                <ul>
                  <li>
                    Reduced operational inefficiencies by 30% for a Fortune 500
                    retail client through real-time analytics.
                  </li>
                  <li>
                    Improved patient outcomes for a healthcare provider by
                    enabling predictive modeling for resource allocation.
                  </li>
                  <li>
                    Boosted revenue by 20% for a manufacturing firm via
                    actionable insights from supply chain data.
                  </li>
                </ul>

                <h3 class="text-lg font-semibold mt-4">Vision</h3>
                <p>
                  DataFlow Analytics aims to become the gold standard in data
                  analytics by continuously innovating and adapting to emerging
                  technologies. Their partnership with forward-thinking
                  platforms like Devii underscores their commitment to
                  delivering cutting-edge solutions that drive meaningful
                  business outcomes for their clients.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div class="flex items-center gap-2">
          <MailIcon class="w-4 h-4 text-gray-500" />
          <span>{prospect.email}</span>
        </div>
        <div class="flex items-center gap-2">
          <BriefcaseIcon class="w-4 h-4 text-gray-500" />
          <span class="text-sm">{prospect.background}</span>
        </div>
      </div>

      <div class="flex gap-2 mt-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button class="flex-1">Show Instant Status</Button>
          </DialogTrigger>
          <DialogContent class="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle
                >Meta-Summary of Meetings Between Devii Representatives and {prospect.name}
                ({prospect.title}, {prospect.company})</DialogTitle
              >
            </DialogHeader>
            <div class="mt-4 prose prose-sm max-w-none">
              <h4 class="text-lg font-semibold">Key Themes from Meetings:</h4>

              <div class="mt-4">
                <p class="font-semibold">1. Strategic Alignment:</p>
                <ul class="list-disc pl-6">
                  <li>
                    James Miller's priorities at DataFlow Analytics strongly
                    align with Devii's core strengths. These include API
                    automation, data integration, and scalable
                    infrastructure—key areas where Devii's platform can provide
                    immediate value.
                  </li>
                </ul>
              </div>

              <div class="mt-4">
                <p class="font-semibold">
                  2. Pain Points Identified by James Miller:
                </p>
                <ul class="list-disc pl-6">
                  <li>
                    Streamlining <strong>data pipeline automation</strong> to reduce
                    manual intervention.
                  </li>
                  <li>
                    Enhancing <strong>client integration</strong> processes for seamless
                    interoperability.
                  </li>
                  <li>
                    Meeting the demands of growing <strong
                      >real-time data processing</strong
                    >.
                  </li>
                  <li>
                    Expanding <strong>self-service analytics tools</strong> for client
                    autonomy by Q3 2025.
                  </li>
                  <li>
                    Maintaining robust <strong>data security</strong> and compliance
                    frameworks.
                  </li>
                </ul>
              </div>

              <div class="mt-4">
                <p class="font-semibold">3. Potential Use Cases for Devii:</p>
                <ul class="list-disc pl-6">
                  <li>
                    Automating API creation for faster, more flexible client
                    integrations.
                  </li>
                  <li>
                    Simplifying data synchronization using Devii's centralized
                    API management.
                  </li>
                  <li>
                    Providing scalable solutions to manage fluctuating data
                    volumes efficiently.
                  </li>
                  <li>
                    Enhancing integration with BI tools like Tableau and Power
                    BI.
                  </li>
                </ul>
              </div>

              <hr class="my-6" />

              <h4 class="text-lg font-semibold">Meeting Summaries</h4>

              <div class="mt-4">
                <p class="font-semibold">Summary of Ryan's Meeting:</p>
                <ul class="list-disc pl-6">
                  <li>
                    <strong>Overview:</strong> Introduction to Devii's platform capabilities
                  </li>
                  <li>
                    <strong>Feedback:</strong> Emphasis on automation needs and scalable
                    infrastructure
                  </li>
                  <li>
                    <strong>Outcomes:</strong> Proposed technical demonstration and
                    pilot project
                  </li>
                </ul>
              </div>

              <div class="mt-4">
                <p class="font-semibold">Summary of Andrew's Meeting:</p>
                <ul class="list-disc pl-6">
                  <li>
                    <strong>Focus:</strong> Detailed implementation process and technical
                    requirements
                  </li>
                  <li>
                    <strong>Key Points:</strong> Integration needs, API scalability,
                    compliance mechanisms
                  </li>
                  <li>
                    <strong>Next Steps:</strong> Technical workshop and refined implementation
                    proposal
                  </li>
                </ul>
              </div>

              <hr class="my-6" />

              <h4 class="text-lg font-semibold">Recommended Next Steps:</h4>
              <ul class="list-disc pl-6">
                <li>
                  Prepare specific use cases focusing on BI tool integration
                </li>
                <li>Outline technical workshop and pilot project timelines</li>
                <li>
                  Emphasize long-term partnership potential and scalability
                </li>
              </ul>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" class="flex-1"
              >Show Prospect Research</Button
            >
          </DialogTrigger>
          <DialogContent class="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Professional Profile: {prospect.name}</DialogTitle>
            </DialogHeader>
            <div class="mt-4 prose prose-sm max-w-none">
              <h3 class="text-lg font-semibold">Overview</h3>
              <p>
                James Miller is the Chief Information Officer (CIO) at DataFlow
                Analytics, where he oversees the organization's technology
                strategy and ensures the alignment of IT initiatives with
                business goals. With over 20 years of experience in information
                technology and leadership, James is a forward-thinking executive
                who excels at leveraging technology to drive innovation and
                operational efficiency.
              </p>

              <h3 class="text-lg font-semibold mt-4">
                Background and Expertise
              </h3>
              <p>
                James holds a Bachelor's degree in Computer Science from
                Stanford University and an MBA from the Kellogg School of
                Management at Northwestern University. His diverse background
                includes roles in software development, enterprise architecture,
                and IT operations, giving him a holistic view of the technology
                landscape.
              </p>
              <p>
                As a seasoned CIO, James has a proven track record of delivering
                transformative technology solutions across multiple industries,
                including finance, healthcare, and retail. His expertise lies in
                areas such as data integration, cloud computing, cybersecurity,
                and enterprise systems architecture.
              </p>

              <h3 class="text-lg font-semibold mt-4">Key Achievements</h3>
              <ul>
                <li>
                  <strong>Enterprise Data Platform Overhaul:</strong> Led a cross-functional
                  team to revamp DataFlow Analytics' core data platform, significantly
                  improving data processing speed and scalability. The project included
                  integrating diverse data sources and adopting modern cloud-based
                  solutions, reducing costs by 25%.
                </li>
                <li>
                  <strong>AI-Driven Insights Platform:</strong> Spearheaded the development
                  of an AI-powered analytics platform that provides real-time insights
                  for clients. This initiative enhanced the company's product offerings
                  and expanded market reach.
                </li>
                <li>
                  <strong>Cybersecurity Enhancements:</strong> Implemented a robust,
                  multi-layered cybersecurity framework to protect sensitive client
                  data and ensure compliance with international data protection regulations.
                </li>
              </ul>

              <h3 class="text-lg font-semibold mt-4">
                Current and Future Projects
              </h3>
              <ol>
                <li>
                  <strong>Automating Data Pipelines:</strong> James is leading an
                  initiative to streamline the company's data pipelines by adopting
                  more dynamic and automated processes. The goal is to reduce manual
                  intervention, increase efficiency, and improve data quality for
                  analytics.
                </li>
                <li>
                  <strong>Optimizing Client Integration:</strong> To address client
                  demand for seamless integrations, James is driving efforts to enhance
                  interoperability between DataFlow Analytics' systems and client
                  databases. This involves leveraging modern API technologies to
                  simplify data synchronization and improve performance.
                </li>
                <li>
                  <strong>Scalable Analytics Infrastructure:</strong> Recognizing
                  the growing demand for real-time data processing, James is exploring
                  scalable solutions for analytics infrastructure to support the
                  increasing volume of client data. This includes evaluating cutting-edge
                  technologies that can provide flexibility and reliability.
                </li>
                <li>
                  <strong>Expanding Self-Service Tools:</strong> Aiming to empower
                  clients with greater autonomy, James is working on expanding self-service
                  analytics tools that allow users to customize reports and dashboards
                  without heavy reliance on technical support.
                </li>
              </ol>

              <h3 class="text-lg font-semibold mt-4">Leadership Style</h3>
              <p>
                James believes in fostering a culture of collaboration and
                innovation. He encourages his team to embrace new technologies
                and continuously improve their skill sets. His leadership style
                is marked by a focus on strategic thinking, clear communication,
                and a results-driven approach.
              </p>

              <h3 class="text-lg font-semibold mt-4">Vision</h3>
              <p>
                Under James' leadership, DataFlow Analytics is poised to remain
                at the forefront of the data analytics industry. By staying
                ahead of technological trends and prioritizing client-centric
                solutions, James aims to ensure the company's continued growth
                and success in an increasingly data-driven world.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Card>

    <!-- Opportunities Card -->
    <Card class="p-4">
      <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
        <DollarSignIcon class="w-5 h-5 text-green-600" />
        Opportunities
      </h3>
      <div class="space-y-4">
        {#each opportunities as opp}
          <div class="border-b border-gray-100 pb-3 last:border-0">
            <div class="flex justify-between items-start">
              <div>
                <h4 class="font-medium">{opp.name}</h4>
                <p class="text-sm text-gray-600">
                  Expected close: {opp.expectedClose}
                </p>
              </div>
              <div class="text-right">
                <p class="font-semibold text-green-600">{opp.value}</p>
              </div>
            </div>
            <div class="mt-1">
              <span
                class="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full"
              >
                {opp.status}
              </span>
            </div>
          </div>
        {/each}
      </div>
    </Card>
  </div>

  <!-- Key Points and Meeting Timeline Grid -->
  <div class="grid grid-cols-2 gap-6">
    <!-- Key Points -->
    <Card class="p-6">
      <h3 class="text-xl font-semibold mb-4">Quick Prep</h3>

      <div class="space-y-6">
        <div>
          <h4 class="font-semibold text-gray-900 mb-2">Your Focus:</h4>
          <ul class="space-y-2">
            <li class="flex items-start gap-2">
              <div class="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2" />
              <span>Build on positive rapport from Ryan/Andrew</span>
            </li>
            <li class="flex items-start gap-2">
              <div class="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2" />
              <span>Confirm Devii's strategic alignment with James' vision</span
              >
            </li>
          </ul>
        </div>

        <div>
          <h4 class="font-semibold text-gray-900 mb-2">
            Key Needs from DataFlow:
          </h4>
          <ul class="space-y-2">
            <li class="flex items-start gap-2">
              <div class="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2" />
              <span
                >Automate data pipelines & streamline client integration</span
              >
            </li>
            <li class="flex items-start gap-2">
              <div class="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2" />
              <span>Expand self-service analytics tools (target Q3 2025)</span>
            </li>
            <li class="flex items-start gap-2">
              <div class="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2" />
              <span>Ensure scalability for real-time data processing</span>
            </li>
            <li class="flex items-start gap-2">
              <div class="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2" />
              <span
                >Maintain robust data security & compliance (multi-level access
                control)</span
              >
            </li>
          </ul>
        </div>

        <div>
          <h4 class="font-semibold text-gray-900 mb-2">Devii's Fit:</h4>
          <ul class="space-y-2">
            <li class="flex items-start gap-2">
              <div class="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2" />
              <span
                >Automates API creation & integrates seamlessly with DataFlow's
                tools (Tableau, Power BI)</span
              >
            </li>
            <li class="flex items-start gap-2">
              <div class="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2" />
              <span
                >Scalable, centralized API management for fluctuating data
                volumes</span
              >
            </li>
            <li class="flex items-start gap-2">
              <div class="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2" />
              <span>PBAC/RBAC frameworks to support compliance</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 class="font-semibold text-gray-900 mb-2">
            Opportunities for Discussion:
          </h4>
          <ul class="space-y-2">
            <li class="flex items-start gap-2">
              <div class="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2" />
              <span
                >Pilot project ideas (e.g., API integration for BI tools)</span
              >
            </li>
            <li class="flex items-start gap-2">
              <div class="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2" />
              <span>Timeline for a technical workshop to define KPIs</span>
            </li>
            <li class="flex items-start gap-2">
              <div class="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2" />
              <span
                >Highlight Devii's potential ROI: faster integrations, reduced
                manual workloads</span
              >
            </li>
          </ul>
        </div>
      </div>
    </Card>

    <!-- Meeting Timeline -->
    <Card class="p-6">
      <h3 class="text-xl font-semibold mb-6">Meeting Timeline</h3>
      <div class="relative">
        {#each meetings as meeting, i}
          <div class="flex gap-4 mb-8">
            <!-- Timeline line -->
            {#if i !== meetings.length - 1}
              <div
                class="absolute w-0.5 bg-blue-200 h-full left-[19px] top-8 -z-10"
              />
            {/if}

            <!-- Timeline dot with avatar -->
            <div
              class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden"
            >
              <img
                src={meeting.avatar}
                alt={meeting.person}
                class="w-full h-full object-cover"
              />
            </div>

            <!-- Meeting content -->
            <Dialog>
              <DialogTrigger class="flex-grow">
                <div
                  class="text-left bg-white rounded-lg p-4 hover:bg-gray-50 cursor-pointer border border-gray-200 w-full"
                >
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="font-medium text-lg">{meeting.title}</p>
                      <p class="text-sm text-gray-500">{meeting.date}</p>
                      <p class="text-sm text-gray-600 mt-2">
                        {meeting.summary}
                      </p>
                    </div>
                    <EyeIcon class="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent class="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{meeting.title}</DialogTitle>
                </DialogHeader>
                <div class="mt-4">
                  <p class="text-gray-600 mb-4">{meeting.summary}</p>
                  <div class="prose prose-lg max-w-none">
                    {@html marked(meeting.content)}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        {/each}
      </div>
    </Card>
  </div>
</div>
