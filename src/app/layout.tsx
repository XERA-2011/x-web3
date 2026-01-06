import type { Metadata } from 'next';
import { Inter, Lato, Oswald } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

// UberViz Fonts
const lato = Lato({
  weight: ['300', '400', '700'],
  subsets: ['latin'],
  variable: '--font-lato',
  display: 'swap',
});

const oswald = Oswald({
  subsets: ['latin'],
  variable: '--font-oswald',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'x2011 | UberViz Port',
  description: 'Port of UberViz realtime visualizations to Next.js',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${lato.variable} ${oswald.variable}`}>{children}</body>
    </html>
  );
}
