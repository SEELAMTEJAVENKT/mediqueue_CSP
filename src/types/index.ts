export type UserRole = 'patient' | 'doctor' | 'admin' | 'hospital_admin';

export type Language = 'en' | 'hi' | 'te';

export interface HospitalUserContext {
  hospitalId: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  language: Language;
  avatar?: string;
  createdAt: string;
  hospitalId?: string;       // RBAC: the hospital this user belongs to
  doctorId?: string;         // For doctor role: the doctors row uuid
}

export interface Patient extends User {
  role: 'patient';
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  bloodGroup?: string;
  address?: string;
  emergencyContact?: string;
  medicalHistory?: MedicalRecord[];
  allergies?: string[];
}

export interface Doctor extends User {
  role: 'doctor';
  specialization: string;
  qualification: string;
  experience: number;
  hospitalId: string;
  languages: string[];
  consultationFee: number;
  rating: number;
  reviewCount: number;
  about: string;
  availableSlots: TimeSlot[];
  isVerified: boolean;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  latitude: number;
  longitude: number;
  rating: number;
  reviewCount: number;
  specialties: string[];
  departments: Department[];
  images: string[];
  isOpen: boolean;
  openHours: string;
  emergencyAvailable: boolean;
  about: string;
  facilities: string[];
}

export interface Department {
  id: string;
  hospitalId: string;
  name: string;
  description: string;
  doctors: string[];
}

export interface TimeSlot {
  id: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  isLocked: boolean;
}

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'available'
  | 'booked'
  | 'arrived'
  | 'in_queue'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'rescheduled';

export type SlotStatus =
  | 'AVAILABLE'
  | 'BOOKED'
  | 'ARRIVED'
  | 'IN_QUEUE'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'RESCHEDULED'

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  hospitalId: string;
  departmentId: string;
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  symptoms?: string;
  notes?: string;
  prescriptionId?: string;
  reportIds?: string[];
  createdAt: string;
  updatedAt: string;

  // Lifecycle tracking fields
  arrival_time?: string | null;
  consultation_start?: string | null;
  consultation_end?: string | null;
  waiting_time_minutes?: number | null;
  consultation_duration_minutes?: number | null;
  queue_position?: number | null;
  patient_name?: string | null;
  patient_phone?: string | null;
}

export interface MedicalReport {
  id: string;
  patientId: string;
  fileName: string;
  fileUrl: string;
  fileType: 'pdf' | 'jpg' | 'jpeg' | 'png';
  uploadedAt: string;
  aiAnalysis?: AIAnalysis;
  extractedData?: ExtractedHealthData;
}

export interface ExtractedHealthData {
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  bloodSugar?: {
    fasting: number;
    random: number;
    hba1c: number;
  };
  bloodTest?: {
    hemoglobin: number;
    rbc: number;
    wbc: number;
    platelets: number;
    cholesterol: number;
    triglycerides: number;
    tsh: number;
    creatinine: number;
    bilirubin: number;
  };
}

export type HealthStatus = 'normal' | 'warning' | 'critical';

export interface AIAnalysis {
  id: string;
  reportId: string;
  summary: string;
  healthStatus: HealthStatus;
  recommendations: string[];
  recommendedSpecialists: string[];
  riskFactors: string[];
  createdAt: string;
}

export interface Prescription {
  id: string;
  appointmentId: string;
  doctorId: string;
  patientId: string;
  diagnosis: string;
  medicines: Medicine[];
  followUpDate?: string;
  instructions: string;
  createdAt: string;
}

export interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'appointment' | 'report' | 'system' | 'emergency';
  isRead: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  doctorId: string;
  patientId: string;
  patientName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  language: Language;
}

export interface SymptomCheckResult {
  urgency: 'low' | 'medium' | 'high';
  possibleConditions: string[];
  recommendedSpecialist: string;
  advice: string;
  shouldSeeDoctor: boolean;
}

export interface HealthMetric {
  date: string;
  value: number;
  label: string;
}

export interface MedicalRecord {
  id: string;
  date: string;
  condition: string;
  treatment: string;
  doctorName: string;
  hospitalName: string;
}
