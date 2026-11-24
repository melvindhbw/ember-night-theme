# Ember night

A cozy dark theme (a "mod") for Claude Code. It paints a pixel-art snowy night behind the
conversation: a log cabin with a flickering window, drifting chimney smoke, twinkling stars,
a moon, pines, a snowman and falling snow. Messages get warm brown rounded bubbles and serif
type, and there is an optional quiet fireplace ambience.

Themes draw in the Claude desktop and mobile apps, in dark mode only. The terminal and
editors do not draw themes.

## Install

Type this at the prompt of a Claude Code session, answer `y` to add the marketplace, then pick a scope:

```
/plugin install ember-night --marketplace melvxnhe/ember-night-theme
```

The theme is set when a session starts, so open a new chat after installing.

## What is in here

- `hooks/register.tsx` sets the colors, message style, sound and the backdrop scene.
- `hooks/scene.js` builds the pixel-art scene as one SVG, animated with stepped CSS.
- `hooks/make-colors.js` is the palette helper that ships with Claude Code's plugin-authoring skill.

To change the look, edit the colors in `register.tsx` or the scene in `scene.js`.
