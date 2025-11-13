/**
 * Composable for managing SEO meta tags and structured data
 * Provides reusable defaults and helper functions for consistent SEO implementation
 */

import { useHead } from '@vueuse/head'

/**
 * Generate comprehensive SEO meta tags using useHead
 * @param {Object} options - SEO configuration options
 * @param {string} options.title - Page title
 * @param {string} options.description - Page description
 * @param {string} options.url - Canonical URL
 * @param {string} [options.image] - Social sharing image URL
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
    image = 'https://home.runonflux.io/images/logo.png',
    type = 'website',
    keywords = '',
    structuredData = [],
    meta = [],
    link = [],
    robots = 'index, follow',
  } = options

  // Default meta tags
  const defaultMeta = [
    {
      name: 'description',
      content: description,
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
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: image },
    { property: 'og:url', content: url },
    { property: 'og:type', content: type },
    { property: 'og:site_name', content: 'FluxCloud' },
    { property: 'og:locale', content: 'en_US' },

    // Twitter Card
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: image },
    { name: 'twitter:site', content: '@RunOnFlux' },
    { name: 'twitter:creator', content: '@RunOnFlux' },
  ]

  // Add keywords if provided
  if (keywords) {
    defaultMeta.push({
      name: 'keywords',
      content: keywords,
    })
  }

  // Default link tags
  const defaultLink = [
    { rel: 'canonical', href: url },
  ]

  // Generate structured data scripts
  const scripts = structuredData.length > 0
    ? [
      {
        type: 'application/ld+json',
        children: JSON.stringify(structuredData),
      },
    ]
    : []

  useHead({
    title,
    meta: [...defaultMeta, ...meta],
    link: [...defaultLink, ...link],
    script: scripts,
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
    'url': 'https://home.runonflux.io',
    'logo': 'https://home.runonflux.io/logo.png',
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
 * @param {Array<Object>} items - List items [{name: '...', url: '...', description: '...'}]
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
        '@type': 'Product',
        'name': item.name,
        'url': item.url,
        'description': item.description,
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
