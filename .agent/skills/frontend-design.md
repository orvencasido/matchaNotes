---
name: frontend-design
description: Guidance for distinctive, intentional visual design when building new UI or reshaping an existing one. Helps with aesthetic direction, typography, and making choices that don't read as templated defaults.
---

# Frontend Design Skill

Approach every interface as the design lead at a design studio known for giving every project a distinct visual identity that is not mistaken for anyone else's. Avoid cliché or templated defaults: make deliberate, opinionated choices about palette, typography, and layout that are specific to this brief.

## Core Directives

### 1. Ground Designs in the Subject Matter
- For this project: A serene, private **personal notes app and secure vault** in matcha green and warm off-white.
- The audience: A single power-user who wants clarity, instant recall, zero cognitive overload, and high tactile satisfaction.
- Primary job: Fast capture of thoughts, to-dos, images, and high-security access to accounts/passwords.

### 2. Typographic Craft
- Choose typefaces deliberately. Use clean geometric or humanist sans-serifs (like Inter, Geist, Plus Jakarta Sans) paired with intentional weights and tracking.
- Set a clear type scale with intentional line heights (`leading-relaxed` for reading, `leading-tight` for titles).
- Avoid default typographic clichés:
  - DO NOT accent just a single word in a headline with italic or random colors.
  - DO NOT use loud all-caps tracking on every label.
  - DO NOT add unnecessary typographic labels or redundant helper captions above every card.
  - Keep line length under 80 characters.

### 3. Palette & Atmosphere (Matcha & Off-White)
- Base palette:
  - Deep Ceremonial Matcha: `#2D4739`
  - Subtle Leaf Accent: `#4E6E58`
  - Soft Matcha Wash (high contrast badge/accent): `#E8EFE8`
  - Warm Canvas Off-White: `#FBFBF9`
  - Elevated Card Off-White: `#F4F3EE`
  - Hairline Separators: `#E4E3DC`
  - Deep Forest Ink: `#19221C`
  - Slate Muted Text: `#5B6860`
- Do not dilute this palette with standard generic blues or neon greens.

### 4. Layout & Visual Restraint
- Eliminate generic "AI card kit" tropes: do not chop every item into identical pill-shaped rounded cards with blurry gray shadows.
- Structural devices (hairlines, dividers, subtle background contrast) should encode actual hierarchy, not decorative clutter.
- Maintain breathing room: generous white space, clean margins, crisp borders.

### 5. Intentional Motion
- Avoid chaotic bounce animations or hover transitions on every single pixel.
- Use motion only to answer user intent: opening a note, sliding in the 6-digit PIN keypad, toast feedback upon copying credentials.

### 6. Minimalist Copywriting
- Words appear in a design for one reason: to make it easier to understand and use.
- Cut filler phrases. Use concise, active voice ("Add note", "Copy password", "Lock vault").
- An empty state is an invitation to write, not a marketing pitch.
