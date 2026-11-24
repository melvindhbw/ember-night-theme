// A pixel-art winter night: a snowed-in cabin with a flickering window, drifting
// chimney smoke, twinkling stars and falling snow. Pure vector, drawn on a 160 x 90
// pixel grid, with all motion done by CSS animations that step like old sprites.

const W = 160
const H = 90

function mulberry32(seed) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(2024)
const int = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1))

function rect(x, y, w, h, fill, extra) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}"${fill ? ` fill="${fill}"` : ''}${extra || ''}/>`
}

// A small character grid to paint sprites on.
function grid(w, h) {
  const g = Array.from({ length: h }, () => Array(w).fill('.'))
  return {
    set(x, y, c) {
      if (x >= 0 && x < w && y >= 0 && y < h) {
        g[y][x] = c
      }
    },
    fill(x0, y0, x1, y1, c) {
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          this.set(x, y, c)
        }
      }
    },
    rows() {
      return g.map(r => r.join(''))
    },
  }
}

// Turns rows of characters into rects, merging runs and grouping by color.
function px(rows, pal, x0, y0) {
  const byColor = {}

  rows.forEach((row, y) => {
    let x = 0

    while (x < row.length) {
      const ch = row[x]

      if (ch === '.' || ch === ' ') {
        x += 1
        continue
      }
      let run = 1

      while (x + run < row.length && row[x + run] === ch) {
        run += 1
      }
      ;(byColor[ch] = byColor[ch] || []).push(rect(x0 + x, y0 + y, run, 1))
      x += run
    }
  })

  return Object.keys(byColor)
    .map(ch => `<g fill="${pal[ch]}">${byColor[ch].join('')}</g>`)
    .join('')
}

// Flat color bands with a two-row checker dither where they meet.
function bands(id, list, end) {
  let defs = ''
  let body = ''

  list.forEach(([y, color], i) => {
    const next = i + 1 < list.length ? list[i + 1][0] : end
    body += rect(0, y, W, next - y, color)

    if (i > 0) {
      const pid = `${id}${i}`
      defs += `<pattern id="${pid}" width="2" height="2" patternUnits="userSpaceOnUse">${rect(0, 0, 1, 1, color)}${rect(1, 1, 1, 1, color)}</pattern>`
      body += rect(0, y - 2, W, 2, `url(#${pid})`)
    }
  })

  return { defs, body }
}

function disc(cx, cy, r, fill, opacity) {
  let out = ''

  for (let dy = -r; dy <= r; dy++) {
    const half = Math.floor(Math.sqrt(r * r - dy * dy) + 0.5)
    out += rect(cx - half, cy + dy, half * 2 + 1, 1, fill, opacity ? ` fill-opacity="${opacity}"` : '')
  }

  return out
}

// A ridge line: the top y of each column, from a few peaks with a slope.
function ridge(peaks, base, slope) {
  const tops = []

  for (let x = 0; x < W; x++) {
    let top = base

    for (const [px0, py] of peaks) {
      top = Math.min(top, Math.round(py + Math.abs(x - px0) * slope))
    }
    tops.push(top)
  }

  return tops
}

function ridgeRects(tops, bottom, fill, rimFill, rimHeight, capFill, capBelow) {
  let body = ''
  let x = 0

  while (x < tops.length) {
    let run = 1

    while (x + run < tops.length && tops[x + run] === tops[x]) {
      run += 1
    }
    body += rect(x, tops[x], run, bottom - tops[x], fill)

    if (rimFill) {
      body += rect(x, tops[x], run, rimHeight, rimFill)
    }

    if (capFill && tops[x] <= capBelow) {
      body += rect(x, tops[x], run, 2, capFill)
    }
    x += run
  }

  return body
}

