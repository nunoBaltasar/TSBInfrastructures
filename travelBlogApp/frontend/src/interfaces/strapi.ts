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
  articles?: Article | null;
}

export interface Author {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  biography?: string | null;
  profileImage?: StrapiMedia | null;
  articles?: Article | null;
  gallery_image?: GalleryImage | null;
}

export interface Article {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  summary: string;
  content: unknown;
  publishedAt: string;
  coverImage: StrapiMedia | null;
  media?: StrapiMedia[];
  author?: Author | null;
  tags?: Tag[];
  gallery_image?: GalleryImage | null;
}

export interface GalleryImage {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  description: string;
  location?: string;
  publishedAt: string;
  image: StrapiMedia | null;
  author?: Author | null;
  articles?: Article[];
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