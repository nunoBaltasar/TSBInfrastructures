export type Locale = 'pt' | 'en';

export const defaultLocale: Locale = 'en';

export const translations = {
  pt: {
    navigation: {
      home: 'Início',
      articles: 'Artigos',
      gallery: 'Galeria',
      contributors: 'Colaboradores',
    },
    language: 'Idioma',
    home: {
      heroTitle: 'Explora o',
      heroTitleAccent: 'TravelBlog',
      heroDescription: 'Descobre o mundo através das nossas histórias e guias de viagem.',
      explore: 'Explorar agora',
      aboutTitle: 'Sobre',
      aboutTitleAccent: 'nós',
      aboutDescription:
        'Bem-vindo ao TravelBlog, o teu destino para inspiração e informação sobre viagens. A nossa equipa de viajantes apaixonados partilha experiências, dicas e guias para ajudar a planear a tua próxima aventura. Quer sejas um viajante experiente ou estejas a começar, temos algo para todos. Junta-te a nós enquanto exploramos o mundo, um destino de cada vez.',
      current: '',
      authors: 'Autores',
      total: '',
      articles: 'Artigos',
      photosTitle: 'Algumas das nossas',
      photosTitleAccent: 'fotos',
    },
    articlesPage: {
      title: 'Histórias e',
      titleAccent: 'Guias',
      description: 'Descobre as melhores experiências e dicas de viagem. Consulta o nosso artigo mais recente.',
      allTitle: 'Todos os',
      allTitleAccent: 'artigos',
      readArticle: 'Ler artigo',
    },
    galleryPage: {
      title: 'Galeria',
      description: 'Explora a nossa coleção de fotografias de viagem.',
      ariaLabel: 'Galeria de viagens',
      close: 'Fechar',
      filterBy: 'Filtrar por:',
      allTags: 'Todas',
      loadMore: 'Carregar mais',
      loading: 'A carregar mais fotografias...',
      loadError: 'Não foi possível carregar mais fotografias. Tenta novamente.',
      publishedOn: 'Publicado em',
      by: 'Por',
      enlarge: 'Ampliar imagem',
      reduce: 'Reduzir imagem',
    },
    contributorsPage: {
      title: 'Colaboradores',
      description: 'Conhece as pessoas que tornam o nosso blog de viagens possível.',
      roles: {
        Administrator: 'Administradores',
        Moderator: 'Moderadores',
        Writer: 'Escritores',
        Traveller: 'Viajantes',
      },
    },
    articlePage: {
      writtenBy: 'Escrito por',
      tags: 'Etiquetas',
      author: 'Autor',
    },
    footer: {
      tagline: 'Cria, Explora e Partilha',
      privacy: 'Política de Privacidade',
      cooperation: 'Cooperação',
      sponsorship: 'Patrocínios',
      contact: 'Contactos',
      copyright: 'Todos os direitos reservados.',
    },
  },
  en: {
    navigation: {
      home: 'Homepage',
      articles: 'Articles',
      gallery: 'Gallery',
      contributors: 'Contributors',
    },
    language: 'Language',
    home: {
      heroTitle: 'Explore',
      heroTitleAccent: 'TravelBlog',
      heroDescription: 'Discover the world through our travel stories and guides.',
      explore: 'Explore Now',
      aboutTitle: 'About',
      aboutTitleAccent: 'Us',
      aboutDescription:
        'Welcome to TravelBlog, your ultimate destination for travel inspiration and information. Our team of passionate travelers is dedicated to sharing their experiences, tips, and guides to help you plan your next adventure. Whether you are a seasoned traveler or just starting out, we have something for everyone. Join us as we explore the world, one destination at a time.',
      current: 'Current',
      authors: 'Authors',
      total: 'Total',
      articles: 'Articles',
      photosTitle: 'Some of our',
      photosTitleAccent: 'photos',
    },
    articlesPage: {
      title: 'Stories &',
      titleAccent: 'Guides',
      description: 'Discover the best travel experiences and tips. Check out our latest published article.',
      allTitle: 'All',
      allTitleAccent: 'Articles',
      readArticle: 'Read article',
    },
    galleryPage: {
      title: 'Gallery',
      description: 'Explore our collection of travel photographs.',
      ariaLabel: 'Travel gallery',
      close: 'Close',
      filterBy: 'Filter by:',
      allTags: 'All',
      loadMore: 'Load more',
      loading: 'Loading more photos...',
      loadError: 'Unable to load more photos. Try again.',
      publishedOn: 'Published on',
      by: 'By',
      enlarge: 'Enlarge image',
      reduce: 'Reduce image',
    },
    contributorsPage: {
      title: 'Contributors',
      description: 'Meet the people who make our travel blog possible.',
      roles: {
        Administrator: 'Administrator',
        Moderator: 'Moderator',
        Writer: 'Writer',
        Traveller: 'Traveller',
      },
    },
    articlePage: {
      writtenBy: 'Written by',
      tags: 'Tags',
      author: 'Author',
    },
    footer: {
      tagline: 'Create, Explore & Share',
      privacy: 'Privacy Policy',
      cooperation: 'Cooperation',
      sponsorship: 'Sponsorship',
      contact: 'Contact Us',
      copyright: 'All rights reserved.',
    },
  },
} as const;

export function isLocale(value: string | undefined): value is Locale {
  return value === 'pt' || value === 'en';
}

export function getLocale(pathname: string): Locale {
  const firstSegment = pathname.split('/').filter(Boolean)[0];
  return isLocale(firstSegment) ? firstSegment : defaultLocale;
}

export function localizedPath(locale: Locale, pathname: string): string {
  const pathWithoutLocale = pathname.replace(/^\/(pt|en)(?=\/|$)/, '') || '/';
  return `/${locale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`;
}
