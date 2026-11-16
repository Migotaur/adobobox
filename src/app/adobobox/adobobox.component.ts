import { Component, Input } from '@angular/core';

export interface Adobo {
  name: string;
  description: string;
  url?: string;
  icon?: 'play' | 'radio' | 'window' | 'book' | 'heart' | 'tools';
}

@Component({
  selector: 'app-adobobox',
  standalone: true,
  host: { '[style.--box-color]': 'color' },
  templateUrl: './adobobox.component.html',
  styleUrl: './adobobox.component.css'
})
export class AdoboboxComponent {
  @Input({ required: true }) title = '';
  @Input() color = '#eee5ff';
  @Input() theme: 'light' | 'dark' = 'light';
  @Input() emptyMessage = 'More Adobos are on the way. Check back soon!';
  @Input() adobos: readonly Adobo[] = [];
}