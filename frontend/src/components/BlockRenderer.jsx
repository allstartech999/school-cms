import React from 'react';
import HeroBannerBlock from './blocks/HeroBannerBlock';
import StatsBarBlock from './blocks/StatsBarBlock';
import FeatureGridBlock from './blocks/FeatureGridBlock';
import TwoColumnsBlock from './blocks/TwoColumnsBlock';
import AccordionFaqBlock from './blocks/AccordionFaqBlock';
import PersonCardsBlock from './blocks/PersonCardsBlock';
import RichTextBlock from './blocks/RichTextBlock';
import ImageGalleryBlock from './blocks/ImageGalleryBlock';

const BLOCK_COMPONENTS = {
  hero_banner: HeroBannerBlock,
  stats_bar: StatsBarBlock,
  feature_grid: FeatureGridBlock,
  two_columns: TwoColumnsBlock,
  accordion_faq: AccordionFaqBlock,
  person_cards: PersonCardsBlock,
  rich_text: RichTextBlock,
  image_gallery: ImageGalleryBlock,
};

export default function BlockRenderer({ blocks }) {
  if (!blocks) return null;

  let parsedBlocks = blocks;
  if (typeof blocks === 'string') {
    try {
      parsedBlocks = JSON.parse(blocks);
    } catch (e) {
      console.error('Failed to parse layout_data blocks JSON:', e);
      return null;
    }
  }

  if (!Array.isArray(parsedBlocks) || parsedBlocks.length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-6">
      {parsedBlocks.map((block, index) => {
        const Component = BLOCK_COMPONENTS[block.type];
        if (!Component) {
          console.warn(`Unknown block type: ${block.type}`);
          return null;
        }

        return <Component key={index} {...(block.props || {})} />;
      })}
    </div>
  );
}
