/** @format */

// src/stores/breadcrumbs.js
import { writable } from "svelte/store";

export const breadcrumbs = writable([
  { path: "/", name: "Home" },
  { path: "/dashboard", name: "Dashboard" },
  { path: "/events", name: "Events" },
  { path: "/prospects", name: "Prospects" },
  { path: "/messages", name: "Messages" },
  { path: "/settings", name: "Settings" },
]);

export function updateBreadcrumbs(eventId, attendeeSlug) {
  breadcrumbs.update(() => {
    // Start with a fresh array of breadcrumbs
    const newBreadcrumbs = [
      { path: "/", name: "Home" },
      { path: "/dashboard", name: "Dashboard" },
      { path: "/events", name: "Events" },
    ];

    // Add the specific event if available
    if (eventId) {
      newBreadcrumbs.push({ path: `/events/${eventId}`, name: eventId });
    }

    // Add the attendees overview
    newBreadcrumbs.push({
      path: `/events/${eventId}/attendees`,
      name: "Attendees",
    });

    // Add the specific attendee if available
    if (attendeeSlug) {
      newBreadcrumbs.push({
        path: `/events/${eventId}/attendees/${attendeeSlug}`,
        name: attendeeSlug,
      });
    }

    return newBreadcrumbs; // Return the new breadcrumbs array
  });
}
