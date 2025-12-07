/**
 * Composable for managing SEO meta tags and structured data
 * Provides reusable defaults and helper functions for consistent SEO implementation
 */

import { useHead } from '@vueuse/head'
import { computed } from 'vue'

/**
 * Escape HTML special characters to prevent XSS in user-provided content
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string with HTML entities escaped
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return str
  
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Generate comprehensive SEO meta tags using useHead
 * @param {Object} options - SEO configuration options
 * @param {string} options.title - Page title
 * @param {string} options.description - Page description
 * @param {string} options.url - Canonical URL
 * @param {string} [options.image] - Social sharing image URL
 * @param {string} [options.imageWidth='1200'] - Image width for OG/Twitter
 * @param {string} [options.imageHeight='630'] - Image height for OG/Twitter
 * @param {string} [options.imageAlt] - Image alt text (defaults to title)
 * @param {string} [options.type='website'] - Open Graph type
 * @param {string} [options.keywords] - Comma-separated keywords
 * @param {Array<Object>} [options.structuredData] - Array of structured data objects
 * @param {Object} [options.meta] - Additional meta tags to merge
 * @param {Object} [options.link] - Additional link tags to merge
 * @param {string} [options.robots='index, follow'] - Robots meta content
 */
export function useSEO(options) {
  const {
    title,
    description,
    url,
    image = 'https://cloud.runonflux.com/images/logo.png',
    imageWidth = '1200',
    imageHeight = '630',
    imageAlt,
    type = 'website',
    keywords = '',
    structuredData = [],
    meta = [],
    link = [],
    robots = 'index, follow',
  } = options

  // Sanitize user-provided content to prevent XSS
  const safeTitle = escapeHtml(title)
  const safeDescription = escapeHtml(description)
  const safeKeywords = escapeHtml(keywords)

  // Use title as default alt text if not provided
  const imgAlt = escapeHtml(imageAlt || title)

  // Default meta tags
  const defaultMeta = [
    {
      name: 'description',
      content: safeDescription,
    },
    {
      name: 'author',
      content: 'Flux Network',
    },
    {
      name: 'robots',
      content: robots,
    },

    // Open Graph
    { property: 'og:title', content: safeTitle },
    { property: 'og:description', content: safeDescription },
    { property: 'og:image', content: image },
    { property: 'og:image:width', content: imageWidth },
    { property: 'og:image:height', content: imageHeight },
    { property: 'og:image:alt', content: imgAlt },
    { property: 'og:url', content: url },
    { property: 'og:type', content: type },
    { property: 'og:site_name', content: 'FluxCloud' },
    { property: 'og:locale', content: 'en_US' },

    // Twitter Card
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: safeTitle },
    { name: 'twitter:description', content: safeDescription },
    { name: 'twitter:image', content: image },
    { name: 'twitter:image:alt', content: imgAlt },
    { name: 'twitter:site', content: '@RunOnFlux' },
    { name: 'twitter:creator', content: '@RunOnFlux' },
  ]

  // Add keywords if provided
  if (safeKeywords) {
    defaultMeta.push({
      name: 'keywords',
      content: safeKeywords,
    })
  }

  // Default link tags
  const defaultLink = [
    { rel: 'canonical', href: url },
  ]

  // Generate structured data scripts (reactive computed)
  // Handle both raw arrays and computed refs - wrap in computed for reactivity
  const scripts = computed(() => {
    const data = structuredData?.value !== undefined ? structuredData.value : structuredData
    
    return data && data.length > 0
      ? [
        {
          type: 'application/ld+json',
          children: JSON.stringify(data),
        },
      ]
      : []
  })

  useHead({
    title: safeTitle,
    meta: [...defaultMeta, ...meta],
    link: [...defaultLink, ...link],
    script: scripts, // Pass computed ref so useHead can track changes
  })
}

/**
 * Generate Organization structured data
 * @returns {Object} Organization schema
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'Flux Network',
    'url': 'https://cloud.runonflux.com',
    'logo': 'https://cloud.runonflux.com/images/logo.png',
    'description': 'Decentralized Web3 cloud infrastructure powered by FluxNodes worldwide',
    'sameAs': [
      'https://twitter.com/RunOnFlux',
      'https://github.com/RunOnFlux',
    ],
  }
}

/**
 * Generate Breadcrumb structured data
 * @param {Array<Object>} items - Breadcrumb items [{name: 'Home', url: '...'}]
 * @returns {Object} BreadcrumbList schema
 */
export function generateBreadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': item.url,
    })),
  }
}

/**
 * Generate Product structured data
 * @param {Object} product - Product information
 * @param {string} product.name - Product name
 * @param {string} product.description - Product description
 * @param {string} product.image - Product image URL
 * @param {string} product.url - Product URL
 * @param {number} product.price - Product price
 * @param {string} [product.currency='USD'] - Price currency
 * @param {string} [product.availability='https://schema.org/InStock'] - Availability status
 * @returns {Object} Product schema
 */
export function generateProductSchema(product) {
  const {
    name,
    description,
    image,
    url,
    price,
    currency = 'USD',
    availability = 'https://schema.org/InStock',
  } = product

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': name,
    'description': description,
    'image': image,
    'url': url,
    'offers': {
      '@type': 'Offer',
      'price': price,
      'priceCurrency': currency,
      'availability': availability,
      'url': url,
    },
  }
}

