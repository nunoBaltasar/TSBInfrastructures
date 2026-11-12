export interface StrapiMedia{
    id: number;
    documentId: string;
    name: string;
    alternativeText: string | null;
    caption: string | null;
    width: number;
    height: number;
    formats?: Record<string, StrapiMediaFormat>;
    url: string;
    mime: string;
    size: number;
}


export interface StrapiMediaFormat {
  name: string;
  width: number;
  height: number;
  url: string;
  mime: string;
  size: number;
}

export interface Tag {
  id: number;
  documentId: string;
  name: string;
  slug: string;
}

export interface Author {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  biography?: string;
  role?: string;
  profileImage?: StrapiMedia | null;
  website?: string | null;
  instagram?: string | null;
  youtube?: string | null;
}

export interface Article {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  summary: string;
  content: unknown;
  featured: boolean;
  publishedAt: string;
  coverImage: StrapiMedia | null;
  media?: StrapiMedia[];
  author?: Author | null;
  tags?: Tag[];
}

export interface GalleryImage {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  description?: string;
  location?: string;
  publishedAt: string;
  image: StrapiMedia | null;
  author?: Author | null;
  tags?: Tag[];
}

export interface StrapiCollectionResponse<T> {
  data: T[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}