function pine(cx, base, n, pal, hasTrunk) {
  const maxHalf = Math.floor(1 + (n - 1) * 1.6 + 3 * 0.8)
  const w = maxHalf * 2 + 1
  const h = n * 4 + (hasTrunk ? 3 : 0)
  const g = grid(w, h)

  for (let t = 0; t < n; t++) {
    for (let k = 0; k < 4; k++) {
      const half = Math.floor(1 + t * 1.6 + k * 0.8)
      const y = t * 4 + k

      for (let x = -half; x <= half; x++) {
        let ch = x === half ? 'H' : x === -half ? 'g' : 'G'

        if (k === 0) {
          ch = 'S'
        } else if (k === 1 && (x === -half || x === half)) {
          ch = 's'
        }
        g.set(maxHalf + x, y, ch)
      }
    }
  }

  if (hasTrunk) {
    g.fill(maxHalf - 1, h - 3, maxHalf + 1, h - 1, 'T')
  }

  return px(g.rows(), pal, cx - maxHalf, base - h)
}

function cabin() {
  const c = grid(34, 23)

  // Chimney, behind the roof.
  c.fill(23, 2, 27, 13, 'C')
  c.fill(27, 2, 27, 13, 'c')
  c.fill(22, 0, 28, 0, 'S')
  c.fill(23, 1, 27, 1, 's')

  // Roof, with snow on the peak and along both edges.
  for (let r = 0; r <= 10; r++) {
    const half = Math.min(16, Math.floor(1.6 * r))
    const left = 16 - half
    const right = 17 + half

    for (let x = left; x <= right; x++) {
      let ch = r % 2 === 0 ? 'r' : 'R'

      if (r <= 1 || r === 10 || x - left < 2 || right - x < 2) {
        ch = 'S'
      }
      c.set(x, 3 + r, ch)
    }
  }

  // Log walls.
  for (let y = 14; y <= 22; y++) {
    const wr = y - 14

    for (let x = 2; x <= 31; x++) {
      let ch = wr % 3 === 0 ? 'd' : wr % 3 === 1 ? 'L' : 'l'

      if (wr === 8) {
        ch = 's'
      }

      if (wr !== 8 && (x <= 3 || x >= 30)) {
        ch = wr % 2 === 0 ? 'd' : 'l'
      }
      c.set(x, y, ch)
    }
  }

  // Window: four panes with a lit centre.
  c.fill(6, 16, 12, 20, 'F')
  c.fill(7, 17, 11, 19, 'W')
  c.fill(9, 17, 9, 19, 'F')
  c.fill(7, 18, 11, 18, 'F')
  c.set(8, 17, 'w')
  c.set(7, 17, 'w')
  c.set(10, 19, 'w')
  c.set(11, 19, 'w')
  c.fill(5, 21, 13, 21, 'S')

  // Door.
  c.fill(21, 17, 26, 22, 'D')
  c.fill(22, 16, 25, 16, 'D')
  c.fill(23, 17, 23, 21, 'F')
  c.set(25, 19, 'K')
  c.fill(20, 22, 27, 22, 'S')

  const pal = {
    S: '#f1f5ff',
    s: '#bcc8ea',
    R: '#5b2f31',
    r: '#7c403a',
    L: '#8a5c3a',
    l: '#6e4529',
    d: '#47291a',
    W: '#ffcf5a',
    w: '#fff2b0',
    F: '#3a2314',
    D: '#4f2e1c',
    K: '#ffd45e',
    C: '#6a6f88',
    c: '#4a4e66',
  }

  return px(c.rows(), pal, 12, 51)
}

function snowman() {
  const rows = [
    '...SSS...',
    '..SSSSS..',
    '..SeSeS..',
    '..SSOOS..',
    '...SSS...',
    '.qQQQQQq.',
    'aaSSSSSaa',
    '.SSSkSSs.',
    '.SSSSSSs.',
    '..SSkSS..',
    '.SSSSSSs.',
    'SSSSSSSSs',
    'SSSSSSSss',
    '.sSSSSss.',
  ]
  const pal = {
    S: '#f4f7ff',
    s: '#c3cfee',
    e: '#1a1a2a',
    k: '#1a1a2a',
    O: '#ff8a2b',
    Q: '#c8372d',
    q: '#e0584a',
    a: '#6b4226',
  }

  return px(rows, pal, 52, 81 - rows.length)
}

