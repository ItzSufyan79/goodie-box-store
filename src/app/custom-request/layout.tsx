import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Custom Gift Request | GoodieBox Store",
  description: "Request a custom-made gift box tailored to your needs.",
};

export default function CustomRequestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
