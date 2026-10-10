import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home.page').then((m) => m.HomePage) },
  { path: 'one-way-taxi', loadComponent: () => import('./pages/list.page').then((m) => m.ListPage), data: { kind: 'cities', base: '/one-way-taxi' } },
  { path: 'one-way-taxi/:slug', loadComponent: () => import('./pages/city.page').then((m) => m.CityPage), data: { mode: 'oneway' } },
  { path: 'outstation-taxi', loadComponent: () => import('./pages/list.page').then((m) => m.ListPage), data: { kind: 'cities', base: '/outstation-taxi' } },
  { path: 'outstation-taxi/:slug', loadComponent: () => import('./pages/city.page').then((m) => m.CityPage), data: { mode: 'outstation' } },
  { path: 'airport-taxi', loadComponent: () => import('./pages/list.page').then((m) => m.ListPage), data: { kind: 'cities', base: '/airport-taxi' } },
  { path: 'airport-taxi/:slug', loadComponent: () => import('./pages/city.page').then((m) => m.CityPage), data: { mode: 'airport' } },
  { path: 'drop-taxi', loadComponent: () => import('./pages/list.page').then((m) => m.ListPage), data: { kind: 'routes', base: '/drop-taxi' } },
  { path: 'drop-taxi/:slug', loadComponent: () => import('./pages/route.page').then((m) => m.RoutePage) },
  { path: 'services', loadComponent: () => import('./pages/list.page').then((m) => m.ListPage), data: { kind: 'services', base: '/services' } },
  { path: 'services/:slug', loadComponent: () => import('./pages/service.page').then((m) => m.ServicePage) },
  { path: 'tariff', loadComponent: () => import('./pages/tariff.page').then((m) => m.TariffPage) },
  { path: 'about', loadComponent: () => import('./pages/static.page').then((m) => m.StaticPageComponent), data: { key: 'about' } },
  { path: 'contact', loadComponent: () => import('./pages/static.page').then((m) => m.StaticPageComponent), data: { key: 'contact' } },
  { path: 'faq', loadComponent: () => import('./pages/static.page').then((m) => m.StaticPageComponent), data: { key: 'faq' } },
  { path: 'terms', loadComponent: () => import('./pages/static.page').then((m) => m.StaticPageComponent), data: { key: 'terms' } },
  { path: 'privacy-policy', loadComponent: () => import('./pages/static.page').then((m) => m.StaticPageComponent), data: { key: 'privacy' } },
  { path: 'cancellation-policy', loadComponent: () => import('./pages/static.page').then((m) => m.StaticPageComponent), data: { key: 'cancellation' } },
  { path: 'sitemap', loadComponent: () => import('./pages/sitemap.page').then((m) => m.SitemapPage) },
  { path: '**', loadComponent: () => import('./pages/notfound.page').then((m) => m.NotFoundPage) }
];
