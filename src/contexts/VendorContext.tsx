
import React, { createContext, useContext, useState, ReactNode } from 'react';

export type VendorStatus = 'pending' | 'approved' | 'rejected' | null;

interface VendorContextType {
  isVendor: boolean;
  vendorStatus: VendorStatus;
  setVendorStatus: (status: VendorStatus) => void;
  setIsVendor: (isVendor: boolean) => void;
}

const VendorContext = createContext<VendorContextType | undefined>(undefined);

export const VendorProvider = ({ children }: { children: ReactNode }) => {
  const [isVendor, setIsVendor] = useState(false);
  const [vendorStatus, setVendorStatus] = useState<VendorStatus>(null);

  return (
    <VendorContext.Provider value={{
      isVendor,
      vendorStatus,
      setVendorStatus,
      setIsVendor
    }}>
      {children}
    </VendorContext.Provider>
  );
};

export const useVendor = () => {
  const context = useContext(VendorContext);
  if (context === undefined) {
    throw new Error('useVendor must be used within a VendorProvider');
  }
  return context;
};
