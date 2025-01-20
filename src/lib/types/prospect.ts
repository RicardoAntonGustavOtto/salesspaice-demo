export interface ProspectProps {
  id: string;
  name: string;
  title: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface NewProspectProps {
  name: string;
  title: string;
  email?: string;
  phone?: string;
  notes?: string;
}