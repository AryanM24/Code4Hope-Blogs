/*
 * @Author: kim
 * @Description: rss 提要
 */
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import slateConfig from '~@/slate.config';

export async function GET(context) {
  const blog = await getCollection('post');

  const postItems = blog
    .filter((post) => !post.data.draft)
    .sort((a, b) => b.data.pubDate - a.data.pubDate)
    .map((post) => {
      // Simplified RSS feed - just use description for now to avoid config validation issues
      return {
        link: `/blog/${post.slug}/`,
        title: post.data.title,
        description: post.data.description || '',
        pubDate: post.data.pubDate,
        ...post.data,
      }
    });

  const rssOptions = {
    stylesheet: '/pretty-feed-v3.xsl',
    title: slateConfig.title,
    description: slateConfig.description,
    site: context.site,
    trailingSlash: false,
    items: postItems,
  }

  if(slateConfig.follow) {
    rssOptions.customData = `<follow_challenge>
      <feedId>${slateConfig.follow.feedId}</feedId>
      <userId>${slateConfig.follow.userId}</userId>
    </follow challenge>`;
  }

  return rss(rssOptions);
}
