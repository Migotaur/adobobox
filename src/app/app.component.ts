import { afterNextRender, Component, DestroyRef, ElementRef, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'adobobox';
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    // Browser-only: preserve the server markup until hydration has finished.
    afterNextRender(() => {
      const root = this.host.nativeElement;
      const layer = root.querySelector<HTMLElement>('.paper-doodles');
      const content = root.querySelector<HTMLElement>('.page-content');
      if (!layer || !content) return;

      const doodles = Array.from(layer.querySelectorAll<HTMLElement>('.doodle'));
      // Keep the same random choices when resizing, but generate fresh ones per load.
      const choices = doodles.map(() => Array.from({ length: 250 }, () => ({
        x: Math.random(), y: Math.random(), angle: Math.random() * 60 - 30
      })));
      const entered = new WeakSet<HTMLElement>();
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      const place = () => {
        const bounds = layer.getBoundingClientRect();
        if (!bounds.width || !bounds.height) return;
        const area = content.getBoundingClientRect();
        if (area.width && area.height) {
          // Only the decorative layer fades; foreground content keeps its colors.
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${bounds.width}" height="${bounds.height}" viewBox="0 0 ${bounds.width} ${bounds.height}">
            <defs>
              <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="16"/></filter>
              <mask id="fade" maskUnits="userSpaceOnUse" x="0" y="0" width="${bounds.width}" height="${bounds.height}">
                <rect width="100%" height="100%" fill="white"/>
                <rect x="${area.left - bounds.left - 24}" y="${area.top - bounds.top - 24}" width="${area.width + 48}" height="${area.height + 48}" rx="24" fill="black" fill-opacity="0.88" filter="url(#soft)"/>
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="white" mask="url(#fade)"/>
          </svg>`;
          const image = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
          layer.style.setProperty('mask-image', image);
          layer.style.setProperty('-webkit-mask-image', image);
        } else {
          layer.style.removeProperty('mask-image');
          layer.style.removeProperty('-webkit-mask-image');
        }
        const occupied: { x: number; y: number; size: number }[] = [];
        doodles.forEach((doodle, index) => {
          const size = doodle.offsetWidth;
          // A square large enough to contain the artwork at any rotation.
          const footprint = size * Math.SQRT2;
          doodle.style.visibility = 'hidden';
          if (bounds.width < footprint || bounds.height < footprint) return;
          for (const choice of choices[index]) {
            const x = choice.x * (bounds.width - footprint);
            const y = choice.y * (bounds.height - footprint);
            const hitsDoodle = occupied.some(other =>
              x < other.x + other.size + 12 && x + footprint + 12 > other.x &&
              y < other.y + other.size + 12 && y + footprint + 12 > other.y);
            if (hitsDoodle) continue;
            doodle.style.left = `${x + (footprint - size) / 2}px`;
            doodle.style.top = `${y + (footprint - size) / 2}px`;
            doodle.style.setProperty('--angle', `${choice.angle}deg`);
            doodle.style.visibility = 'visible';
            if (!entered.has(doodle)) {
              entered.add(doodle);
              if (!reducedMotion.matches) {
                // Drift in from alternating directions, then settle at the CSS rotation.
                const horizontal = (index % 2 === 0 ? -1 : 1) * (100 + size);
                const vertical = (index % 3 === 0 ? -1 : 1) * 90;
                doodle.animate([
                  {
                    transform: `translate(${horizontal}px, ${vertical}px) rotate(${choice.angle - 25}deg) scale(0.85)`,
                    opacity: 0
                  },
                  { transform: `translate(0, 0) rotate(${choice.angle}deg) scale(1)`, opacity: 1 }
                ], {
                  duration: 750,
                  delay: index * 35,
                  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                  fill: 'backwards'
                });
              }
            }
            occupied.push({ x, y, size: footprint });
            break;
          }
        });
      };
      const observer = new ResizeObserver(place);
      observer.observe(layer);
      observer.observe(content);
      const stopMotion = () => {
        if (reducedMotion.matches) doodles.forEach(doodle =>
          doodle.getAnimations().forEach(animation => animation.cancel()));
      };
      reducedMotion.addEventListener('change', stopMotion);
      this.destroyRef.onDestroy(() => {
        observer.disconnect();
        reducedMotion.removeEventListener('change', stopMotion);
        doodles.forEach(doodle => doodle.getAnimations().forEach(animation => animation.cancel()));
      });
      place();
    });
  }
}