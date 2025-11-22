import type { Metadata } from "next";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "ADHD Assessment Platform | Comprehensive ADHD Testing Tools",
  description: "Comprehensive ADHD assessment tools including questionnaire, CPT-3, and TOVA tests. Learn about ADHD symptoms, diagnosis, treatment options, and medications.",
  keywords: ["ADHD", "ADHD assessment", "ADHD test", "attention deficit", "CPT-3", "TOVA", "ADHD diagnosis"],
  authors: [{ name: "ADHD Assessment Platform" }],
  openGraph: {
    title: "ADHD Assessment Platform",
    description: "Comprehensive ADHD assessment tools and educational resources",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}

