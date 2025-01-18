'use client';

import React from 'react';

interface ClientLayoutProps {
  children: React.ReactNode;
}

const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
};

export default ClientLayout; 