import axios from 'axios';

export interface LocalEntity {
    name: string;
    description: string;
    wikipediaUrl?: string;
    wikidataId?: string;
    type: string; // 'monument', 'neighborhood', 'city', 'landmark'
}

/**
 * EntityManager - The bridge between local keywords and global authority.
 * Connects content to Wikipedia/Wikidata for maximum SEO relevance.
 */
export class EntityManager {
    /**
     * Search for Wikipedia/Wikidata entities related to a city or specific landmark.
     */
    async findLocalEntities(city: string, query: string = ''): Promise<LocalEntity[]> {
        const searchTerms = `${query} ${city}`.trim();
        const url = `https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchTerms)}&format=json&origin=*`;

        try {
            console.log(`[Entities] Searching entities for: ${searchTerms}...`);
            const response = await axios.get(url);
            const searchResults = response.data.query.search;

            const entities: LocalEntity[] = searchResults.slice(0, 5).map((res: any) => ({
                name: res.title,
                description: res.snippet.replace(/<[^>]*>/g, ''), // Clean HTML tags
                wikipediaUrl: `https://es.wikipedia.org/wiki/${encodeURIComponent(res.title.replace(/ /g, '_'))}`,
                type: 'authority_node'
            }));

            return entities;
        } catch (error) {
            console.error('[Entities] Error fetching from Wikipedia:', error);
            return [];
        }
    }

    /**
     * Advanced: Lookup Wikidata ID for semantic linking (sameAs schema)
     */
    async getWikidataId(wikipediaTitle: string): Promise<string | undefined> {
        const url = `https://es.wikipedia.org/w/api.php?action=query&prop=pageprops&titles=${encodeURIComponent(wikipediaTitle)}&format=json&origin=*`;

        try {
            const response = await axios.get(url);
            const pages = response.data.query.pages;
            const firstPageId = Object.keys(pages)[0];
            return pages[firstPageId].pageprops?.wikibase_item;
        } catch (error) {
            console.error('[Entities] Error fetching Wikidata ID:', error);
            return undefined;
        }
    }
}

export const entityManager = new EntityManager();