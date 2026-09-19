import { prisma } from "@/lib/prisma";
import { safeProductList } from "@/lib/data-guards";
import QuizClient from "@/components/quiz/QuizClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function QuizPage() {
  const rawProducts = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      material: true,
      frameShape: true,
      gender: true,
      category: true,
      images: true,
      description: true,
      stock: true,
      featured: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const products = safeProductList(rawProducts);

  return <QuizClient initialProducts={products} />;
}
