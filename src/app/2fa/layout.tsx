import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Two-Factor Authentication | GoodieBox Store",
  description: "Verify your identity with two-factor authentication.",
};

export default function TwoFactorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
