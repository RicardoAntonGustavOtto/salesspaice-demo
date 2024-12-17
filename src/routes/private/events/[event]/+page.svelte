<!-- @format -->
<script>
  import AttendeeTable from "$lib/components/blocks/AttendeeTable.svelte";
  import { fade, slide } from "svelte/transition";
  import EyeIcon from "lucide-svelte/icons/eye";
  import EyeOffIcon from "lucide-svelte/icons/eye-off";

  let showBentoCards = true;
</script>

<div class="relative">
  <div class="flex items-center justify-between px-8 pt-4">
    <div class="relative flex flex-col">
      <p class="text-lg font-semibold text-black">Devii.io attendees</p>
      <div class="flex flex-row -space-x-4">
        <div class="relative group">
          <img
            src="https://api.dicebear.com/7.x/lorelei/svg?seed=1"
            alt="John Smith"
            class="w-12 h-12 rounded-full border-2 border-white hover:z-90 transition-all cursor-pointer z-0"
          />
          <div
            class="absolute invisible group-hover:visible bg-black text-white text-sm rounded p-2 -mt-2 transform -translate-y-full w-28 z-90"
          >
            Andrew
          </div>
        </div>

        <div class="relative group">
          <img
            src="https://api.dicebear.com/7.x/lorelei/svg?seed=2"
            alt="Sarah Johnson"
            class="w-12 h-12 rounded-full border-2 border-white hover:z-10 transition-all cursor-pointer z-0"
          />
          <div
            class="absolute invisible group-hover:visible bg-black text-white text-sm rounded p-2 -mt-2 transform -translate-y-full w-28 z-80"
          >
            Ryan
          </div>
        </div>

        <div class="relative group">
          <img
            src="https://api.dicebear.com/7.x/lorelei/svg?seed=3"
            alt="Michael Chen"
            class="w-12 h-12 rounded-full border-2 border-white hover:z-10 transition-all cursor-pointer z-0"
          />
          <div
            class="absolute invisible group-hover:visible bg-black text-white text-sm rounded p-2 -mt-2 transform -translate-y-full w-28 z-80"
          >
            Anthony
          </div>
        </div>
      </div>
    </div>

    <button
      class="text-gray-600 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-100"
      on:click={() => (showBentoCards = !showBentoCards)}
    >
      {#if showBentoCards}
        <EyeIcon size={24} />
      {:else}
        <EyeOffIcon size={24} />
      {/if}
    </button>
  </div>

  {#if showBentoCards}
    <div
      class="grid grid-cols-3 gap-4 px-8 pt-2 pb-8"
      transition:fade={{ duration: 400 }}
    >
      <div class="col-span-2 bg-white rounded-xl overflow-hidden">
        <div class="h-48 w-full">
          <img
            src="https://picsum.photos/200"
            alt="DeveloperWeek 2024"
            class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div class="p-6">
          <h1
            class="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-8 w-8"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
              />
            </svg>
            DeveloperWeek 2025
          </h1>

          <div class="grid grid-cols-2 gap-6">
            <div
              class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
            >
              <h3
                class="text-gray-900 font-semibold flex items-center gap-2 mb-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Date
              </h3>
              <p class="text-gray-700 font-medium">
                Feb 11, 2025 - Feb 13, 2025
              </p>
            </div>

            <div
              class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
            >
              <h3
                class="text-gray-900 font-semibold flex items-center gap-2 mb-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Location
              </h3>
              <p class="text-gray-700 font-medium">
                Oakland Convention Center, CA
              </p>
            </div>

            <div
              class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
            >
              <h3
                class="text-gray-900 font-semibold flex items-center gap-2 mb-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path
                    d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
                  />
                </svg>
                Website
              </h3>
              <a
                href="https://www.developerweek.com"
                class="text-blue-600 hover:text-blue-800 font-medium transition-colors flex items-center gap-1"
              >
                www.developerweek.com
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
                  />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>

            <div
              class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
            >
              <h3
                class="text-gray-900 font-semibold flex items-center gap-2 mb-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                  />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                Description
              </h3>
              <p class="text-gray-700 font-medium">
                DeveloperWeek 2024 is the largest developer conference & event
                series including the DeveloperWeek 2024 Conference & Expo,
                1,000+ attendee hackathon, and more.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl p-6">
        <div class="flex flex-col gap-4 mb-6">
          <h2
            class="text-xl font-semibold text-gray-900 flex items-center gap-2"
          >
            <span>🎯</span>
            <span>Company Goals</span>
          </h2>
          <ul class="flex flex-col gap-3">
            <li class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div class="flex-1">
                <p class="font-medium text-gray-900">
                  Build Strategic Partnerships
                </p>
                <p class="text-sm text-gray-600">
                  Connect with 1 potential partner to expand our market reach
                </p>
              </div>
            </li>
            <li class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div class="flex-1">
                <p class="font-medium text-gray-900">Lead Generation</p>
                <p class="text-sm text-gray-600">
                  Collect 3 qualified leads from conference attendees
                </p>
              </div>
            </li>
            <li class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div class="flex-1">
                <p class="font-medium text-gray-900">Brand Awareness</p>
                <p class="text-sm text-gray-600">
                  Increase visibility among developer community
                </p>
              </div>
            </li>
          </ul>
        </div>
        <div class="flex flex-col gap-4">
          <h2 class="text-xl font-semibold text-gray-900">Quick Stats</h2>
          <div class="flex flex-col gap-3">
            <div
              class="flex justify-between items-center p-2 bg-gray-50 rounded-lg"
            >
              <div class="flex items-center gap-2">
                <svg
                  class="h-5 w-5 text-gray-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span class="text-gray-600 font-medium">Total Attendees</span>
              </div>
              <span class="text-lg font-bold text-gray-900">10</span>
            </div>

            <div
              class="flex justify-between items-center p-2 bg-gray-50 rounded-lg"
            >
              <div class="flex items-center gap-2">
                <svg
                  class="h-5 w-5 text-gray-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span class="text-gray-600 font-medium">Confirmed</span>
              </div>
              <span class="text-lg font-bold text-green-600">4</span>
            </div>

            <div
              class="flex justify-between items-center p-2 bg-gray-50 rounded-lg"
            >
              <div class="flex items-center gap-2">
                <svg
                  class="h-5 w-5 text-gray-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span class="text-gray-600 font-medium">Pending</span>
              </div>
              <span class="text-lg font-bold text-orange-500">3</span>
            </div>

            <div
              class="flex justify-between items-center p-2 bg-gray-50 rounded-lg"
            >
              <div class="flex items-center gap-2">
                <svg
                  class="h-5 w-5 text-gray-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span class="text-gray-600 font-medium">Meetings Planned</span>
              </div>
              <span class="text-lg font-bold text-blue-600">3</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
  <div transition:fade={{ duration: 400 }}>
    <AttendeeTable />
  </div>
</div>
