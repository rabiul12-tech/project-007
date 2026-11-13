import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MEDORA Health — Better Care. Better Operations.',
  description:
    'Premium Clinic & Healthcare Operations Management SaaS Demonstration — Patient 360° Workspace, Doctor Scheduling Calendar, Reception Queue, Clinical Documentation Demo, and Billing Engine.',
  openGraph: {
    title: 'MEDORA Health — Better Care. Better Operations.',
    description:
      'Premium Clinic & Healthcare Operations Management SaaS Demonstration — Patient 360° Workspace, Doctor Scheduling Calendar, Reception Queue, Clinical Documentation Demo, and Billing Engine.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MEDORA Health — Better Care. Better Operations.',
    description:
      'Premium Clinic & Healthcare Operations Management SaaS Demonstration.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased" suppressHydrationWarning>
        {children}
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
