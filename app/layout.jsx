import './globals.css';

export const metadata = {
  title: 'Advocate Operations Platform',
  description: 'Compliance operations dashboard for Advocate office workflows',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
