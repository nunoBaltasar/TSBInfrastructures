interface Props {
  endpoint: string;
  query?: Record<string, string>;
  locale?: 'pt' | 'en';
  wrappedByKey?: string;
  wrappedByList?: boolean;
}

type Locale = 'pt' | 'en';

async function fetchJson(url: URL): Promise<Record<string, unknown>> {
  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Strapi request failed with status ${response.status}`);
  }

  return response.json() as Promise<Record<string, unknown>>;
}

function mergeLocalizedItem(
  selectedItem: Record<string, unknown>,
  fallbackItem: Record<string, unknown>,
): Record<string, unknown> {
  const mergedItem = { ...fallbackItem, ...selectedItem };

  Object.entries(fallbackItem).forEach(([key, fallbackValue]) => {
    const selectedValue = selectedItem[key];
    const isMissing =
      selectedValue === null ||
      selectedValue === undefined ||
      (Array.isArray(selectedValue) && selectedValue.length === 0);

    if (isMissing && fallbackValue !== null && fallbackValue !== undefined) {
      mergedItem[key] = fallbackValue;
    }
  });

  return mergedItem;
}

async function localizeTags(
  items: Array<Record<string, unknown>>,
  locale: Locale,
): Promise<void> {
  const itemsWithTags = items.filter((item) => Array.isArray(item.tags));

  if (itemsWithTags.length === 0) {
    return;
  }

  const tagsUrl = new URL(`${import.meta.env.STRAPI_URL}/api/tags`);
  tagsUrl.searchParams.set('locale', locale);
  tagsUrl.searchParams.set('pagination[pageSize]', '100');
  const tagsResponse = await fetchJson(tagsUrl);
  const localizedTags = new Map(
    (Array.isArray(tagsResponse.data) ? tagsResponse.data : []).map(
      (tag) => [tag.documentId ?? tag.id, tag],
    ),
  );

  itemsWithTags.forEach((item) => {
    item.tags = (item.tags as Array<Record<string, unknown>>).map((tag) => {
      const localizedTag = localizedTags.get(tag.documentId ?? tag.id);
      return localizedTag ? { ...tag, ...localizedTag } : tag;
    });
  });
}

/**
 * Fetches data from the Strapi API
 * @param endpoint - The endpoint to fetch from
 * @param query - The query parameters to add to the url
 * @param wrappedByKey - The key to unwrap the response from
 * @param wrappedByList - If the response is a list, unwrap it
 * @returns
 */
export default async function fetchApi<T>({
  endpoint,
  query,
  locale,
  wrappedByKey,
  wrappedByList,
}: Props): Promise<T> {
  if (endpoint.startsWith('/')) {
    endpoint = endpoint.slice(1);
  }

  const url = new URL(`${import.meta.env.STRAPI_URL}/api/${endpoint}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }
  if (!url.searchParams.has('locale')) {
    url.searchParams.set('locale', locale ?? 'pt');
  }
  const selectedLocale: Locale = locale ?? 'pt';
  const otherLocale: Locale = selectedLocale === 'pt' ? 'en' : 'pt';
  let data = await fetchJson(url);

  if (Array.isArray(data.data)) {
    const otherLocaleUrl = new URL(url);
    otherLocaleUrl.searchParams.set('locale', otherLocale);
    const otherLocaleData = await fetchJson(otherLocaleUrl);
    const selectedItems = data.data as Array<Record<string, unknown>>;
    const otherItems = Array.isArray(otherLocaleData.data)
      ? (otherLocaleData.data as Array<Record<string, unknown>>)
      : [];
    const selectedByKey = new Map(
      selectedItems.map((item) => [item.documentId ?? item.id, item]),
    );
    const mergedItems = selectedItems.map((item) => item);

    otherItems.forEach((item) => {
      const key = item.documentId ?? item.id;
      const selectedItem = selectedByKey.get(key);

      if (selectedItem) {
        const index = mergedItems.indexOf(selectedItem);
        mergedItems[index] = mergeLocalizedItem(selectedItem, item);
      } else {
        mergedItems.push(item);
      }
    });

    data.data = mergedItems;
    await localizeTags(mergedItems, selectedLocale);

    if (
      data.meta &&
      typeof data.meta === 'object' &&
      'pagination' in data.meta &&
      data.meta.pagination &&
      typeof data.meta.pagination === 'object'
    ) {
      const pagination = data.meta.pagination as Record<string, unknown>;
      pagination.total = data.data.length;
      pagination.pageCount = Math.max(
        1,
        Math.ceil(
          data.data.length / Number(pagination.pageSize ?? data.data.length),
        ),
      );
    }
  }

  if (wrappedByKey) {
    data = data[wrappedByKey];
  }

  if (wrappedByList) {
    data = data[0];
  }

  return data as T;
}