export function buildScene() {
  const sky = bands(
    'sk',
    [
      [0, '#0a0e22'],
      [12, '#0f1535'],
      [24, '#171d49'],
      [34, '#232859'],
      [42, '#312d68'],
      [48, '#47386f'],
      [53, '#69446f'],
      [57, '#8c5772'],
    ],
    64,
  )
  const snow = bands(
    'sn',
    [
      [64, '#6978b3'],
      [68, '#8596cf'],
      [74, '#a2b2e2'],
      [81, '#bfcded'],
      [86, '#d6e0f5'],
    ],
    H,
  )

  // Stars: small ones, and three bigger plus-shaped ones.
  let stars = ''

  for (let i = 0; i < 34; i++) {
    const x = int(1, 158)
    const y = int(1, 40)

    if (x > 118 && x < 146 && y < 24) {
      continue
    }
    const klass = i % 3 === 0 ? 'ta' : i % 3 === 1 ? 'tb' : 'tc'
    stars += rect(x, y, 1, 1, '#dfe6ff', ` class="${klass}" style="animation-delay:-${(rand() * 4).toFixed(1)}s"`)
  }

  for (const [x, y, d] of [[24, 12, 0], [76, 8, 1.3], [104, 26, 2.1]]) {
    stars += `<g fill="#f2f5ff" class="ta" style="animation-delay:-${d}s">${rect(x, y - 1, 1, 3)}${rect(x - 1, y, 3, 1)}</g>`
  }

  const moon =
    `<g class="moon">${disc(132, 13, 11, '#dfe6ff', 0.05)}${disc(132, 13, 9, '#dfe6ff', 0.08)}` +
    `${disc(132, 13, 6, '#f4efd6')}` +
    `${rect(129, 11, 2, 2, '#d9d2b0')}${rect(134, 15, 2, 1, '#d9d2b0')}${rect(133, 9, 1, 1, '#d9d2b0')}${rect(130, 16, 1, 1, '#d9d2b0')}</g>`

  const far = ridgeRects(ridge([[18, 38], [52, 44], [96, 36], [138, 42]], 60, 0.9), 64, '#1d2250', null, 0, '#8f9bc9', 45)
  const hills = ridgeRects(ridge([[10, 57], [72, 59], [124, 56]], 64, 0.3), 66, '#141a3b', '#2b3472', 1)

  const farPal = { G: '#101a33', g: '#101a33', H: '#17234a', S: '#5b6aa0', s: '#3a4878', T: '#101a33' }
  let farTrees = ''

  for (let x = 58; x < 124; x += 7) {
    farTrees += pine(x + int(-1, 1), 67, 2, farPal, false)
  }

  let sparkle = ''

  for (let i = 0; i < 16; i++) {
    sparkle += rect(int(1, 158), int(66, 88), 1, 1, '#ffffff', ` class="${i % 2 ? 'ta' : 'tb'}" style="animation-delay:-${(rand() * 4).toFixed(1)}s"`)
  }

  const treePal = { G: '#1b4a35', g: '#133a2a', H: '#2c6b4a', S: '#eef3ff', s: '#b9c6e8', T: '#4a2c1a' }
  const rightTrees = pine(146, 83, 4, treePal, true) + pine(130, 80, 3, treePal, true) + pine(118, 77, 2, treePal, true)
  const leftTree = pine(3, 80, 3, treePal, true)

  // The window's warm light, on the wall and spilled on the snow.
  const pool = [
    [74, 15, 14, 0.5],
    [75, 13, 18, 0.38],
    [76, 12, 20, 0.26],
    [77, 13, 18, 0.16],
    [78, 15, 14, 0.09],
  ]
    .map(([y, x, w, o]) => rect(x, y, w, 1, '#ffbe4a', ` fill-opacity="${o}"`))
    .join('')
  const glow = `<g class="fl">${rect(15, 64, 13, 11, '#ffb347', ' fill-opacity="0.2"')}${pool}</g>`

  const smoke = [0, 1, 2]
    .map(
      i =>
        `<g fill="#cfd6ee" class="pf" style="animation-delay:-${(i * 2).toFixed(1)}s">${rect(37 + i, 46 - i * 4, 3, 3, null, ' fill-opacity="0.55"')}${rect(38 + i, 45 - i * 4, 1, 1, null, ' fill-opacity="0.8"')}</g>`,
    )
    .join('')

  // Falling snow: three layers that step down the screen at different speeds.
  let falling = ''
  const layers = [
    { count: 36, klass: 'fa', size: 1, opacity: 0.5, seconds: 26 },
    { count: 34, klass: 'fb', size: 1, opacity: 0.85, seconds: 16 },
    { count: 20, klass: 'fc', size: 2, opacity: 0.95, seconds: 10 },
  ]

  for (const layer of layers) {
    for (let i = 0; i < layer.count; i++) {
      falling += rect(
        int(0, 158),
        -24,
        layer.size,
        layer.size,
        '#f4f7ff',
        ` class="${layer.klass}" fill-opacity="${layer.opacity}" style="animation-delay:-${(rand() * layer.seconds).toFixed(1)}s"`,
      )
    }
  }

  // A few flakes that hang in the air, so a still frame is snowy too.
  let hanging = ''

  for (let i = 0; i < 40; i++) {
    hanging += rect(int(0, 159), int(2, 82), 1, 1, '#f4f7ff', ` class="${i % 2 ? 'ta' : 'tc'}" fill-opacity="${(0.4 + rand() * 0.4).toFixed(2)}" style="animation-delay:-${(rand() * 5).toFixed(1)}s"`)
  }

  const css =
    '.ta{animation:tw 3.2s steps(1) infinite}' +
    '.tb{animation:tw 4.6s steps(1) infinite}' +
    '.tc{animation:tw 2.4s steps(1) infinite}' +
    '@keyframes tw{0%{opacity:1}50%{opacity:0.25}100%{opacity:1}}' +
    '.fl{animation:flick 3.6s steps(1) infinite}' +
    '@keyframes flick{0%{opacity:1}12%{opacity:0.8}24%{opacity:0.95}41%{opacity:0.72}57%{opacity:1}73%{opacity:0.86}88%{opacity:0.96}100%{opacity:1}}' +
    '.pf{animation:puff 6s steps(11) infinite}' +
    '@keyframes puff{0%{transform:translate(0,0);opacity:0}15%{opacity:0.9}100%{transform:translate(7px,-22px);opacity:0}}' +
    '.fa{animation:dropa 26s steps(118) infinite}' +
    '.fb{animation:dropb 16s steps(118) infinite}' +
    '.fc{animation:dropc 10s steps(59) infinite}' +
    '@keyframes dropa{to{transform:translate(4px,118px)}}' +
    '@keyframes dropb{to{transform:translate(-6px,118px)}}' +
    '@keyframes dropc{to{transform:translate(8px,118px)}}' +
    '@media (max-aspect-ratio: 1/1){.cab{transform:translate(50px,0)}.moon{transform:translate(-44px,0)}.rt{transform:translate(-46px,0)}.lt{display:none}}'

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" shape-rendering="crispEdges">` +
    `<style>${css}</style>` +
    `<defs>${sky.defs}${snow.defs}</defs>` +
    sky.body +
    stars +
    moon +
    far +
    hills +
    farTrees +
    snow.body +
    sparkle +
    `<g class="lt">${leftTree}</g>` +
    `<g class="rt">${rightTrees}</g>` +
    `<g class="cab">${cabin()}${glow}${smoke}${snowman()}</g>` +
    hanging +
    falling +
    '</svg>'
  )
}
