<!-- @format -->
<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import * as Table from "$lib/components/ui/table";
  import PersonIcon from "lucide-svelte/icons/user-round";
  import MailIcon from "lucide-svelte/icons/mail";
  import CompanyIcon from "lucide-svelte/icons/building-2";
  import StarIcon from "lucide-svelte/icons/star";
  import PencilIcon from "lucide-svelte/icons/pencil";
  import TrashIcon from "lucide-svelte/icons/trash";
  import CalendarIcon from "lucide-svelte/icons/calendar-days";
  import { goto } from "$app/navigation";

  let attendees = [
    {
      id: 1,
      avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=1",
      name: "John Meyer",
      email: "johnmeyer@meyertech.com",
      company: "MeyerTech",
      role: "Chief Technology Officer",
      status: "meeting planned",
      slug: "",
    },
    {
      id: 2,
      avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=2",
      name: "Sarah Johnson",
      email: "sarah.j@techcorp.io",
      company: "TechCorp Inc",
      role: "Product Manager",
      status: "confirmed",
      slug: "",
    },
    {
      id: 3,
      avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=3",
      name: "Michael Chen",
      email: "mchen@innovate.co",
      company: "Innovate Solutions",
      role: "Senior Developer",
      status: "pending",
      slug: "",
    },
    {
      id: 4,
      avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=4",
      name: "Emma Wilson",
      email: "emma@cloudnet.com",
      company: "CloudNet Systems",
      role: "Sales Director",
      status: "meeting planned",
      slug: "",
    },
    {
      id: 5,
      avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=5",
      name: "James Miller",
      email: "james.m@dataflow.net",
      company: "DataFlow Analytics",
      role: "Data Scientist",
      status: "confirmed",
      slug: "james-miller",
    },
    {
      id: 6,
      avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=6",
      name: "Ana Rodriguez",
      email: "ana@futuretech.io",
      company: "FutureTech Labs",
      role: "UX Designer",
      status: "pending",
      slug: "",
    },
    {
      id: 7,
      avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=7",
      name: "David Kim",
      email: "dkim@nexusgroup.com",
      company: "Nexus Group",
      role: "Marketing Manager",
      status: "meeting planned",
      slug: "",
    },
    {
      id: 8,
      avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=8",
      name: "Lisa Thompson",
      email: "lisa.t@quantum.co",
      company: "Quantum Computing",
      role: "Research Director",
      status: "confirmed",
      slug: "",
    },
    {
      id: 9,
      avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=9",
      name: "Marcus Brown",
      email: "mbrown@aitech.com",
      company: "AI Technologies",
      role: "AI Engineer",
      status: "pending",
      slug: "",
    },
    {
      id: 10,
      avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=10",
      name: "Sophie Anderson",
      email: "sophie@webflow.net",
      company: "WebFlow Solutions",
      role: "Frontend Developer",
      status: "meeting planned",
      slug: "",
    },
  ];

  const tableHeaders = [
    { icon: PersonIcon, label: "Name" },
    { icon: MailIcon, label: "Email" },
    { icon: CompanyIcon, label: "Company" },
    { icon: StarIcon, label: "Role" },
    { icon: StarIcon, label: "Status" },
    { icon: null, label: "", width: "w-12" },
  ];

  const getStatusColor = (status) => {
    return status === "meeting planned" || status === "confirmed"
      ? "green"
      : "orange";
  };
</script>

<div class="flex flex-col min-h-[90vh] p-8 pt-0 w-full" style="">
  <div
    class="flex flex-col items-center justify-center bg-white rounded-xl p-8 pt-4 gap-4"
  >
    <!-- Header -->
    <div class="flex flex-row justify-between w-full">
      <span class="text-sm text-gray-500 flex flex-row items-center gap-2">
        <div class="p-1 bg-orange-300 rounded-sm">
          <CalendarIcon class="w-6 h-6 text-black" />
        </div>
        <p class="text-lg font-semibold text-black">Attendees of event</p>
      </span>
      <Button variant="outline" class="px-3 text-xs font-bold">
        <span class="text-lg">+</span> Add Attendee
      </Button>
    </div>

    <!-- Table -->
    <div
      class=" border border-2 border-slate-100 rounded-xl padding bg-white w-full"
    >
      <Table.Root>
        <Table.Header>
          <Table.Row class="text-sm">
            {#each tableHeaders as header}
              <Table.Head
                class="text-black border-r border-slate-100 {header.width ||
                  ''}"
              >
                {#if header.icon}
                  <div class="flex items-center gap-1">
                    <svelte:component
                      this={header.icon}
                      class="w-4 h-4 text-gray-500"
                    />
                    <span class="text-sm font-semibold">{header.label}</span>
                  </div>
                {/if}
              </Table.Head>
            {/each}
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {#each attendees as attendee}
            <Table.Row
              onclick={() => {
                if (attendee.slug != "") {
                  goto(`/private/events/developerweek2025/${attendee.slug}`);
                }
              }}
            >
              <Table.Cell class="font-medium border-r border-slate-100">
                <div class="flex items-center gap-2">
                  <img src={attendee.avatar} alt="user" class="w-8" />
                  {attendee.name}
                </div>
              </Table.Cell>
              <Table.Cell class="border-r border-slate-100"
                >{attendee.email}</Table.Cell
              >
              <Table.Cell class="border-r border-slate-100"
                >{attendee.company}</Table.Cell
              >
              <Table.Cell class="border-r border-slate-100"
                >{attendee.role}</Table.Cell
              >
              <Table.Cell class="border-r border-slate-100">
                <div class="flex items-center gap-2">
                  <div
                    class="w-2 h-2 rounded-full"
                    style="background-color: {getStatusColor(attendee.status)};"
                  />
                  <span class="flex items-center">{attendee.status}</span>
                </div>
              </Table.Cell>
              <Table.Cell>
                <div class="flex items-end justify-end">
                  <Button href="/edit" variant="ghost" size="icon" class="p-0">
                    <PencilIcon class="w-4 h-4 text-gray-500" />
                  </Button>
                  <Button href="/delete" variant="ghost" size="icon">
                    <TrashIcon class="w-4 h-4 text-gray-500" />
                  </Button>
                </div>
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </div>
  </div>
</div>
