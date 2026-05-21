import React, { createContext, useContext, useState } from 'react';

const ScanContext = createContext();

export const ScanProvider = ({ children }) => {
  const [currentScan, setCurrentScan] = useState(null);

  return (
    <ScanContext.Provider value={{ currentScan, setCurrentScan }}>
      {children}
    </ScanContext.Provider>
  );
};

export const useScan = () => {
  const context = useContext(ScanContext);

  if (!context) {
    return {
      currentScan: null,
      setCurrentScan: () => {}
    };
  }

  return context;
};