/**
 * Generate WebApplication structured data
 * @param {Object} app - Application information
 * @param {string} app.name - Application name
 * @param {string} app.description - Application description
 * @param {string} app.url - Application URL
 * @param {string} app.image - Application image URL
 * @param {Array<string>} [app.features] - Feature list
 * @param {Object} [app.offers] - Offer information {lowPrice, highPrice}
 * @returns {Object} WebApplication schema
 */
export function generateWebApplicationSchema(app) {
  const {
    name,
    description,
    url,
    image,
    features = [],
    offers,
  } = app

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': name,
    'applicationCategory': 'BusinessApplication',
    'operatingSystem': 'Web',
    'description': description,
    'url': url,
    'image': image,
    'provider': {
      '@type': 'Organization',
      'name': 'Flux Network',
      'url': 'https://runonflux.com',
    },
  }

  if (features.length > 0) {
    schema.featureList = features
  }

  if (offers) {
    schema.offers = {
      '@type': 'AggregateOffer',
      'priceCurrency': 'USD',
      'lowPrice': offers.lowPrice || '0.99',
      'highPrice': offers.highPrice || '500',
    }
  }

  return schema
}

/**
 * Generate FAQPage structured data
 * @param {Array<Object>} faqs - FAQ items [{question: '...', answer: '...'}]
 * @returns {Object} FAQPage schema
 */
export function generateFAQSchema(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map(faq => ({
      '@type': 'Question',
      'name': faq.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': faq.answer,
      },
    })),
  }
}

/**
 * Generate ItemList structured data (useful for marketplace listings)
 * @param {Array<Object>} items - List items [{name: '...', url: '...', description: '...', price: 0}]
 * @param {string} [listName] - Name of the list
 * @returns {Object} ItemList schema
 */
export function generateItemListSchema(items, listName) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'itemListElement': items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'item': {
        '@type': 'SoftwareApplication',
        'name': item.name,
        'url': item.url,
        'description': item.description,
        'applicationCategory': 'WebApplication',
        'operatingSystem': 'Web',
        'offers': {
          '@type': 'Offer',
          'price': item.price || 0,
          'priceCurrency': 'USD',
          'availability': 'https://schema.org/InStock',
        },
      },
    })),
  }

  if (listName) {
    schema.name = listName
  }

  return schema
}

/**
 * Generate SoftwareApplication structured data
 * @param {Object} software - Software information
 * @param {string} software.name - Software name
 * @param {string} software.description - Software description
 * @param {string} software.url - Software URL
 * @param {string} software.image - Software image URL
 * @param {Object} [software.offers] - Pricing information {price, currency, availability}
 * @param {string} [software.applicationCategory] - Application category (e.g., 'GameServer', 'BusinessApplication')
 * @param {string} [software.operatingSystem] - Operating system (e.g., 'Linux', 'Web')
 * @param {Array<string>} [software.features] - List of features
 * @param {Object} [software.aggregateRating] - Rating information {ratingValue, reviewCount, bestRating}
 * @param {Object} [software.provider] - Provider information {name, url}
 * @returns {Object} SoftwareApplication schema
 */
export function generateSoftwareApplicationSchema(software) {
  const {
    name,
    description,
    url,
    image,
    offers,
    applicationCategory = 'BusinessApplication',
    operatingSystem = 'Web',
    features = [],
    aggregateRating,
    provider,
  } = software

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': name,
    'description': description,
    'url': url,
    'image': image,
    'operatingSystem': operatingSystem,
    'applicationCategory': applicationCategory,
    'provider': provider || {
      '@type': 'Organization',
      'name': 'Flux Network',
      'url': 'https://runonflux.com',
    },
  }

  // Add offers if provided
  if (offers) {
    schema.offers = {
      '@type': 'Offer',
      'price': offers.price || '0',
      'priceCurrency': offers.currency || 'USD',
      'availability': offers.availability || 'https://schema.org/InStock',
      'url': url,
    }
  }

  // Add features if provided
  if (features.length > 0) {
    schema.featureList = features
  }

  // Add aggregate rating if provided
  if (aggregateRating) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      'ratingValue': aggregateRating.ratingValue || '4.8',
      'reviewCount': aggregateRating.reviewCount || '1',
      'bestRating': aggregateRating.bestRating || '5',
      'worstRating': '1',
    }
  }

  return schema
}

/**
 * Generate Article structured data with timestamps
 * @param {Object} article - Article information
 * @param {string} article.headline - Article headline/title
 * @param {string} article.description - Article description
 * @param {string} article.url - Article URL
 * @param {string} article.image - Article image URL
 * @param {string} [article.datePublished] - ISO date string for publication date
 * @param {string} [article.dateModified] - ISO date string for last modification date
 * @param {string} [article.author] - Author name (defaults to 'Flux Network')
 * @returns {Object} Article schema
 */
export function generateArticleSchema(article) {
  const {
    headline,
    description,
    url,
    image,
    datePublished,
    dateModified,
    author = 'Flux Network',
  } = article

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': headline,
    'description': description,
    'url': url,
    'image': image,
    'author': {
      '@type': 'Organization',
      'name': author,
      'url': 'https://runonflux.com',
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'Flux Network',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://cloud.runonflux.com/images/logo.png',
      },
    },
  }

  if (datePublished) {
    schema.datePublished = datePublished
  }

  if (dateModified) {
    schema.dateModified = dateModified
  }

  return schema
}

/**
 * Set meta robots to noindex for private pages
 * Useful for dashboard, admin, and authenticated pages
 */
export function useSEONoIndex() {
  useHead({
    meta: [
      {
        name: 'robots',
        content: 'noindex, nofollow',
      },
    ],
  })
}
