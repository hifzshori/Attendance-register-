import { SchoolClass } from '../types';

export const shareClass = async (classData: SchoolClass): Promise<{ code: string; expiresAt: string }> => {
  const response = await fetch('/.netlify/functions/share', {
    method: 'POST',
    body: JSON.stringify(classData),
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
     const text = await response.text();
     throw new Error(text || 'Failed to share class. Ensure Netlify Functions are running.');
  }

  return response.json();
};

export const getClass = async (code: string): Promise<SchoolClass> => {
  const response = await fetch(`/.netlify/functions/view?code=${encodeURIComponent(code)}`);
  
  if (!response.ok) {
     if (response.status === 404) throw new Error('Code not found or expired.');
     throw new Error('Failed to retrieve class data.');
  }

  return response.json();
};