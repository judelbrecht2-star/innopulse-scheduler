# InnoPulse Dashboard Styling Guide

This dashboard system combines the clinical clarity of the health-record reference with the playful lime-and-black productivity interface. It should feel precise, energetic, and premium without becoming visually noisy.

## Visual principles

1. **A workspace within a canvas.** The application sits inside a large, softly shadowed white workspace on a cool-grey background. This creates hierarchy before any individual card is read.
2. **Lime communicates energy and state.** Neon lime is reserved for active navigation, primary actions, status indicators, progress, and small data highlights. It is not a general background colour.
3. **Black creates focus.** Near-black panels mark the most important live information, such as the next meeting or an active workflow.
4. **Dense information, generous containers.** Cards may contain compact data, but they use generous padding, strong grouping, and clear whitespace.
5. **Rounded geometry throughout.** Cards, navigation items, form controls, and status pills share a soft geometric language.

## Colour palette

| Token | Value | Use |
|---|---:|---|
| Canvas | `#E8EBE7` | Outer application background |
| Workspace | `#F7F8F4` | Main dashboard surface |
| Card | `#FFFFFF` | Primary content cards |
| Soft panel | `#EEF0EB` | Secondary surfaces and inactive controls |
| Ink | `#151613` | Primary text and focus panels |
| Muted ink | `#6C7068` | Supporting text and metadata |
| Lime | `#C8FF47` | Active state, action, progress and status |
| Line | `rgba(21,22,19,0.09)` | Borders and separators |

## Typography

- Family: Instrument Sans.
- Page titles: 38–70px responsive, 650 weight, tight `-0.06em` tracking, 0.96 line-height.
- Card titles: 17–22px, 600–650 weight, slightly tight tracking.
- Body: 14–16px with restrained line length.
- Metadata: 10–12px, uppercase or compact sentence case.
- Eyebrows: 11px uppercase with a small lime square marker.

## Shape, borders and depth

- Workspace radius: 30px.
- Main cards: 24px.
- Nested panels: 16–18px.
- Controls and actions: pill-shaped where practical.
- Borders: one-pixel, low-contrast dark lines.
- Shadows: broad and soft; never sharp or heavily saturated.

## Interaction rules

- Active navigation: near-black background, white label, lime icon.
- Inactive navigation: grey label with a subtle soft-panel hover.
- Primary action: lime fill and dark label.
- Card hover: 1–2px lift, slightly stronger border and shadow.
- Inputs: white background, 14px radius, lime focus ring.
- Statuses: small pills; lime for healthy/active, neutral grey for paused/draft, red only for destructive states.

## Layout rules

- Desktop uses a persistent 224px sidebar and sticky compact top bar.
- Pages are capped at 1380px and use responsive card grids.
- High-value dashboard information may use a dark panel or lime panel to create an asymmetric focal point.
- Mobile retains the same hierarchy with a horizontally scrollable bottom navigation.

## Accessibility

- Lime is paired with near-black text when used as a fill.
- Muted text still maintains readable contrast on white and soft-grey surfaces.
- Focus rings remain visible and are not replaced by hover-only feedback.
- Status meaning is always expressed in text as well as colour.
