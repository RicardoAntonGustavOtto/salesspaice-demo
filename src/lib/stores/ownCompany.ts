import { writable } from 'svelte/store';
import { browser } from '$app/environment';

interface OwnCompany {
  name: string;
  info: string;
}

// Get initial data from localStorage if available
const storedData = browser ? localStorage.getItem('ownCompany') : null;
const initialData: OwnCompany = storedData 
  ? JSON.parse(storedData)
  : {
      name: '',
      info: ''
    };

function createOwnCompanyStore() {
  const { subscribe, set, update } = writable<OwnCompany>(initialData);

  return {
    subscribe,
    set: (value: OwnCompany) => {
      if (browser) {
        localStorage.setItem('ownCompany', JSON.stringify(value));
      }
      set(value);
    },
    update
  };
}

export const ownCompany = createOwnCompanyStore();