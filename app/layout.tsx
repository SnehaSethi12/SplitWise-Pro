import "./globals.css";
export const metadata = {
  title: "SplitWise Pro",
  description: "Shared expenses with auditable imports",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
