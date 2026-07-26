import { redirect } from "next/navigation";

export interface ProductsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category.toLowerCase() : "";

  if (category === "mens-eyeglasses") {
    redirect("/eyeglasses?gender=Men");
  } else if (category === "womens-eyeglasses") {
    redirect("/eyeglasses?gender=Women");
  } else if (category === "kids-eyeglasses") {
    redirect("/eyeglasses?gender=Kids");
  } else if (category === "mens-sunglasses") {
    redirect("/sunglasses?gender=Men");
  } else if (category === "womens-sunglasses") {
    redirect("/sunglasses?gender=Women");
  } else if (category === "kids-sunglasses") {
    redirect("/sunglasses?gender=Kids");
  } else if (category === "eyeglasses") {
    redirect("/eyeglasses");
  } else if (category === "sunglasses") {
    redirect("/sunglasses");
  }

  redirect("/");
}
