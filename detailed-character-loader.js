(() => {
  'use strict';

  const detailed = {
    'ricky.png': 'assets/characters/ricky-detailed.webp',
    'bubbles.png': 'assets/characters/bubbles-detailed.webp',
    'julian.png': 'assets/characters/julian-detailed.webp'
  };

  const descriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
  if (!descriptor?.get || !descriptor?.set) return;

  Object.defineProperty(HTMLImageElement.prototype, 'src', {
    configurable: descriptor.configurable,
    enumerable: descriptor.enumerable,
    get: descriptor.get,
    set(value) {
      const source = String(value || '');
      const fileName = source.split('#')[0].split('?')[0].split('/').pop();
      if (detailed[fileName]) value = detailed[fileName];
      descriptor.set.call(this, value);
    }
  });
})();
