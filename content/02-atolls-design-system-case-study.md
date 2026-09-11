---
title: Atolls Design System
description: Rebuilding an outdated design system in under two months to support a new brand identity, making it scalable, accessible, and in sync with code.
year: 2025
role: Lead Product Designer
---

# Atolls Design System

![Atolls DS](./src/atolls-1.png)
<br>
We had less than two months to rebuild a design system that had become a blocker. It needed to support a new brand, work across four products, stay in sync with code, and make future brand changes much easier. I led the product design work, from deciding what had to ship to defining the foundations, token architecture, components, and documentation.
<br>

| Faster feature development | Products supported | Adoption |
|---:|---:|---:|
| +50% | 4 | 75% |

## Overview

We already had a design system, but it had stopped helping us move.

Components were hard to adapt. Token changes took too long to reach code. Applying a theme in Figma was painfully slow. Our products were starting to bend around the system instead of the system supporting the products.

The new brand identity did not create the problem. It exposed it.

## The Breaking Point

On paper, the ask was simple: update the products to match the new brand. Rounded buttons in a distinct color. Easy, right?

Wrong.

The buttons in our design system were locked to the brand’s primary color. They literally refused another color. And that was just one example.

![The legacy design system](./src/atolls-ds-old.png "iso The legacy design system")

The system was based on TokensStudio tokens, which didn’t play nicely with Figma variables. Adding tokens? Nightmare. Any change? Took weeks to reach the code. Applying a theme in Figma? Go make a coffee, or three.

Company leadership and the Brand team had created the new identity and asked Product Design to bring it into the products. I was one of the main design decision-makers raising that this could not be treated as a visual reskin. I pushed for a deeper rebuild of the system. 

The existing system could not support multiple fonts, irregular surfaces, flexible component styling, accessibility, or timely changes. Even small requests could take weeks to reach code. Expanding the scope required alignment with Design and Product leadership, company executives, product teams, Brand, and the design-system engineers. The resulting direction brought accessibility into the foundations and treated scalability, token structure, and the component workflow as core requirements.

## The Challenge

I led the product design work, but I did not do it alone. I worked with another product designer, a design engineer, and engineers responsible for connecting the system to code.

My part covered prioritization, defining the minimum viable system, building the early proof of concept, and shaping the foundations, semantic tokens, components, states, and documentation.

The wishlist was ambitious:

- Mobile-friendly
- Accessible
- Scalable
- Fast-growing and reliable
- Easy to use
- In sync with code

The deadline was less than two months. So “build everything” was never an option. We had to decide what the products genuinely needed and what could wait.

## Prioritization

We started with a workshop. All product designers in the room, figuring out: what do we actually need in two months, and what can wait?

The first decision was what not to build. I led the product-design workshop and selected the first-release scope with Engineering. We assessed current product needs, patterns repeated during exploration, likely future reuse, and the engineering effort required. 

The workshop also helped us separate similar-looking patterns with different purposes. Repeated page containers became an “island” component because their structural and interaction role differed from cards. Different teams needed different card layouts, so we created a shared parent structure with flexible sub-layouts and adopted a slot-based architecture before Figma supported component slots.

![Prioritization](./src/atolls-ds-plan.png "iso Prioritization")

Date pickers stayed out because no product needed them. Pagination remained with the single team that required it because there was not enough cross-product demand to justify spending design-system engineering capacity on it. In parallel, the engineers explored how Figma variables would connect to code and where AI and MCP could improve the workflow. This gave us a focused first release based on product evidence rather than library completeness.

## Proof of Concept

During the workshop, I built a deliberately scrappy version of the new system. It used basic elements in the new brand, with every property connected to a variable.

The point was not to make it polished. It was to test the direction immediately and give designers something they could use while the real system was still taking shape.

![Proof of Concept](./src/atolls-ds-poc.png "iso Proof of Concept")

Initial component drafts were ready within a day or so, giving Product Design, Brand, and Engineering a shared artifact for making decisions. Brand needed the products to support new palettes, button and container shapes, page structures, and display fonts. The proof of concept exposed inaccessible color combinations and missing digital rules for links, interaction states, elevation, and surfaces.

It also made Engineering’s concerns concrete, particularly the cost of irregular shapes, shared component structures, and responsive grids. Together, we created accessible interaction palettes, simplified irregular shapes for the first release, and redefined layout rules for responsive products. The prototype also confirmed patterns such as the island component and helped settle the typography structure, allowing the three tracks to move forward together. 

## Iteration

Once the direction held up, I worked with the design engineer and other product designers to define the foundations through research, experimentation, and repeated architecture discussions. It was a joint decision rather than mine alone.

Early concepts did not include a primitive layer, and we tested different ways to separate brand choices from semantic meaning. We chose a layered structure because the system needed to support more products and brands without forcing component-level rebuilds: 

```text
Primaries → Brand Layer → Semantics → Patterns
```

The structure was more complex than teams were used to, but it made future brand changes and maintenance more manageable. Design and Engineering were aligned on this direction, so the evidence here is joint decision-making rather than resolving a conflict between them.

With the structure in place, we built the components and gave important patterns their own tokens. States, behavior, and implementation expectations were documented for handoff instead of being left inside the Figma file.

The system was not only a new set of components. It was a shared model for how design decisions should move from brand to product to code.

## Delivery

We delivered the first version in under two months.

The system supported four products and reached 75% adoption at the point documented. Components could support different appearances, emphasis levels, sizes, and brands without being rebuilt for every use.

![Storybook](./src/atolls-ds-storybook.png "iso Storybook")

Everything lived in one central, documented library, but adoption also required governance. We collected feedback through weekly Brand and Engineering meetings and dedicated Slack channels, and I ran onboarding sessions for front-end engineers. Designers could propose changes based on upcoming product needs, while engineers could raise implementation roadblocks.

I co-led the design-system committee with an engineering manager, supported by the design engineer and design-system team, to review those proposals. We defined a contribution model in which product teams created patterns needed only by their product. When similar needs appeared across teams, ownership moved to the design-system team for system-wide adoption. The rules and ownership were documented in Storybook. This allowed more complex card and page layouts to enter the shared system as cross-product demand emerged.

Updates that previously took weeks could now roll out in as little as one week. With the shared library, documentation, and AI and MCP workflow, developers were able to build features more than 50% faster.

## Lessons Learned

The biggest lesson was that rebuilding the components was only part of the job.

We also had to decide what not to build, give designers something useful before the final system was ready, connect design decisions to code, and create a way for the system to keep changing after launch.

The early proof of concept kept the products moving. The layered token structure made brand changes possible without rebuilding every component. The feedback workflow gave the system somewhere to grow.

The old system had become a blocker because the products had outgrown it. The new one gave them room to keep moving.
