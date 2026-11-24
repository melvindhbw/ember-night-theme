import type { Register, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'
import { buildScene } from './scene.js'

// A candlelit reading nook: coffee-dark walls, cream type, honey-amber accents.
const { theme, problems } = makeColors({
  label: 'Ember night',
  only: 'dark',
  roles: { accent: '#e8a25a', danger: '#e07a6a', success: '#a3c084', warning: '#ecc26a', pro: '#c79ad0' },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#1a1410',
        'surface-1': '#231b15',
        'surface-2': '#2d231b',
        'surface-3': '#382c22',
        'text-primary': '#f5e9d3',
        'text-secondary': '#d6c3a5',
        'text-muted': '#b09a7e',
      },
    },
  },
})

const SCENE = 'cabin'
const SOURCE = buildScene()

const COLORS: ThemeSetArgs = { colors: theme, overrideColorScheme: 'dark' }

// The pixel cabin, with its panels frosted in dark coffee so words stay easy to read.
const WITH_SCENE: ThemeSetArgs = {
  ...COLORS,
  backdrop: { scene: SCENE, glass: { blur: 6, tint: '#1a1410', opacity: 0.62 } },
}

// Soft serif words in rounded, warm-toned rows, like pages by a fire.
const STYLE: ThemeSetArgs['style'] = {
  Text: { fontFamily: ['serif'], fontSize: 16, lineHeight: 26 },
  Heading: { fontFamily: ['mono'], color: '#ffd9a0' },
  UserMessage: { color: '#f5e9d3', backgroundColor: '#4a3322', radius: 14, padding: 14 },
  AssistantMessage: { color: '#f5e9d3', backgroundColor: '#2d231b', radius: 14, padding: 14 },
  ToolUse: { color: '#d6c3a5', fontFamily: ['serif'] },
}

// A fire that never quite goes out: a low hum, a little wind, and now and then a crackle.
const SOUND: ThemeSetArgs['sound'] = {
  ambience: {
    layers: [
      { wave: 'brown', drone: true, gain: 0.12, filter: { type: 'lowpass', hz: 280 } },
      { wave: 'pink', drone: true, gain: 0.035, filter: { type: 'lowpass', hz: 700, to: 450 }, tremolo: { hz: 0.12, depth: 0.5 } },
      { wave: 'crackle', scatter: 2.5, gain: 0.1, attack: 0.002, release: 0.05, filter: { type: 'bandpass', hz: 2600 } },
    ],
  },
  cues: {
    done: { layers: [{ wave: 'bell', notes: ['E5', 'B5'], step: 0.14, gain: 0.18 }] },
  },
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))

    if (unpainted !== undefined) {
      $.ui.toast(unpainted)
    }

    // Try the whole look, then step down to what this build takes.
    const attempts: ThemeSetArgs[] = [
      { ...WITH_SCENE, style: STYLE, sound: SOUND },
      { ...WITH_SCENE, style: STYLE },
      WITH_SCENE,
      COLORS,
    ]

    for (const attempt of attempts) {
      try {
        const set = await $.theme.set(attempt)

        if (!set.isDrawn) {
          $.ui.status(set.reason)
        }
        break
      } catch (error) {
        $.ui.log(String(error))
      }
    }

    return next(e)
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.props.scene !== SCENE || (e.surface !== 'desktop' && e.surface !== 'mobile')) {
      return next(e)
    }

    const { Svg } = $.ui.resolve(e)

    return <Svg source={SOURCE} alt="A pixel-art cabin with a glowing window in a snowy pine forest at night, snow falling" isInteractive />
  })
}
