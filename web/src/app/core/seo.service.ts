import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { SITE } from '../site.config';

export interface SeoInput {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  jsonLd?: object[];
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private title = inject(Title);
  private meta = inject(Meta);
  private doc = inject(DOCUMENT);

  set(i: SeoInput): void {
    const url = SITE.url + (i.path === '/' ? '/' : i.path);
    this.title.setTitle(i.title);
    const tags: Record<string, string> = {
      description: i.description,
      robots: i.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large',
      'og:type': 'website', 'og:site_name': SITE.brand, 'og:title': i.title, 'og:description': i.description,
      'og:url': url, 'og:locale': 'en_IN', 'twitter:card': 'summary', 'twitter:title': i.title, 'twitter:description': i.description
    };
    for (const [k, v] of Object.entries(tags)) {
      const attr = k.startsWith('og:') ? 'property' : 'name';
      this.meta.updateTag({ [attr]: k, content: v } as { name: string; content: string });
    }
    this.canonical(url);
    this.jsonLd(i.jsonLd ?? []);
  }

  private canonical(url: string): void {
    let el = this.doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!el) { el = this.doc.createElement('link'); el.setAttribute('rel', 'canonical'); this.doc.head.appendChild(el); }
    el.setAttribute('href', url);
  }

  private jsonLd(items: object[]): void {
    this.doc.head.querySelectorAll('script[data-ld]').forEach((n) => n.remove());
    for (const item of [this.business(), ...items]) {
      const s = this.doc.createElement('script');
      s.setAttribute('type', 'application/ld+json');
      s.setAttribute('data-ld', '1');
      s.textContent = JSON.stringify(item);
      this.doc.head.appendChild(s);
    }
  }

  private business(): object {
    return {
      '@context': 'https://schema.org', '@type': ['TaxiService', 'LocalBusiness'], '@id': SITE.url + '/#business',
      name: SITE.brand, url: SITE.url, telephone: SITE.phoneIntl, priceRange: '₹₹',
      areaServed: ['Tamil Nadu', 'Puducherry', 'Karnataka', 'Andhra Pradesh'],
      address: { '@type': 'PostalAddress', addressLocality: 'Chennai', addressRegion: 'Tamil Nadu', addressCountry: 'IN' },
      openingHoursSpecification: { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'], opens: '00:00', closes: '23:59' }
    };
  }

  static breadcrumb(items: { name: string; path: string }[]): object {
    return {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: items.map((it, idx) => ({ '@type': 'ListItem', position: idx + 1, name: it.name, item: SITE.url + (it.path === '/' ? '/' : it.path) }))
    };
  }
  static faq(qa: { q: string; a: string }[]): object {
    return {
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: qa.map((x) => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } }))
    };
  }
}
