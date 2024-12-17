/** @format */

import { writable } from "svelte/store";

export const ownCompany = writable({
  name: "",
  info: "",
});
