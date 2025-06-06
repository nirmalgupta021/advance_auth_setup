import type { Metadata } from "next";
import {Roboto} from "next/font/google"
import "./globals.css";

const font = Roboto({
  weight: ["100", "300", "400", "500", "700", "900"],
  subsets:["latin"]
})

export const metadata: Metadata = {
  title: "Auth Setup",
  description: "MERN Project",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${font.className} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
