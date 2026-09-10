import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'TeamSync 📅 — University Team Availability Scheduling',
  description: 'Private team availability scheduling and real-time meeting slot finder for university teams.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-navy-200 selection:text-navy-900">
        {children}
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: {
              borderRadius: '12px',
              fontWeight: 500,
            },
          }}
        />
      </body>
    </html>
  );
}
