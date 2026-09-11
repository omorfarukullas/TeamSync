import type { Metadata } from 'next';
import { Playfair_Display, Source_Serif_4, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TeamSync — University Team Availability Scheduling',
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
    <html lang="en" className={`${playfair.variable} ${sourceSerif.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-white text-black font-body antialiased selection:bg-black selection:text-white">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: '0px',
              border: '1px solid #000000',
              background: '#000000',
              color: '#FFFFFF',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              fontWeight: 500,
            },
          }}
        />
      </body>
    </html>
  );
}

