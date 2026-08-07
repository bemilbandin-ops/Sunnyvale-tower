(() => {
  'use strict';

  const toon = window.__SUNNYVALE_TOON_MODELS__;
  if (!toon?.drawCharacter) {
    console.error('Gameplay character renderer: toon models are unavailable.');
    return;
  }

  const CHARACTER_FILES = new Set([
    'ricky.png', 'ricky.svg', 'ricky-detailed.webp',
    'bubbles.png', 'bubbles.svg', 'bubbles-detailed.webp',
    'julian.png', 'julian.svg', 'julian-detailed.webp'
  ]);
  const PLATFORM_FILES = new Set(['scrap_platform.svg', 'workshop_platform.svg']);
  const VEHICLE_FILES = new Set(['shitmobile.png', 'shitmobile_damaged.png', 'shitmobile_upgraded.png']);

  const fileNameOf = image => {
    const tagged = image?.__toonAsset;
    if (tagged) return tagged;
    const source = String(image?.currentSrc || image?.src || '');
    if (!source || source.startsWith('data:')) return '';
    try {
      return new URL(source, location.href).pathname.split('/').pop() || '';
    } catch {
      return source.split('#')[0].split('?')[0].split('/').pop() || '';
    }
  };

  const selectedCharacter = () => {
    const name = document.getElementById('driver-name')?.textContent?.trim().toLowerCase();
    return ['ricky', 'bubbles', 'julian'].includes(name) ? name : 'ricky';
  };

  const visibleLayerCount = () => {
    const value = document.getElementById('layer-count')?.textContent || '2';
    const count = Number.parseInt(value, 10);
    return Number.isFinite(count) ? Math.max(1, count) : 2;
  };

  let platformDraws = 0;
  let vehicleDrawn = false;
  let riderDrawn = false;

  const resetFrame = () => {
    platformDraws = 0;
    vehicleDrawn = false;
    riderDrawn = false;
  };

  const drawRider = (ctx, footX, footY) => {
    if (riderDrawn) return;
    const kind = selectedCharacter();
    const width = kind === 'bubbles' ? 102 : 108;
    const height = kind === 'bubbles' ? 143 : 152;
    const bob = Math.sin(performance.now() * 0.0045) * 1.5;

    ctx.save();
    ctx.translate(footX - width / 2, footY - height + bob);
    toon.drawCharacter(ctx, kind, width, height);
    ctx.restore();
    riderDrawn = true;
  };

  const previousDrawImage = CanvasRenderingContext2D.prototype.drawImage;

  CanvasRenderingContext2D.prototype.drawImage = function visibleGameplayCharacters(image, ...args) {
    if (args.length !== 4 || this.canvas?.id !== 'canvas') {
      return previousDrawImage.call(this, image, ...args);
    }

    const [x, y, w, h] = args;
    const file = fileNameOf(image);
    const taggedKind = image?.__toonKind;

    if (file === 'far.png') resetFrame();

    // The old game drew a tiny portrait behind the car body. Suppress that hidden
    // draw and render the selected character as a full-body gameplay model instead.
    if ((taggedKind || CHARACTER_FILES.has(file)) && w <= 120 && h <= 180) return;

    if (VEHICLE_FILES.has(file)) {
      const result = previousDrawImage.call(this, image, ...args);
      vehicleDrawn = true;
      if (visibleLayerCount() === 1) {
        drawRider(this, x + w * 0.47, y + h * 0.39);
      }
      return result;
    }

    if (PLATFORM_FILES.has(file)) {
      const result = previousDrawImage.call(this, image, ...args);
      platformDraws += 1;
      const layers = visibleLayerCount();
      const expectedPlatforms = Math.max(1, vehicleDrawn ? layers - 1 : layers);
      if (platformDraws === expectedPlatforms) {
        drawRider(this, x + w * 0.34, y + h * 0.27);
      }
      return result;
    }

    return previousDrawImage.call(this, image, ...args);
  };

  window.__SUNNYVALE_VISIBLE_GAMEPLAY_CHARACTERS__ = {
    version: '1.0.0',
    selectedCharacter,
    visibleLayerCount
  };
})();
