// Define the fields needed for articles when a fetch for content is performed
const ARTICLE_GRAPHQL_FIELDS = `
  sys {
    id
  }
  title
  slug
  summary
  details {
    json
    links {
      assets {
        block {
          sys {
            id
          }
          url
          description
        }
      }
    }
  }
  date
  authorName
  categoryName
  articleImage {
    url
  }
`;

// Define interfaces for the expected data structure
interface Sys {
  id: string;
}

interface AssetBlock {
  sys: Sys;
  url: string;
  description: string;
}

interface DetailsLinks {
  assets: {
    block: AssetBlock[];
  };
}

interface Details {
  json: string; // Adjust the type if you have a specific structure for the JSON
  links: DetailsLinks;
}

interface Article {
  sys: Sys;
  title: string;
  slug: string;
  summary: string;
  details: Details;
  date: string;
  authorName: string;
  categoryName: string;
  articleImage: {
    url: string;
  };
}

interface FetchResponse {
  data?: {
    knowledgeArticleCollection?: {
      items: Article[];
    };
  };
}

// Fetch GraphQL data
async function fetchGraphQL(
  query: string,
  preview: boolean = false
): Promise<FetchResponse> {
  const response = await fetch(
    `https://graphql.contentful.com/content/v1/spaces/${process.env.CONTENTFUL_SPACE_ID}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${
          preview
            ? process.env.CONTENTFUL_PREVIEW_ACCESS_TOKEN
            : process.env.CONTENTFUL_ACCESS_TOKEN
        }`,
      },
      body: JSON.stringify({ query }),
      next: { tags: ["articles"] },
    }
  );

  return response.json();
}

// Extract articles from the fetch response
function extractArticleEntries(
  fetchResponse: FetchResponse
): Article[] | undefined {
  return fetchResponse?.data?.knowledgeArticleCollection?.items;
}

// Get all articles
export async function getAllArticles(
  limit: number = 3,
  isDraftMode: boolean = false
): Promise<Article[] | undefined> {
  const query = `query {
    knowledgeArticleCollection(where:{slug_exists: true}, order: date_DESC, limit: ${limit}, preview: ${
    isDraftMode ? "true" : "false"
  }) {
      items {
        ${ARTICLE_GRAPHQL_FIELDS}
      }
    }
  }`;

  const articles = await fetchGraphQL(query, isDraftMode);
  return extractArticleEntries(articles);
}

// Get a single article by slug
export async function getArticle(
  slug: string,
  isDraftMode: boolean = false
): Promise<Article | undefined> {
  const query = `query {
    knowledgeArticleCollection(where:{slug: "${slug}"}, limit: 1, preview: ${
    isDraftMode ? "true" : "false"
  }) {
      items {
        ${ARTICLE_GRAPHQL_FIELDS}
      }
    }
  }`;

  const article = await fetchGraphQL(query, isDraftMode);
  const articles = extractArticleEntries(article);
  return articles ? articles[0] : undefined;
}
