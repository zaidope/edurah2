import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'Edurah — Video-Based Learning & Educational Platform',
  description: 'Master computer science, software engineering, artificial intelligence, and mathematics with structured video lessons, interactive quizzes, and progress tracking.',
  openGraph: {
    title: 'Edurah — Video-Based Learning Platform',
    description: 'Master engineering, AI, and mathematics through structured video courses and practice.',
    siteName: 'Edurah',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <body className="bg-[#f6f2e9] text-[#171819] min-h-screen flex flex-col antialiased selection:bg-[#d8a471] selection:text-[#171819]">
        <AuthProvider>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
