import "./globals.css";

export const metadata = {
  title: "Clonador de voz",
  description: "Generá audio con una voz de referencia",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
