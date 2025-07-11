import type React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <div className="container mx-auto px-4 py-6"> {/* Adjusted py from py-8 to py-6 */}
      {children}
    </div>
  );
}
