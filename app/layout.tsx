import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TransitOps — Smart Transport Operations Platform',
  description: 'Fleet, driver, and dispatch operations management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}
