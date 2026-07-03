import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account | GoodieBox Store",
  description: "Create your GoodieBox Store account and start shopping.",
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
