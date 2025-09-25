import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from '@/components/theme-provider';
import Script from 'next/script';
import { AuthProvider } from '@/contexts/auth-context';

export const metadata: Metadata = {
  title: 'UranusX',
  description: 'Your personalized streaming dashboard.',
  manifest: '/manifest.json',
  applicationName: 'UranusX',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#9F54FF" />
        <link rel="icon" href="https://lh3.googleusercontent.com/pw/AP1GczNoCQo-qU0lfWyTQT1EqIhZofXYFZo1x-kSKbfhgqEXJu45jEtH3p2J3Nb3DrgRVrwXTGn3dRbhpLASHYYlfwMkV3OpuCwabpGuvpwvFkBCyvtAVBir0CV8VroEGIJNHwWK7agWTVMhvBmg3TIr4iM=w32-h32-s-no-gm?authuser=0" sizes="32x32" />
        <link rel="apple-touch-icon" href="https://lh3.googleusercontent.com/pw/AP1GczNoCQo-qU0lfWyTQT1EqIhZofXYFZo1x-kSKbfhgqEXJu45jEtH3p2J3Nb3DrgRVrwXTGn3dRbhpLASHYYlfwMkV3OpuCwabpGuvpwvFkBCyvtAVBir0CV8VroEGIJNHwWK7agWTVMhvBmg3TIr4iM=w180-h180-s-no-gm?authuser=0"></link>
        <Script src="https://cdn.lordicon.com/lordicon.js" strategy="afterInteractive" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <div className="animated-gradient">
              {children}
              <Toaster />
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
