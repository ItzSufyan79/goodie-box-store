import { algoliasearch } from "algoliasearch";

const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
const searchKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY;
const adminKey = process.env.ALGOLIA_ADMIN_KEY;
export const ALGOLIA_INDEX =
  process.env.NEXT_PUBLIC_ALGOLIA_INDEX ?? "products";

export const searchClient =
  appId && searchKey ? algoliasearch(appId, searchKey) : null;

export const adminClient =
  appId && adminKey ? algoliasearch(appId, adminKey) : null;

export interface AlgoliaProduct {
  objectID: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  brand?: string;
  category: string;
  categorySlug: string;
  tags: string[];
  image: string;
  inventory: number;
  averageRating: number;
  reviewCount: number;
  isFeatured: boolean;
  isCustomizable: boolean;
}

export async function searchProducts(
  query: string,
  options: {
    page?: number;
    hitsPerPage?: number;
    filters?: string;
    facetFilters?: string[][];
  } = {}
) {
  if (!searchClient) {
    return { hits: [] as AlgoliaProduct[], nbHits: 0, nbPages: 0, page: 0 };
  }

  const { page = 0, hitsPerPage = 12, filters, facetFilters } = options;

  const result = await searchClient.searchSingleIndex<AlgoliaProduct>({
    indexName: ALGOLIA_INDEX,
    searchParams: {
      query,
      page,
      hitsPerPage,
      filters,
      facetFilters,
      facets: ["category", "brand", "tags"],
    },
  });

  return {
    hits: result.hits,
    nbHits: result.nbHits ?? 0,
    nbPages: result.nbPages ?? 0,
    page: result.page ?? 0,
    facets: result.facets,
  };
}

export async function indexProduct(product: AlgoliaProduct) {
  if (!adminClient) return;
  await adminClient.saveObject({
    indexName: ALGOLIA_INDEX,
    body: product,
  });
}

export async function removeProductFromIndex(objectId: string) {
  if (!adminClient) return;
  await adminClient.deleteObject({
    indexName: ALGOLIA_INDEX,
    objectID: objectId,
  });
}
