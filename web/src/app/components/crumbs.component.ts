import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-crumbs',
  imports: [RouterLink],
  template: `<nav class="crumbs wrap" aria-label="Breadcrumb">@for (c of items; track c.path; let last = $last) { @if (last) { <span aria-current="page">{{ c.name }}</span> } @else { <a [routerLink]="c.path">{{ c.name }}</a> <i>/</i> } }</nav>`
})
export class CrumbsComponent { @Input() items: { name: string; path: string }[] = []; }
