export const DANBOORU_URL = 'https://danbooru.donmai.us/wiki_pages';
export const DANBOORU_CSV_PATH = `${
    import.meta.env.MODE === 'development' ? '/public' : ''
}/assets/danbooru.csv`;
export const DANBOORU_CSV_HEADER = 'name,category,postsCount,maybeNames\n';
