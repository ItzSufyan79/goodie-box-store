import { getCategoriesAction } from "@/actions/products";
import { Navbar } from "./navbar";

export async function NavbarWrapper() {
  const categories = await getCategoriesAction();

  return <Navbar categories={categories} />;
}
