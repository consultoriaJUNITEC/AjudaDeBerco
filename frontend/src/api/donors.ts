import type { Donor } from '../types/donor';
import { DONORS_ENDPOINTS } from '../constants';

// Function to get all donors
export const getAllDonors = async (): Promise<Donor[]> => {
   try {
      const response = await fetch(DONORS_ENDPOINTS.GET_ALL, {
         method: 'GET',
         headers: {
            'Content-Type': 'application/json',
         },
      });
      if (!response.ok) {
         throw new Error('Network response was not ok');
      }
      const donors = await response.json();
      return donors.map((donor: any) => ({
         id: donor.id,
         name: donor.name,
      }));
   }
   catch (error) {
      console.error('Error fetching donors:', error);
      throw error;
   }
}

// Function to get a specific donor by ID
export const getDonorById = async (id: string): Promise<Donor> => {
   try {
      const response = await fetch(DONORS_ENDPOINTS.GET_BY_ID(id), {
         method: 'GET',
         headers: {
            'Content-Type': 'application/json',
         },
      });
      if (!response.ok) {
         throw new Error('Network response was not ok');
      }
      const donor = await response.json();
      return {
         id: donor.id,
         name: donor.name,
      };
   }
   catch (error) {
      console.error(`Error fetching donor with id ${id}:`, error);
      throw error;
   }
}

// Function to create a new donor
export const createDonor = async (donor: Donor, token: string): Promise<Donor> => {
   try {
      const response = await fetch(DONORS_ENDPOINTS.CREATE, {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
         },
         body: JSON.stringify({
            id: donor.id,
            name: donor.name,
         }),
      });
      if (!response.ok) {
         throw new Error('Network response was not ok');
      }
      const createdDonor = await response.json();
      return {
         id: createdDonor.id,
         name: createdDonor.name,
      };
   }
   catch (error) {
      console.error('Error creating donor:', error);
      throw error;
   }
}

// Function to update an existing donor
export const updateDonor = async (donor: Donor, token: string): Promise<Donor> => {
   try {
      const response = await fetch(DONORS_ENDPOINTS.UPDATE(donor.id), {
         method: 'PUT',
         headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
         },
         body: JSON.stringify({
            name: donor.name,
         }),
      });
      if (!response.ok) {
         throw new Error('Network response was not ok');
      }
      const updatedDonor = await response.json();
      return {
         id: updatedDonor.id,
         name: updatedDonor.name,
      };
   }
   catch (error) {
      console.error(`Error updating donor with id ${donor.id}:`, error);
      throw error;
   }
}

// Function to delete a donor
export const deleteDonor = async (id: string, token: string): Promise<void> => {
   try {
      const response = await fetch(DONORS_ENDPOINTS.DELETE(id), {
         method: 'DELETE',
         headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
         },
      });
      if (!response.ok) {
         throw new Error('Network response was not ok');
      }
   }
   catch (error) {
      console.error(`Error deleting donor with id ${id}:`, error);
      throw error;
   }
}

// Function to search for donors by name or id
export const searchDonors = async (query: string): Promise<Donor[]> => {
   try {
      const byIdResponse = await fetch(DONORS_ENDPOINTS.SEARCH_BY_ID(query), {
         method: 'GET',
         headers: {
            'Content-Type': 'application/json',
         },
      });
      if (!byIdResponse.ok) {
         throw new Error('Network response was not ok');
      }
      const byIdData = await byIdResponse.json();
      const byIdDonors = byIdData.results.map((donor: any) => ({
         id: donor.id,
         name: donor.name,
      }));

      const byNameResponse = await fetch(DONORS_ENDPOINTS.SEARCH_BY_NAME(query), {
         method: 'GET',
         headers: {
            'Content-Type': 'application/json',
         },
      });
      if (!byNameResponse.ok) {
         throw new Error('Network response was not ok');
      }
      const byNameData = await byNameResponse.json();
      const byNameDonors = byNameData.results.map((donor: any) => ({
         id: donor.id,
         name: donor.name,
      }));

      // Combine the results from both searches and remove duplicates
      const donorsMap = new Map<string, Donor>();
      [...byIdDonors, ...byNameDonors].forEach(donor => {
         donorsMap.set(donor.id, donor);
      });
      
      // Convert back to array
      return Array.from(donorsMap.values());
   }
   catch (error) {
      console.error('Error searching for donors:', error);
      throw error;
   }
}