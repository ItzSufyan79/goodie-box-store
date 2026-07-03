import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resend Verification Email | GoodieBox Store",
  description: "Resend your email verification link.",
};

export default function ResendVerificationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
