import React from 'react';
import {
  Calendar,
  CreditCard,
  Fingerprint,
  Home,
  IndianRupee,
  Mail,
  MapPin,
  Phone,
  User,
  UserCircle,
  Users2,
} from 'lucide-react';

export interface FormField {
  id: string;
  label: string;
  icon: React.ElementType; // Lucide icon component
}

export interface FormSchema {
  title: string;
  description: string;
  fields: FormField[];
}

export const FORM_SCHEMAS: Record<string, FormSchema> = {
  aadhaar: {
    title: 'Aadhaar Card Update',
    description: 'Update your official Aadhaar identity details.',
    fields: [
      { id: 'full_name', label: 'Full Name', icon: User },
      { id: 'gender', label: 'Gender', icon: Fingerprint },
      { id: 'father_name', label: "Father's Name", icon: UserCircle },
      { id: 'age', label: 'Age / DOB', icon: Calendar },
      { id: 'address', label: 'Current Address', icon: MapPin },
      { id: 'mobile', label: 'Mobile Number', icon: Phone },
      { id: 'email', label: 'Email Address', icon: Mail },
    ],
  },
  pan: {
    title: 'PAN Card Application',
    description: 'Apply for your permanent account number for tax identity.',
    fields: [
      { id: 'full_name', label: 'Full Name', icon: User },
      { id: 'father_name', label: "Father's Name", icon: UserCircle },
      { id: 'dob', label: 'Date of Birth', icon: Calendar },
      { id: 'gender', label: 'Gender', icon: Fingerprint },
      { id: 'aadhaar_number', label: 'Aadhaar Number', icon: CreditCard },
      { id: 'mobile', label: 'Mobile Number', icon: Phone },
      { id: 'address', label: 'Comm. Address', icon: MapPin },
    ],
  },
  ration: {
    title: 'Ration Card Application',
    description: 'Apply for food security and subsidised supplies.',
    fields: [
      { id: 'hof_name', label: 'Head of Family', icon: User },
      { id: 'hof_gender', label: 'HoF Gender', icon: Fingerprint },
      { id: 'hof_aadhaar', label: 'HoF Aadhaar', icon: CreditCard },
      { id: 'household_income', label: 'Monthly Income', icon: IndianRupee },
      { id: 'member_count', label: 'Total Members', icon: Users2 },
      { id: 'category', label: 'Category (BPL/APL)', icon: CreditCard },
      { id: 'district', label: 'District / Region', icon: Home },
    ],
  },
};

export const DEFAULT_SERVICE = 'aadhaar';
