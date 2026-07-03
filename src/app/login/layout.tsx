import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | GoodieBox Store",
  description: "Sign in to your GoodieBox Store account.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
