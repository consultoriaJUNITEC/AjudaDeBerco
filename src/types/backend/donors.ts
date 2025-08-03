export interface Donor {
  id: string;
  name: string;
  normalized_name: string;
  created_at: Date;
}

export interface CreateDonorRequest {
  name: string;
}

export interface UpdateDonorRequest {
  name?: string;
}
