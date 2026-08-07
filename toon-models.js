(() => {
  'use strict';

  const CHARACTER_FILES = {
    ricky: ['ricky.png', 'ricky.svg', 'ricky-detailed.webp'],
    bubbles: ['bubbles.png', 'bubbles.svg', 'bubbles-detailed.webp'],
    julian: ['julian.png', 'julian.svg', 'julian-detailed.webp']
  };

  const VEHICLE_FILES = new Set([
    'shitmobile.png',
    'shitmobile_damaged.png',
    'shitmobile_upgraded.png'
  ]);

  const SHRINK = {
    'scrap_platform.svg': { scale: .88, anchor: 'bottom' },
    'workshop_platform.svg': { scale: .88, anchor: 'bottom' },
    'emergency_axle.svg': { scale: .86, anchor: 'bottom' },
    'chainsaw.svg': { scale: .84, anchor: 'right-bottom' },
    'nailgun.svg': { scale: .82, anchor: 'right-bottom' },
    'rocket.svg': { scale: .82, anchor: 'right-bottom' },
    'flamer.svg': { scale: .82, anchor: 'right-bottom' },
    'boomerang.svg': { scale: .82, anchor: 'right-bottom' },
    'drunk_runner.png': { scale: .74, anchor: 'bottom' },
    'bottle_punk.png': { scale: .74, anchor: 'bottom' },
    'scrap_bruiser.png': { scale: .74, anchor: 'bottom' },
    'raccoon_swarm.png': { scale: .70, anchor: 'bottom' },
    'seizure_agent.png': { scale: .72, anchor: 'bottom' }
  };

  const PALETTE = {
    ink: '#211713',
    inkSoft: '#3a2a22',
    highlight: '#fff1d1',
    skinLight: '#ffc0a0',
    skinMid: '#e98d6e',
    skinShadow: '#bd604f',
    hairBrown: '#6f3c22',
    hairDark: '#241d1b',
    gold: '#d6a93a',
    glass: 'rgba(176, 222, 226, .42)',
    denim: '#30455b',
    denimDark: '#1f3040',
    black: '#18191c',
    blackLift: '#31343a',
    cream: '#eee7d6',
    rust: '#a64d31',
    rustDark: '#6f2f25',
    metal: '#637278',
    metalDark: '#38454a',
    window: 'rgba(147, 205, 216, .38)',
    rubber: '#1b1b1d'
  };

  const fileNameOf = source => {
    const text = String(source || '');
    if (!text || text.startsWith('data:')) return '';
    try {
      return new URL(text, location.href).pathname.split('/').pop() || '';
    } catch {
      return text.split('#')[0].split('?')[0].split('/').pop() || '';
    }
  };

  const characterKindFor = source => {
    const file = fileNameOf(source);
    return Object.keys(CHARACTER_FILES).find(kind => CHARACTER_FILES[kind].includes(file)) || '';
  };

  const roundedPath = (ctx, x, y, w, h, r) => {
    const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  };

  const fillStroke = (ctx, fill, stroke = PALETTE.ink, width = 4) => {
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke && width > 0) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  };

  const line = (ctx, points, color = PALETTE.ink, width = 4) => {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const ellipse = (ctx, x, y, rx, ry, fill, stroke = PALETTE.ink, width = 4, rotation = 0) => {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
    fillStroke(ctx, fill, stroke, width);
  };

  const gradient = (ctx, x0, y0, x1, y1, stops) => {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    stops.forEach(([offset, color]) => g.addColorStop(offset, color));
    return g;
  };

  const drawGroundShadow = (ctx, x, y, rx, ry) => {
    const g = ctx.createRadialGradient(x, y, 4, x, y, rx);
    g.addColorStop(0, 'rgba(24,16,12,.30)');
    g.addColorStop(.7, 'rgba(24,16,12,.17)');
    g.addColorStop(1, 'rgba(24,16,12,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawHatching = (ctx, x, y, w, h, spacing = 12, alpha = .12, direction = 1) => {
    ctx.save();
    roundedPath(ctx, x, y, w, h, 12);
    ctx.clip();
    ctx.strokeStyle = `rgba(32,22,17,${alpha})`;
    ctx.lineWidth = 1.5;
    for (let i = -h; i < w + h; i += spacing) {
      ctx.beginPath();
      if (direction > 0) {
        ctx.moveTo(x + i, y + h);
        ctx.lineTo(x + i + h, y);
      } else {
        ctx.moveTo(x + i, y);
        ctx.lineTo(x + i + h, y + h);
      }
      ctx.stroke();
    }
    ctx.restore();
  };

  const drawSkinLimb = (ctx, x1, y1, x2, y2, width, bend = 0) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len * width * .5;
    const ny = dx / len * width * .5;
    const cx = (x1 + x2) / 2 + nx * bend;
    const cy = (y1 + y2) / 2 + ny * bend;
    const skin = gradient(ctx, x1, y1, x2, y2, [
      [0, PALETTE.skinLight],
      [.55, PALETTE.skinMid],
      [1, PALETTE.skinShadow]
    ]);
    ctx.beginPath();
    ctx.moveTo(x1 + nx, y1 + ny);
    ctx.quadraticCurveTo(cx + nx, cy + ny, x2 + nx * .65, y2 + ny * .65);
    ctx.quadraticCurveTo(x2, y2 + width * .2, x2 - nx * .65, y2 - ny * .65);
    ctx.quadraticCurveTo(cx - nx, cy - ny, x1 - nx, y1 - ny);
    ctx.closePath();
    fillStroke(ctx, skin, PALETTE.ink, 4.5);
  };

  const drawHand = (ctx, x, y, r, rotation = 0) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    const skin = gradient(ctx, -r, -r, r, r, [[0, PALETTE.skinLight], [1, PALETTE.skinMid]]);
    ellipse(ctx, 0, 0, r * .78, r, skin, PALETTE.ink, 4);
    ctx.strokeStyle = 'rgba(79,38,31,.45)';
    ctx.lineWidth = 1.8;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(-r * .25 + i * r * .18, -r * .6);
      ctx.quadraticCurveTo(-r * .1 + i * r * .16, 0, -r * .18 + i * r * .15, r * .52);
      ctx.stroke();
    }
    ctx.restore();
  };

  const drawShoe = (ctx, x, y, w, h, color, facing = 1) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(facing, 1);
    const shoe = gradient(ctx, 0, 0, 0, h, [[0, color], [1, '#111215']]);
    ctx.beginPath();
    ctx.moveTo(-w * .45, -h * .35);
    ctx.quadraticCurveTo(-w * .18, -h * .72, w * .14, -h * .46);
    ctx.quadraticCurveTo(w * .5, -h * .25, w * .58, h * .1);
    ctx.quadraticCurveTo(w * .48, h * .42, -w * .48, h * .37);
    ctx.closePath();
    fillStroke(ctx, shoe, PALETTE.ink, 4.5);
    line(ctx, [[-w * .35, h * .08], [w * .45, h * .11]], '#e8e4d9', 2.3);
    line(ctx, [[-w * .10, -h * .34], [w * .23, -h * .17]], '#787a7c', 2);
    line(ctx, [[-w * .01, -h * .43], [w * .31, -h * .25]], '#787a7c', 2);
    ctx.restore();
  };

  const drawFaceBase = (ctx, x, y, rx, ry) => {
    const skin = gradient(ctx, x - rx, y - ry, x + rx, y + ry, [
      [0, PALETTE.skinLight],
      [.58, PALETTE.skinMid],
      [1, PALETTE.skinShadow]
    ]);
    ctx.beginPath();
    ctx.moveTo(x - rx * .76, y - ry * .64);
    ctx.bezierCurveTo(x - rx * 1.02, y - ry * .12, x - rx * .75, y + ry * .72, x - rx * .08, y + ry * .95);
    ctx.bezierCurveTo(x + rx * .62, y + ry * .87, x + rx * .94, y + ry * .18, x + rx * .78, y - ry * .62);
    ctx.bezierCurveTo(x + rx * .25, y - ry * 1.02, x - rx * .25, y - ry * 1.03, x - rx * .76, y - ry * .64);
    ctx.closePath();
    fillStroke(ctx, skin, PALETTE.ink, 5);
    return skin;
  };

  const drawEye = (ctx, x, y, scale = 1, look = 0) => {
    ellipse(ctx, x, y, 10 * scale, 7 * scale, '#f8f4e9', PALETTE.inkSoft, 2.2);
    ellipse(ctx, x + look * 3 * scale, y, 3.3 * scale, 4.4 * scale, '#303134', null, 0);
    ellipse(ctx, x + look * 3 * scale - 1.2 * scale, y - 1.4 * scale, 1 * scale, 1.2 * scale, '#fff', null, 0);
  };

  const drawRicky = ctx => {
    drawGroundShadow(ctx, 150, 404, 92, 17);
    const pants = gradient(ctx, 0, 225, 0, 390, [[0, '#25262a'], [1, '#111215']]);
    ctx.beginPath();
    ctx.moveTo(82, 226); ctx.lineTo(145, 221); ctx.lineTo(147, 373); ctx.lineTo(83, 374); ctx.closePath();
    fillStroke(ctx, pants, PALETTE.ink, 5);
    ctx.beginPath();
    ctx.moveTo(145, 221); ctx.lineTo(208, 228); ctx.lineTo(214, 371); ctx.lineTo(148, 374); ctx.closePath();
    fillStroke(ctx, pants, PALETTE.ink, 5);
    [96, 107, 174, 185].forEach(x => line(ctx, [[x, 238], [x + (x > 145 ? 7 : -5), 367]], '#eee9dd', 4.1));
    drawHatching(ctx, 85, 235, 122, 130, 15, .08, -1);
    drawShoe(ctx, 111, 384, 72, 31, '#16171a', 1);
    drawShoe(ctx, 181, 383, 75, 31, '#16171a', 1);
    drawSkinLimb(ctx, 78, 172, 55, 283, 34, .18);
    drawSkinLimb(ctx, 218, 173, 240, 276, 34, -.18);
    drawHand(ctx, 51, 291, 19, -.2);
    drawHand(ctx, 244, 286, 19, .18);
    const shirt = gradient(ctx, 0, 135, 0, 251, [[0, '#fffdf5'], [.52, '#e8e5dc'], [1, '#c8c7c2']]);
    ctx.beginPath();
    ctx.moveTo(81, 143);
    ctx.quadraticCurveTo(107, 126, 132, 130);
    ctx.lineTo(149, 151);
    ctx.lineTo(168, 129);
    ctx.quadraticCurveTo(197, 130, 221, 149);
    ctx.lineTo(210, 235);
    ctx.quadraticCurveTo(175, 253, 145, 244);
    ctx.quadraticCurveTo(112, 254, 79, 235);
    ctx.closePath();
    fillStroke(ctx, shirt, PALETTE.ink, 5.2);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(84, 148); ctx.quadraticCurveTo(112, 132, 135, 137); ctx.lineTo(148, 156);
    ctx.lineTo(167, 136); ctx.quadraticCurveTo(194, 136, 216, 151); ctx.lineTo(205, 231);
    ctx.quadraticCurveTo(174, 246, 145, 239); ctx.quadraticCurveTo(114, 248, 84, 231); ctx.closePath();
    ctx.clip();
    for (let y = 146; y < 242; y += 22) {
      for (let x = 82; x < 220; x += 24) {
        const offset = ((y / 22) % 2) * 12;
        const px = x + offset;
        ctx.fillStyle = '#171719';
        ctx.beginPath();
        ctx.moveTo(px, y + 2);
        ctx.lineTo(px + 8, y - 5);
        ctx.lineTo(px + 15, y + 3);
        ctx.lineTo(px + 8, y + 10);
        ctx.lineTo(px + 18, y + 18);
        ctx.lineTo(px + 7, y + 18);
        ctx.lineTo(px, y + 11);
        ctx.lineTo(px - 7, y + 18);
        ctx.lineTo(px - 7, y + 7);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
    line(ctx, [[148, 157], [148, 239]], '#4e463f', 2.4);
    ctx.beginPath();
    ctx.moveTo(118, 135); ctx.lineTo(146, 160); ctx.lineTo(131, 176); ctx.lineTo(105, 145); ctx.closePath();
    fillStroke(ctx, '#e5e1d6', PALETTE.ink, 3.2);
    ctx.beginPath();
    ctx.moveTo(178, 135); ctx.lineTo(150, 160); ctx.lineTo(166, 176); ctx.lineTo(193, 145); ctx.closePath();
    fillStroke(ctx, '#e5e1d6', PALETTE.ink, 3.2);
    roundedPath(ctx, 126, 119, 46, 42, 16);
    fillStroke(ctx, gradient(ctx, 126, 119, 172, 161, [[0, PALETTE.skinLight], [1, PALETTE.skinShadow]]), PALETTE.ink, 4);
    ctx.strokeStyle = PALETTE.gold; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(149, 147, 23, .18, Math.PI - .18); ctx.stroke();
    ctx.strokeStyle = '#7e5720'; ctx.lineWidth = 1.5; ctx.stroke();
    drawFaceBase(ctx, 149, 89, 56, 64);
    ctx.beginPath();
    ctx.moveTo(94, 84); ctx.bezierCurveTo(82, 59, 90, 30, 116, 20);
    ctx.bezierCurveTo(134, 3, 178, 5, 202, 22);
    ctx.bezierCurveTo(220, 38, 216, 66, 199, 78);
    ctx.bezierCurveTo(185, 54, 169, 44, 149, 45);
    ctx.bezierCurveTo(126, 47, 110, 59, 94, 84);
    ctx.closePath();
    fillStroke(ctx, gradient(ctx, 92, 10, 205, 80, [[0, '#3d2419'], [.45, '#7f4829'], [1, '#3c241b']]), PALETTE.ink, 5.5);
    ctx.beginPath();
    ctx.moveTo(96, 83); ctx.lineTo(113, 74); ctx.lineTo(119, 140); ctx.lineTo(99, 132); ctx.closePath();
    fillStroke(ctx, PALETTE.hairBrown, PALETTE.ink, 4.2);
    ctx.beginPath();
    ctx.moveTo(201, 79); ctx.lineTo(185, 72); ctx.lineTo(178, 139); ctx.lineTo(198, 130); ctx.closePath();
    fillStroke(ctx, PALETTE.hairBrown, PALETTE.ink, 4.2);
    ['M108 42 C124 24 147 21 166 30', 'M121 57 C144 42 173 43 194 55', 'M145 18 C163 16 187 25 198 39'].forEach(path => {
      const p = new Path2D(path); ctx.strokeStyle = 'rgba(255,190,112,.32)'; ctx.lineWidth = 3; ctx.stroke(p);
    });
    const lens = gradient(ctx, 100, 76, 190, 108, [[0, '#756017'], [.45, '#171916'], [1, '#6e5a18']]);
    roundedPath(ctx, 98, 75, 48, 31, 11); fillStroke(ctx, lens, '#a87d23', 4.5);
    roundedPath(ctx, 153, 75, 48, 31, 11); fillStroke(ctx, lens, '#a87d23', 4.5);
    line(ctx, [[146, 86], [153, 86]], '#a87d23', 4);
    line(ctx, [[98, 83], [85, 79]], '#a87d23', 3.5);
    line(ctx, [[201, 83], [211, 78]], '#a87d23', 3.5);
    line(ctx, [[107, 80], [128, 98]], 'rgba(255,255,226,.38)', 2);
    line(ctx, [[161, 80], [180, 97]], 'rgba(255,255,226,.32)', 2);
    line(ctx, [[149, 94], [145, 112], [153, 115]], '#8a4a3e', 2.4);
    ctx.beginPath();
    ctx.moveTo(119, 121); ctx.quadraticCurveTo(137, 108, 149, 121); ctx.quadraticCurveTo(163, 108, 181, 121);
    ctx.quadraticCurveTo(164, 132, 149, 128); ctx.quadraticCurveTo(134, 133, 119, 121); ctx.closePath();
    fillStroke(ctx, '#5b2f22', PALETTE.ink, 2.5);
    ctx.beginPath();
    ctx.moveTo(132, 132); ctx.quadraticCurveTo(149, 141, 166, 132); ctx.lineTo(161, 153); ctx.quadraticCurveTo(149, 162, 136, 153); ctx.closePath();
    fillStroke(ctx, '#5b2f22', PALETTE.ink, 2.5);
    line(ctx, [[171, 126], [212, 143]], '#f4ecdd', 5.5);
    line(ctx, [[207, 141], [216, 145]], '#d95b2f', 5.5);
    ellipse(ctx, 218, 146, 3.6, 3.6, '#ff9b42', null, 0);
    line(ctx, [[98, 184], [111, 219]], 'rgba(39,25,20,.25)', 2);
    line(ctx, [[198, 180], [186, 220]], 'rgba(39,25,20,.25)', 2);
    for (let i = 0; i < 4; i++) {
      line(ctx, [[55 + i * 4, 232 + i * 6], [65 + i * 3, 227 + i * 6]], 'rgba(64,34,29,.42)', 1.4);
      line(ctx, [[224 + i * 4, 226 + i * 6], [234 + i * 3, 232 + i * 6]], 'rgba(64,34,29,.42)', 1.4);
    }
  };

  const drawJulian = ctx => {
    drawGroundShadow(ctx, 150, 405, 91, 17);
    const denim = gradient(ctx, 0, 218, 0, 388, [[0, '#3d5268'], [1, '#233648']]);
    ctx.beginPath(); ctx.moveTo(91, 218); ctx.lineTo(147, 217); ctx.lineTo(143, 374); ctx.lineTo(84, 375); ctx.closePath();
    fillStroke(ctx, denim, PALETTE.ink, 5);
    ctx.beginPath(); ctx.moveTo(147, 217); ctx.lineTo(205, 221); ctx.lineTo(217, 373); ctx.lineTo(148, 375); ctx.closePath();
    fillStroke(ctx, denim, PALETTE.ink, 5);
    line(ctx, [[146, 224], [148, 368]], '#182534', 2.4);
    line(ctx, [[97, 240], [105, 363]], 'rgba(183,207,223,.16)', 2);
    line(ctx, [[192, 241], [204, 364]], 'rgba(183,207,223,.16)', 2);
    drawHatching(ctx, 86, 232, 126, 135, 16, .08, 1);
    drawShoe(ctx, 112, 385, 74, 32, '#584735', 1);
    drawShoe(ctx, 184, 384, 76, 32, '#584735', 1);
    drawSkinLimb(ctx, 91, 159, 67, 276, 38, .28);
    drawSkinLimb(ctx, 207, 158, 232, 260, 39, -.28);
    drawHand(ctx, 64, 287, 20, -.08);
    drawSkinLimb(ctx, 230, 257, 246, 290, 27, -.05);
    drawHand(ctx, 245, 295, 17, .2);
    roundedPath(ctx, 228, 278, 39, 56, 7);
    fillStroke(ctx, gradient(ctx, 228, 278, 267, 334, [[0, 'rgba(230,247,250,.65)'], [1, 'rgba(116,169,182,.38)']]), PALETTE.ink, 3.2);
    ctx.fillStyle = '#6d3c23'; ctx.fillRect(232, 297, 31, 32);
    ctx.strokeStyle = 'rgba(255,220,155,.65)'; ctx.lineWidth = 2; ctx.strokeRect(233, 298, 29, 29);
    line(ctx, [[250, 282], [245, 258], [255, 250]], '#dad0bc', 3);
    ellipse(ctx, 242, 307, 5, 4, 'rgba(226,190,130,.5)', null, 0);
    const tee = gradient(ctx, 0, 128, 0, 243, [[0, '#303238'], [.48, '#17191c'], [1, '#0d0f11']]);
    ctx.beginPath();
    ctx.moveTo(92, 143);
    ctx.quadraticCurveTo(115, 125, 137, 128);
    ctx.lineTo(151, 142);
    ctx.lineTo(166, 128);
    ctx.quadraticCurveTo(190, 128, 211, 144);
    ctx.quadraticCurveTo(219, 176, 211, 222);
    ctx.quadraticCurveTo(184, 240, 151, 235);
    ctx.quadraticCurveTo(116, 242, 88, 222);
    ctx.quadraticCurveTo(81, 177, 92, 143);
    ctx.closePath();
    fillStroke(ctx, tee, PALETTE.ink, 5.2);
    ctx.fillStyle = 'rgba(255,255,255,.08)';
    ctx.beginPath(); ctx.ellipse(125, 162, 34, 21, -.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(176, 163, 34, 21, .2, 0, Math.PI * 2); ctx.fill();
    line(ctx, [[104, 192], [117, 226]], 'rgba(255,255,255,.09)', 2);
    line(ctx, [[196, 190], [183, 226]], 'rgba(255,255,255,.09)', 2);
    roundedPath(ctx, 86, 221, 130, 17, 5); fillStroke(ctx, '#171718', PALETTE.ink, 3.5);
    roundedPath(ctx, 138, 217, 28, 25, 4); fillStroke(ctx, '#66605a', PALETTE.ink, 3.3);
    roundedPath(ctx, 144, 222, 16, 14, 2); fillStroke(ctx, '#201f1e', '#aaa69d', 2);
    roundedPath(ctx, 127, 115, 47, 43, 16);
    fillStroke(ctx, gradient(ctx, 127, 115, 174, 158, [[0, PALETTE.skinLight], [1, PALETTE.skinShadow]]), PALETTE.ink, 4);
    drawFaceBase(ctx, 151, 86, 54, 62);
    ctx.beginPath();
    ctx.moveTo(96, 83); ctx.bezierCurveTo(89, 52, 106, 22, 132, 17);
    ctx.bezierCurveTo(156, 4, 194, 17, 207, 42);
    ctx.bezierCurveTo(217, 60, 208, 82, 198, 95);
    ctx.lineTo(187, 68); ctx.bezierCurveTo(163, 49, 134, 51, 105, 71); ctx.closePath();
    fillStroke(ctx, gradient(ctx, 96, 12, 208, 96, [[0, '#151719'], [.5, '#352c29'], [1, '#161719']]), PALETTE.ink, 5);
    line(ctx, [[105, 42], [93, 60], [97, 77]], '#4a3b35', 3);
    line(ctx, [[126, 24], [114, 51], [119, 63]], '#4a3b35', 3);
    line(ctx, [[180, 25], [194, 49], [197, 69]], '#4a3b35', 3);
    line(ctx, [[201, 48], [211, 67], [204, 84]], '#4a3b35', 3);
    line(ctx, [[116, 78], [139, 73]], PALETTE.ink, 4.2);
    line(ctx, [[161, 73], [185, 79]], PALETTE.ink, 4.2);
    drawEye(ctx, 128, 84, .86, .25);
    drawEye(ctx, 173, 84, .86, -.05);
    line(ctx, [[151, 87], [147, 108], [156, 110]], '#8b4a3d', 2.5);
    ctx.beginPath();
    ctx.moveTo(105, 111); ctx.quadraticCurveTo(119, 101, 135, 110); ctx.quadraticCurveTo(151, 102, 167, 110);
    ctx.quadraticCurveTo(183, 101, 197, 112); ctx.lineTo(190, 139);
    ctx.quadraticCurveTo(172, 160, 151, 158); ctx.quadraticCurveTo(129, 160, 110, 139); ctx.closePath();
    fillStroke(ctx, '#2a211e', PALETTE.ink, 3.4);
    ctx.fillStyle = PALETTE.skinMid; ctx.beginPath(); ctx.ellipse(151, 124, 17, 7, 0, 0, Math.PI * 2); ctx.fill();
    line(ctx, [[122, 119], [140, 125]], '#4a3a34', 2.1);
    line(ctx, [[180, 119], [162, 125]], '#4a3a34', 2.1);
    line(ctx, [[132, 142], [151, 150], [171, 141]], '#57413a', 2.2);
    for (let i = 0; i < 5; i++) {
      line(ctx, [[69 + i * 4, 218 + i * 7], [79 + i * 3, 213 + i * 7]], 'rgba(55,31,27,.45)', 1.5);
      line(ctx, [[213 + i * 4, 207 + i * 7], [224 + i * 3, 213 + i * 7]], 'rgba(55,31,27,.45)', 1.5);
    }
  };

  const drawBubbles = ctx => {
    drawGroundShadow(ctx, 150, 406, 78, 15);
    const pants = gradient(ctx, 0, 231, 0, 389, [[0, '#5b4841'], [1, '#382f2e']]);
    ctx.beginPath(); ctx.moveTo(92, 232); ctx.lineTo(145, 229); ctx.lineTo(140, 374); ctx.lineTo(86, 375); ctx.closePath();
    fillStroke(ctx, pants, PALETTE.ink, 4.7);
    ctx.beginPath(); ctx.moveTo(145, 229); ctx.lineTo(201, 233); ctx.lineTo(210, 373); ctx.lineTo(143, 375); ctx.closePath();
    fillStroke(ctx, pants, PALETTE.ink, 4.7);
    drawHatching(ctx, 88, 240, 116, 128, 16, .08, -1);
    drawShoe(ctx, 112, 385, 63, 27, '#2b2725', 1);
    drawShoe(ctx, 178, 385, 65, 27, '#2b2725', 1);
    const shirtBase = gradient(ctx, 0, 143, 0, 250, [[0, '#9c686b'], [.48, '#76505c'], [1, '#553e48']]);
    ctx.beginPath();
    ctx.moveTo(97, 143); ctx.quadraticCurveTo(122, 128, 143, 132); ctx.lineTo(151, 145);
    ctx.lineTo(161, 132); ctx.quadraticCurveTo(187, 131, 207, 147); ctx.lineTo(205, 235);
    ctx.quadraticCurveTo(175, 251, 149, 243); ctx.quadraticCurveTo(119, 250, 94, 235); ctx.closePath();
    fillStroke(ctx, shirtBase, PALETTE.ink, 5);
    roundedPath(ctx, 79, 150, 36, 91, 15); fillStroke(ctx, shirtBase, PALETTE.ink, 4.3);
    roundedPath(ctx, 192, 151, 34, 89, 15); fillStroke(ctx, shirtBase, PALETTE.ink, 4.3);
    drawSkinLimb(ctx, 97, 232, 89, 294, 25, .08);
    drawSkinLimb(ctx, 209, 231, 215, 292, 25, -.08);
    drawHand(ctx, 88, 301, 15, -.12);
    drawHand(ctx, 216, 300, 15, .12);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(98, 146); ctx.quadraticCurveTo(121, 133, 143, 137); ctx.lineTo(151, 151); ctx.lineTo(161, 137);
    ctx.quadraticCurveTo(184, 136, 202, 150); ctx.lineTo(200, 231); ctx.quadraticCurveTo(174, 244, 150, 238); ctx.quadraticCurveTo(122, 245, 99, 231); ctx.closePath();
    ctx.clip();
    ctx.globalAlpha = .78;
    for (let x = 101; x < 204; x += 21) {
      ctx.fillStyle = x % 42 < 22 ? '#526175' : '#bb7a72';
      ctx.fillRect(x, 137, 8, 108);
      ctx.fillStyle = 'rgba(245,226,203,.34)'; ctx.fillRect(x + 3, 137, 2, 108);
    }
    for (let y = 145; y < 244; y += 19) {
      ctx.fillStyle = y % 38 < 20 ? '#4d5e71' : '#bd8075';
      ctx.fillRect(95, y, 112, 7);
      ctx.fillStyle = 'rgba(245,226,203,.33)'; ctx.fillRect(95, y + 2, 112, 2);
    }
    ctx.restore();
    line(ctx, [[151, 152], [151, 239]], '#3f3135', 2.2);
    roundedPath(ctx, 109, 176, 33, 31, 5); fillStroke(ctx, 'rgba(91,61,67,.48)', PALETTE.inkSoft, 2.3);
    roundedPath(ctx, 161, 176, 33, 31, 5); fillStroke(ctx, 'rgba(91,61,67,.48)', PALETTE.inkSoft, 2.3);
    [166, 188, 210, 231].forEach(y => ellipse(ctx, 151, y, 2.5, 2.5, '#d9c3ad', PALETTE.inkSoft, 1.2));
    roundedPath(ctx, 132, 118, 38, 36, 14);
    fillStroke(ctx, gradient(ctx, 132, 118, 170, 154, [[0, PALETTE.skinLight], [1, PALETTE.skinShadow]]), PALETTE.ink, 3.8);
    drawFaceBase(ctx, 151, 90, 48, 57);
    ctx.beginPath();
    ctx.moveTo(104, 86); ctx.bezierCurveTo(94, 55, 108, 28, 135, 20);
    ctx.bezierCurveTo(162, 11, 190, 25, 199, 50); ctx.lineTo(192, 69);
    ctx.bezierCurveTo(177, 52, 156, 48, 133, 56); ctx.bezierCurveTo(122, 64, 113, 75, 104, 86); ctx.closePath();
    fillStroke(ctx, gradient(ctx, 103, 17, 200, 87, [[0, '#7b5738'], [.52, '#b08455'], [1, '#5c402f']]), PALETTE.ink, 4.6);
    line(ctx, [[122, 34], [151, 27], [176, 37]], 'rgba(255,213,146,.35)', 2.8);
    line(ctx, [[129, 55], [157, 42], [185, 49]], 'rgba(255,213,146,.28)', 2.6);
    ctx.beginPath(); ctx.moveTo(106, 83); ctx.lineTo(114, 99); ctx.lineTo(107, 116); ctx.lineTo(99, 105); ctx.closePath();
    fillStroke(ctx, '#8c603d', PALETTE.ink, 3.4);
    drawEye(ctx, 126, 91, .95, .28);
    drawEye(ctx, 175, 91, .95, -.18);
    roundedPath(ctx, 104, 69, 47, 45, 15); fillStroke(ctx, 'rgba(214,239,240,.28)', '#743f3d', 5);
    roundedPath(ctx, 153, 69, 47, 45, 15); fillStroke(ctx, 'rgba(214,239,240,.28)', '#743f3d', 5);
    line(ctx, [[151, 87], [154, 87]], '#743f3d', 4.5);
    line(ctx, [[104, 82], [94, 78]], '#743f3d', 4);
    line(ctx, [[200, 82], [208, 78]], '#743f3d', 4);
    line(ctx, [[111, 75], [124, 88]], 'rgba(255,255,255,.50)', 2.2);
    line(ctx, [[161, 75], [173, 88]], 'rgba(255,255,255,.48)', 2.2);
    line(ctx, [[151, 96], [148, 111], [153, 114]], '#8a4a3d', 2.2);
    line(ctx, [[136, 129], [164, 129]], PALETTE.inkSoft, 2.8);
    line(ctx, [[116, 62], [139, 57]], 'rgba(50,32,26,.35)', 2);
    line(ctx, [[168, 57], [190, 63]], 'rgba(50,32,26,.35)', 2);
  };

  const drawCharacter = (ctx, kind, width, height) => {
    const canonicalW = 300;
    const canonicalH = 420;
    const sx = width / canonicalW;
    const sy = height / canonicalH;
    const scale = Math.min(sx, sy);
    const offsetX = (width - canonicalW * scale) / 2;
    const offsetY = height - canonicalH * scale;
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    if (kind === 'ricky') drawRicky(ctx);
    else if (kind === 'bubbles') drawBubbles(ctx);
    else drawJulian(ctx);
    ctx.restore();
  };

  const drawWheel = (ctx, x, y, r, damaged = false) => {
    const tire = ctx.createRadialGradient(x - r * .22, y - r * .25, r * .2, x, y, r);
    tire.addColorStop(0, '#3c3d40'); tire.addColorStop(.55, '#191a1c'); tire.addColorStop(1, '#090a0b');
    ellipse(ctx, x, y, r, r, tire, PALETTE.ink, 5.5);
    ellipse(ctx, x, y, r * .52, r * .52, gradient(ctx, x - r, y - r, x + r, y + r, [[0, '#9aa0a0'], [1, '#4c5557']]), PALETTE.ink, 3.5);
    ellipse(ctx, x, y, r * .18, r * .18, '#2f3638', PALETTE.ink, 2.3);
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5;
      line(ctx, [[x + Math.cos(a) * r * .20, y + Math.sin(a) * r * .20], [x + Math.cos(a) * r * .45, y + Math.sin(a) * r * .45]], '#d0d1ca', 2.4);
    }
    if (damaged) {
      ctx.strokeStyle = '#d5b56e'; ctx.lineWidth = 3; ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.arc(x, y, r * .78, -.4, 1.2); ctx.stroke(); ctx.setLineDash([]);
    }
  };

  const drawRustPatch = (ctx, x, y, rx, ry, rotation = 0) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rotation);
    const rust = gradient(ctx, -rx, -ry, rx, ry, [[0, '#733323'], [.45, '#b65d36'], [1, '#5d2922']]);
    ctx.beginPath();
    ctx.moveTo(-rx, 0); ctx.bezierCurveTo(-rx * .8, -ry, -rx * .2, -ry * .65, 0, -ry);
    ctx.bezierCurveTo(rx * .5, -ry * .7, rx, -ry * .15, rx * .85, ry * .35);
    ctx.bezierCurveTo(rx * .55, ry, -rx * .2, ry * .65, -rx, 0); ctx.closePath();
    fillStroke(ctx, rust, PALETTE.inkSoft, 2.2);
    line(ctx, [[-rx * .45, -ry * .15], [rx * .48, ry * .20]], 'rgba(255,182,91,.28)', 1.6);
    ctx.restore();
  };

  const drawVehicle = (ctx, width, height, damaged = false, upgraded = false) => {
    const canonicalW = 520;
    const canonicalH = 190;
    const scale = Math.min(width / canonicalW, height / canonicalH);
    const ox = (width - canonicalW * scale) / 2;
    const oy = height - canonicalH * scale;
    ctx.save(); ctx.translate(ox, oy); ctx.scale(scale, scale);
    drawGroundShadow(ctx, 268, 174, 220, 18);
    drawWheel(ctx, 112, 150, 42, damaged);
    drawWheel(ctx, 407, 150, 42, false);
    const body = gradient(ctx, 0, 48, 0, 158, [[0, '#829398'], [.48, '#5f7075'], [1, '#344349']]);
    ctx.beginPath();
    ctx.moveTo(34, 133);
    ctx.lineTo(51, 84);
    ctx.quadraticCurveTo(60, 62, 87, 57);
    ctx.lineTo(198, 45);
    ctx.lineTo(247, 23);
    ctx.quadraticCurveTo(278, 10, 322, 17);
    ctx.lineTo(406, 25);
    ctx.quadraticCurveTo(432, 28, 449, 49);
    ctx.lineTo(482, 85);
    ctx.lineTo(497, 131);
    ctx.quadraticCurveTo(479, 151, 447, 152);
    ctx.lineTo(72, 152);
    ctx.quadraticCurveTo(43, 150, 34, 133);
    ctx.closePath();
    fillStroke(ctx, body, PALETTE.ink, 6.2);
    ctx.beginPath(); ctx.moveTo(50, 86); ctx.lineTo(195, 72); ctx.lineTo(188, 131); ctx.lineTo(38, 133); ctx.closePath();
    fillStroke(ctx, gradient(ctx, 50, 72, 50, 135, [[0, '#7e8e92'], [1, '#45565b']]), PALETTE.inkSoft, 3);
    ctx.beginPath(); ctx.moveTo(354, 53); ctx.lineTo(449, 58); ctx.lineTo(482, 89); ctx.lineTo(477, 132); ctx.lineTo(354, 132); ctx.closePath();
    fillStroke(ctx, gradient(ctx, 354, 53, 354, 135, [[0, '#6f8085'], [1, '#3b4a50']]), PALETTE.inkSoft, 3);
    ctx.beginPath();
    ctx.moveTo(204, 68); ctx.lineTo(253, 31); ctx.lineTo(323, 28); ctx.lineTo(353, 67); ctx.closePath();
    fillStroke(ctx, PALETTE.window, PALETTE.ink, 4.2);
    line(ctx, [[279, 29], [279, 69]], PALETTE.ink, 3.2);
    line(ctx, [[204, 69], [353, 69]], PALETTE.ink, 3.2);
    ctx.save();
    ctx.globalAlpha = .44;
    line(ctx, [[221, 60], [258, 36]], '#e8fbff', 4);
    line(ctx, [[292, 60], [324, 35]], '#e8fbff', 3.2);
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(191, 72); ctx.lineTo(276, 71); ctx.lineTo(276, 133); ctx.lineTo(186, 133); ctx.closePath();
    fillStroke(ctx, 'rgba(66,82,87,.34)', PALETTE.inkSoft, 2.8);
    ctx.beginPath(); ctx.moveTo(278, 71); ctx.lineTo(356, 72); ctx.lineTo(356, 133); ctx.lineTo(278, 133); ctx.closePath();
    fillStroke(ctx, 'rgba(75,92,97,.28)', PALETTE.inkSoft, 2.8);
    roundedPath(ctx, 246, 79, 19, 5, 2); fillStroke(ctx, '#c0b9a5', PALETTE.inkSoft, 1.4);
    roundedPath(ctx, 326, 79, 18, 5, 2); fillStroke(ctx, '#c0b9a5', PALETTE.inkSoft, 1.4);
    const wood = gradient(ctx, 0, 0, 180, 0, [[0, '#6c3f29'], [.5, '#9b6037'], [1, '#5c3425']]);
    roundedPath(ctx, 79, 103, 111, 26, 6); fillStroke(ctx, wood, PALETTE.inkSoft, 2.5);
    line(ctx, [[90, 111], [177, 119]], 'rgba(232,176,99,.38)', 2);
    roundedPath(ctx, 360, 94, 102, 31, 7); fillStroke(ctx, wood, PALETTE.inkSoft, 2.5);
    line(ctx, [[374, 102], [449, 115]], 'rgba(232,176,99,.38)', 2);
    ctx.save(); ctx.translate(205, 110); ctx.rotate(-.08);
    ctx.fillStyle = '#b9b5a7'; ctx.fillRect(-22, -8, 46, 15);
    ctx.strokeStyle = '#6b665e'; ctx.lineWidth = 1.5; ctx.strokeRect(-22, -8, 46, 15);
    for (let i = -18; i < 20; i += 8) line(ctx, [[i, -7], [i + 7, 7]], 'rgba(75,70,64,.35)', 1);
    ctx.restore();
    drawRustPatch(ctx, 112, 91, 33, 16, -.12);
    drawRustPatch(ctx, 405, 112, 27, 13, .08);
    drawRustPatch(ctx, 292, 139, 22, 9, -.05);
    roundedPath(ctx, 36, 102, 25, 22, 7); fillStroke(ctx, '#e8cf7d', PALETTE.ink, 3);
    roundedPath(ctx, 470, 99, 20, 24, 6); fillStroke(ctx, '#b94d3c', PALETTE.ink, 3);
    roundedPath(ctx, 25, 132, 477, 17, 6); fillStroke(ctx, gradient(ctx, 0, 132, 0, 151, [[0, '#8e9492'], [1, '#4a5050']]), PALETTE.ink, 3.8);
    ctx.save(); ctx.translate(1, 62); ctx.rotate(-.04);
    line(ctx, [[34, 14], [-5, 3], [-18, 63], [29, 67]], PALETTE.ink, 4);
    for (let i = 0; i < 5; i++) line(ctx, [[-9 + i * 8, 12], [-13 + i * 8, 62]], '#7e898b', 2);
    for (let y = 21; y < 62; y += 13) line(ctx, [[-15, y], [30, y + 2]], '#7e898b', 2);
    line(ctx, [[-4, 3], [16, -8], [32, -7]], PALETTE.ink, 3.2);
    ctx.restore();
    if (upgraded) {
      line(ctx, [[206, 20], [393, 23]], PALETTE.ink, 5);
      line(ctx, [[226, 20], [226, 8]], PALETTE.ink, 4);
      line(ctx, [[372, 22], [372, 9]], PALETTE.ink, 4);
      roundedPath(ctx, 250, -3, 86, 24, 8); fillStroke(ctx, '#716856', PALETTE.ink, 3.4);
      line(ctx, [[258, 5], [327, 12]], '#aca08a', 2);
      roundedPath(ctx, 341, 4, 42, 17, 6); fillStroke(ctx, '#a4472e', PALETTE.ink, 3);
    }
    if (damaged) {
      line(ctx, [[283, 32], [327, 67]], '#554b45', 4);
      line(ctx, [[324, 31], [286, 68]], '#554b45', 4);
      line(ctx, [[172, 83], [158, 99], [177, 109], [161, 126]], '#2d2927', 3.4);
      ctx.fillStyle = 'rgba(42,37,34,.32)'; ctx.beginPath(); ctx.ellipse(446, 73, 24, 17, 0, 0, Math.PI * 2); ctx.fill();
    }
    line(ctx, [[66, 75], [180, 61], [241, 35]], 'rgba(235,250,248,.31)', 3.2);
    line(ctx, [[72, 144], [222, 143]], 'rgba(10,10,10,.28)', 2.2);
    drawHatching(ctx, 73, 104, 112, 25, 10, .13, 1);
    drawHatching(ctx, 361, 95, 97, 29, 10, .13, -1);
    ctx.restore();
  };

  const portraitData = {};
  const makePortrait = kind => {
    const canvas = document.createElement('canvas');
    canvas.width = 360;
    canvas.height = 470;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCharacter(ctx, kind, 340, 455);
    return canvas.toDataURL('image/png');
  };

  Object.keys(CHARACTER_FILES).forEach(kind => { portraitData[kind] = makePortrait(kind); });

  const imageDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
  if (imageDescriptor?.get && imageDescriptor?.set) {
    Object.defineProperty(HTMLImageElement.prototype, 'src', {
      configurable: imageDescriptor.configurable,
      enumerable: imageDescriptor.enumerable,
      get: imageDescriptor.get,
      set(value) {
        const source = String(value || '');
        const file = fileNameOf(source);
        const kind = characterKindFor(source);
        if (file) this.__toonAsset = file;
        if (kind) this.__toonKind = kind;
        if (kind && this.isConnected && portraitData[kind]) {
          imageDescriptor.set.call(this, portraitData[kind]);
          return;
        }
        imageDescriptor.set.call(this, value);
      }
    });
  }

  const decorateDomImages = root => {
    root.querySelectorAll?.('img').forEach(img => {
      const hint = img.getAttribute('src') || img.alt || '';
      const alt = String(img.alt || '').toLowerCase();
      const kind = characterKindFor(hint) || (['ricky', 'bubbles', 'julian'].includes(alt) ? alt : '');
      if (kind) {
        img.__toonKind = kind;
        img.__toonAsset = `${kind}-detailed.webp`;
        if (!String(img.src).startsWith('data:')) imageDescriptor?.set.call(img, portraitData[kind]);
      }
    });
  };

  decorateDomImages(document);
  new MutationObserver(records => {
    records.forEach(record => record.addedNodes.forEach(node => {
      if (node.nodeType === 1) decorateDomImages(node);
    }));
  }).observe(document.documentElement, { childList: true, subtree: true });

  const previousDrawImage = CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage = function toonDrawImage(image, ...args) {
    if (args.length !== 4) return previousDrawImage.call(this, image, ...args);
    const [x, y, w, h] = args;
    const source = image?.currentSrc || image?.src || '';
    const file = image?.__toonAsset || fileNameOf(source);
    const kind = image?.__toonKind || characterKindFor(source);
    if (kind) {
      const scale = kind === 'bubbles' ? .70 : kind === 'julian' ? .73 : .72;
      const dw = w * scale;
      const dh = h * scale;
      const dx = x + (w - dw) * .5;
      const dy = y + h - dh;
      this.save();
      this.translate(dx, dy);
      drawCharacter(this, kind, dw, dh);
      this.restore();
      return;
    }
    if (VEHICLE_FILES.has(file)) {
      const scale = .84;
      const dw = w * scale;
      const dh = h * scale;
      const dx = x + (w - dw) * .5;
      const dy = y + h - dh;
      this.save();
      this.translate(dx, dy);
      drawVehicle(this, dw, dh, file.includes('damaged'), file.includes('upgraded'));
      this.restore();
      return;
    }
    const rule = SHRINK[file];
    if (rule) {
      const dw = w * rule.scale;
      const dh = h * rule.scale;
      let dx = x + (w - dw) * .5;
      const dy = y + h - dh;
      if (rule.anchor === 'right-bottom') dx = x + w - dw;
      return previousDrawImage.call(this, image, dx, dy, dw, dh);
    }
    return previousDrawImage.call(this, image, ...args);
  };

  window.__SUNNYVALE_TOON_MODELS__ = {
    drawCharacter,
    drawVehicle,
    portraitData,
    version: '2.0.0'
  };
})();
