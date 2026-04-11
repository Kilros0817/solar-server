// Environment Variables Type
export interface ProcessEnv {
  USER_NAME: string;
  PASSWORD: string;
  PINATA_API_KEY: string;
  PINATA_SECRETE_API_KEY: string;
  RPC: string;
  key: string;
  iv: string;
  AdminWallet: string;
  FaucetWallet: string;
  PINATA_GATE_WAY: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  SECRET: string;
} 

// Contact Form Types
export interface ContactRequest {
  email: string;
  subject: string;
  message: string;
}

// Consultation Form Types
export interface ConsultationRequest {
  // Contact Information
  fullName: string;
  companyName: string;
  workEmail: string;
  phoneNumber?: string;
  roleTitle: string;
  
  // Organization Overview
  industry?: string;
  companySize?: string;
  departments?: string[];
  otherDepartment?: string;
  
  // Current Workflow Context
  challenges?: string;
  usingTools?: boolean;
  whichTools?: string;
  improvements?: string[];
  
  // Engagement Details
  preferredContactMethod?: string;
  timeWindow?: string;
  timezone?: string;
  additionalNotes?: string;
}