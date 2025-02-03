'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Role } from '@prisma/client';

type UserType = {
  role: Role;
  email: string;
  password: string;
  name: string;
  businessName?: string;
  phone?: string;
  address?: string;
  licenses?: string[];
  specialties?: string[];
  products?: string[];
};

export default function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState<UserType>({
    role: Role.user,
    email: '',
    password: '',
    name: '',
  });

  const handleUserTypeSelect = (role: Role) => {
    setUserData(prev => ({ ...prev, role }));
    setStep(2);
  };

  const handleBasicInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(3);
  };

  const handleBusinessInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement user registration API call
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-grey-lighter/10 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-grey-darker">
          Create your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Step 1: User Type Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-grey-darker">Select your role</h3>
              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => handleUserTypeSelect(Role.GENERAL_CONTRACTOR)}
                  className="p-4 border rounded-lg hover:bg-grey-lighter/10"
                >
                  <h4 className="font-semibold">General Contractor</h4>
                  <p className="text-sm text-grey-lighter">Manage construction projects and teams</p>
                </button>
                <button
                  onClick={() => handleUserTypeSelect(Role.SUBCONTRACTOR)}
                  className="p-4 border rounded-lg hover:bg-grey-lighter/10"
                >
                  <h4 className="font-semibold">Subcontractor</h4>
                  <p className="text-sm text-grey-lighter">Find work and manage your services</p>
                </button>
                <button
                  onClick={() => handleUserTypeSelect(Role.SUPPLIER)}
                  className="p-4 border rounded-lg hover:bg-grey-lighter/10"
                >
                  <h4 className="font-semibold">Supplier</h4>
                  <p className="text-sm text-grey-lighter">Sell materials and manage inventory</p>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Basic Information */}
          {step === 2 && (
            <form onSubmit={handleBasicInfoSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-grey-darker">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={userData.email}
                  onChange={(e) => setUserData(prev => ({ ...prev, email: e.target.value }))}
                  className="mt-1 block w-full border border-grey-lighter rounded-md shadow-sm py-2 px-3 text-grey-darker placeholder-grey-lighter focus:ring-blue-darker focus:border-blue-darker"
                />
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-grey-darker">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={userData.name}
                  onChange={(e) => setUserData(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full border border-grey-lighter rounded-md shadow-sm py-2 px-3 text-grey-darker placeholder-grey-lighter focus:ring-blue-darker focus:border-blue-darker"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-grey-darker">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={userData.password}
                  onChange={(e) => setUserData(prev => ({ ...prev, password: e.target.value }))}
                  className="mt-1 block w-full border border-grey-lighter rounded-md shadow-sm py-2 px-3 text-grey-darker placeholder-grey-lighter focus:ring-blue-darker focus:border-blue-darker"
                />
              </div>

              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-darker hover:bg-blue-lighter"
              >
                Continue
              </button>
            </form>
          )}

          {/* Step 3: Business Information */}
          {step === 3 && (
            <form onSubmit={handleBusinessInfoSubmit} className="space-y-6">
              <div>
                <label htmlFor="businessName" className="block text-sm font-medium text-grey-darker">
                  Business Name
                </label>
                <input
                  id="businessName"
                  type="text"
                  required
                  value={userData.businessName || ''}
                  onChange={(e) => setUserData(prev => ({ ...prev, businessName: e.target.value }))}
                  className="mt-1 block w-full border border-grey-lighter rounded-md shadow-sm py-2 px-3 text-grey-darker placeholder-grey-lighter focus:ring-blue-darker focus:border-blue-darker"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-grey-darker">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  value={userData.phone || ''}
                  onChange={(e) => setUserData(prev => ({ ...prev, phone: e.target.value }))}
                  className="mt-1 block w-full border border-grey-lighter rounded-md shadow-sm py-2 px-3 text-grey-darker placeholder-grey-lighter focus:ring-blue-darker focus:border-blue-darker"
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-grey-darker">
                  Business Address
                </label>
                <input
                  id="address"
                  type="text"
                  required
                  value={userData.address || ''}
                  onChange={(e) => setUserData(prev => ({ ...prev, address: e.target.value }))}
                  className="mt-1 block w-full border border-grey-lighter rounded-md shadow-sm py-2 px-3 text-grey-darker placeholder-grey-lighter focus:ring-blue-darker focus:border-blue-darker"
                />
              </div>

              {/* Role-specific fields */}
              {userData.role === Role.GENERAL_CONTRACTOR && (
                <div>
                  <label htmlFor="licenses" className="block text-sm font-medium text-grey-darker">
                    Licenses (comma-separated)
                  </label>
                  <input
                    id="licenses"
                    type="text"
                    placeholder="e.g., General Contractor License, Business License"
                    value={userData.licenses?.join(', ') || ''}
                    onChange={(e) => setUserData(prev => ({ ...prev, licenses: e.target.value.split(',').map(s => s.trim()) }))}
                    className="mt-1 block w-full border border-grey-lighter rounded-md shadow-sm py-2 px-3 text-grey-darker placeholder-grey-lighter focus:ring-blue-darker focus:border-blue-darker"
                  />
                </div>
              )}

              {userData.role === Role.SUBCONTRACTOR && (
                <div>
                  <label htmlFor="specialties" className="block text-sm font-medium text-grey-darker">
                    Specialties (comma-separated)
                  </label>
                  <input
                    id="specialties"
                    type="text"
                    placeholder="e.g., Plumbing, Electrical, HVAC"
                    value={userData.specialties?.join(', ') || ''}
                    onChange={(e) => setUserData(prev => ({ ...prev, specialties: e.target.value.split(',').map(s => s.trim()) }))}
                    className="mt-1 block w-full border border-grey-lighter rounded-md shadow-sm py-2 px-3 text-grey-darker placeholder-grey-lighter focus:ring-blue-darker focus:border-blue-darker"
                  />
                </div>
              )}

              {userData.role === Role.SUPPLIER && (
                <div>
                  <label htmlFor="products" className="block text-sm font-medium text-grey-darker">
                    Product Categories (comma-separated)
                  </label>
                  <input
                    id="products"
                    type="text"
                    placeholder="e.g., Lumber, Concrete, Steel"
                    value={userData.products?.join(', ') || ''}
                    onChange={(e) => setUserData(prev => ({ ...prev, products: e.target.value.split(',').map(s => s.trim()) }))}
                    className="mt-1 block w-full border border-grey-lighter rounded-md shadow-sm py-2 px-3 text-grey-darker placeholder-grey-lighter focus:ring-blue-darker focus:border-blue-darker"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-darker hover:bg-blue-lighter"
              >
                Create Account
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
} 