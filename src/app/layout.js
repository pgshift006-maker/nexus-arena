import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "Nexus Arena",
  description: "Plataforma de competições e gincanas para escolas e faculdades",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} h-full`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try {
              var t = localStorage.getItem('theme');
              if (t === 'dark') document.documentElement.classList.add('dark');
            } catch (e) {}`,
          }}
        />
      </head>
      <body className="min-h-full bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white antialiased">
        {children}
      </body>
    </html>
  );
}
