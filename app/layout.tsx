import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mashrabuç Çâfî Hizbut-Tarqiyyah 2026',
  description: 'Enregistrements audio du Mashrabuç Çâfî Hizbut-Tarqiyyah 2026',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" dir="ltr">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Inter:wght@300;400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
