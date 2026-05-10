import './globals.css';

export const metadata = {
  title: 'CA Operations Platform',
  description: 'Compliance operations dashboard for CA office workflows',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
