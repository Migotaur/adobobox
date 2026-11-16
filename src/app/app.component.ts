import { afterNextRender, Component, DestroyRef, ElementRef, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Adobo, AdoboboxComponent } from './adobobox/adobobox.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AdoboboxComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'adobobox';
  // Stable markup for hydration; the browser chooses how many fit the visible area.
  readonly backgroundDoodles = Array.from({ length: 160 }, (_, index) => [
    'doodle-sun-one', 'doodle-roll-one', 'doodle-coffee', 'doodle-spark-one',
    'doodle-leaf', 'doodle-rice-one', 'doodle-planet', 'doodle-cloud',
    'doodle-spark-two', 'doodle-roll-three', 'doodle-sun-two', 'doodle-spark-three'
  ][index % 12]);
  readonly awesomeWebsites: readonly Adobo[] = [
    { name: 'Neal.fun', icon: 'play', description: 'Playful games and little web experiments.', url: 'https://neal.fun/' },
    { name: 'Radio Garden', icon: 'radio', description: 'Spin the globe and tune into live radio.', url: 'https://radio.garden/' },
    { name: 'WindowSwap', icon: 'window', description: 'A little change of scenery, one window at a time.', url: 'https://www.window-swap.com/' }
  ];
  readonly educationAdobos: readonly Adobo[] = [
    { name: 'Word Search Generator', icon: 'book', description: 'Turn your word list into a printable puzzle.' },
    { name: 'Flashcard Maker', icon: 'book', description: 'Make a quick study deck for any subject.' },
    { name: 'Color by Code', icon: 'book', description: 'Create a colorful learning activity.' }
  ];
  readonly healthAdobos: readonly Adobo[] = [
    { name: 'Breathing Timer', icon: 'heart', description: 'Set aside a moment to slow down.' },
    { name: 'Water Tracker', icon: 'heart', description: 'Keep a simple log of your daily drinks.' },
    { name: 'Stretch Break', icon: 'heart', description: 'A gentle reminder to pause and move.' }
  ];
  readonly everydayAdobos: readonly Adobo[] = [
    { name: 'Unit Converter', icon: 'tools', description: 'Swap between everyday measurements.' },
    { name: 'QR Code Generator', icon: 'tools', description: 'Turn a link into a scannable code.' },
    { name: 'Focus Timer', icon: 'tools', description: 'Make room for a focused work session.' }
  ];
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
        // Browser zoom-out increases CSS viewport area, revealing extra artwork.
        const visibleCount = Math.min(doodles.length, Math.max(12, Math.ceil(bounds.width * bounds.height / 24000)));
        const occupied: { x: number; y: number; size: number }[] = [];
        doodles.forEach((doodle, index) => {
          doodle.style.visibility = 'hidden';
          if (index >= visibleCount) return;
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
                  delay: Math.min(index * 25, 600),
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