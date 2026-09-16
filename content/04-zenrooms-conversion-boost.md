---
title: ZENRooms Conversion Boost
description: Redesigning a broken booking journey across desktop, mobile web, and a web-view app
year: 2019
role: Product Designer
---

# ZENRooms Conversion Boost

![ZENRooms Conversion Boost](src/zen-conversion-hero.png)

ZENRooms was a budget and mid-range hospitality company operating across Southeast Asia.

The booking experience had grown inconsistent, difficult to use on touch devices, and full of friction. I redesigned the core journey without adding major new features.

| Online payment uplift | Sessions tested | Tested surfaces |
|---:|---:|---:|
| 16% | 15K+ | 3 |

<br>

*ZENRooms.com has since shut down operations.*

## My Role

This was my first major project at ZENRooms. I was the sole product designer, working directly with the Product Manager and engineering team.

I handled discovery, analysis, design recommendations, user flows, wireframes, interface design, the basic design system, and developer handoff.

The Product Manager owned the final product decisions. The original brief did not specify where the redesign should begin, so I brought my findings and recommendations into the planning. Together, we chose checkout as the first phase because it offered the highest expected impact for the lowest effort.

My analysis shaped the design direction, test approach, project sequence and next steps.

## The Problem

The goal was to improve the booking experience without relying on new features.

The existing product had several connected problems:

- Inefficient user flows
- Misleading interaction patterns
- Weak information hierarchy
- Inconsistent components
- Poor support for touch devices
- Checkout errors that left users with no way forward

The mobile problem affected more than the website. At the time, the ZENRooms app was a web-view wrapper around the mobile website.

That meant one responsive product had to work across three surfaces:

- Desktop web
- Mobile web
- Mobile app through the web view

## Finding Where the Journey Broke

I started with the evidence we already had:

- Heatmaps
- Screen recordings
- Product analytics
- Previous A/B test results
- Competitive analysis
- Customer-support tickets

I had a direct line to Customer Support, and their tickets provided additional evidence of checkout failures. 

The problems were visible across the journey.

Some elements looked clickable but did nothing. Navigation could be blocked on smaller screens. Important information was scattered across pages. Users struggled to understand where to go next.

The biggest problem was checkout.

![Checkout card details](src/zen-web-card.png "iso Checkout card details")

| Heatmaps | Existing experience | Screen recordings | Funnel analysis |
|---:|---:|---:|---:|
| ![Unclickable elements looking like buttons](src/zen-web-heat1.png "Unclickable elements looking like buttons")<br>![App bar blocking navigation](src/zen-web-heat2.png "App bar blocking navigation") | ![Scattered information and weak hierarchy](src/zen-web-old-list.png "Scattered information and weak hierarchy") | ![Existing hotel details experience](src/zen-web-old-details.png "Existing hotel details experience") | ![Checkout failures and dead ends](src/zen-web-failed.png "Checkout failures and dead ends") |

Analytics showed many checkout errors without explaining their cause, so I examined screen recordings and heatmaps. Funnel analysis showed substantial drop-off during card-details entry and suggested that users were not returning to search after failed bookings.

Recordings confirmed a critical recovery problem. Even a simple CVC error could send users to a failure page with no route back. Because checkout directly affected revenue and was comparatively contained to fix, it offered the best impact-to-effort ratio. I recommended fixing it first, and the Product Manager approved the revised sequence.

## Fixing Checkout First

Screen recordings suggested that the number of checkout steps caused frustration, although the signal still needed large-scale testing. The standalone payment-selection page was already visually simple, so simplifying the page itself would not solve the problem. Supporting many payment options was also an unavoidable business requirement.

I moved payment selection to the end of the guest-details page. This followed a familiar ecommerce and booking pattern, signaled that data entry was nearly complete and prepared users for the payment-details step.

Error recovery was the highest-priority design problem, followed by clarity and ease of use. Inline card-detail validation was the most technically challenging part of the revised flow.

Users could submit their card details, receive a payment error, and find themselves trapped. They could not return to correct the details. In some cases, they could not get back to the same room and try another payment method.

I changed the flow so that:

- Inputs were validated inline whenever possible
- Errors appeared before submission instead of after it
- Users could return and correct rejected payment details
- Users could return to the property and try again
- A failed payment no longer meant losing the entire booking path

The goal was simple: an error should create a recovery path, not a dead end.

| Payment Method | Card Details | Verification | Error State |
|---|---|---|---|
| ![Payment Method](src/zen/zen-web-mobile-checkout.svg "Payment Method") | ![Card Details](src/zen/zen-web-mobile-card.svg "Card details") | ![Verification](src/zen/zen-web-mobile-verify.svg "Verification") | ![Error State](src/zen/zen-web-mobile-failed.svg "Error State") |

## Testing Phase 1: Checkout

I designed the A/B test after working with the Product Manager to understand the key business metrics and propose the test scope. The Product Manager raised the difficulty of testing too many simultaneous changes, so we separated checkout from the upstream journey. 

Exploration of search results and hotel details continued without waiting for a Phase 1 threshold. We ran Phase 2 afterward so the two tests would not influence each other.

The A/B test showed improvements at each major conversion point:

| Step | Outcome |
|---|---:|
| Payment-method selection | **6.08% uplift** |
| Successful online payments | **16.55% uplift** |
| Pay-at-hotel bookings | **20.14% uplift** |

The results showed that fixing the core flow could materially improve conversion and gave us the confidence to move upstream to search results and hotel details.

## Improving Discovery and Navigation

The next priority was helping users find a suitable hotel and move confidently toward room selection.

On the search results page, I:

- Added a map to show where the results were located
- Made filters clearly visible
- Reorganized the information on each hotel card
- Grouped pricing information into one section
- Grouped amenities into another section
- Improved the hierarchy so the cards were easier to scan

On the hotel details page, I applied the same approach.

The most important information became easier to find, related content was grouped together, and room selection became the most prominent task on the page.

The product contained a lot of information. Removing all of it was not an option. The design work was about organizing it around the user’s next decision.

## Working Through the Structure

I used wireframes to group related information, remove clutter, clarify navigation and align the proposed structure with the Product Manager and engineers before moving into detailed interface design.

| Search results | Hotel details | Room grouping |
|---:|---:|---:|
| ![Search results wireframe](src/zen-web-wireframe1.png "Search results wireframe") | ![Hotel details wireframe](src/zen-web-wireframe2.png "Hotel details wireframe") | ![Room grouping wireframe](src/zen-web-wireframe3.png "Room grouping wireframe") |

## Creating a Basic Design System

There was no established visual language when I joined.

Components were created as they were needed, often without clear design instructions. Developers sometimes had to decide how a component should look or behave during implementation.

I built a basic design system as part of the redesign. The prototypes made its consistency and scalability benefits clear to the Product Manager and engineers.

It gave the team:

- Shared interface patterns
- More consistent components
- Clearer states and behavior
- Better handoff documentation
- A common reference for design and engineering

We added components only when the product required them, allowing the system to grow without turning it into a speculative library.

![Interface guidelines](src/zen-web-ds1.png "iso Interface guidelines for design and engineering")

![Reusable components](src/zen-web-ds2.png "iso Reusable components used across the booking journey")

The system made handoffs easier and implementation faster. I established it as the product’s visual language, and it later informed the native app design, including several components planned for the shared React Native library with platform-specific exceptions.

## Designing Across Three Surfaces

The responsive experience had to work as a website and inside the mobile app’s web view.

That meant designing for touch from the beginning rather than shrinking a desktop interface after the fact.

The same structure and components had to remain understandable across mobile, desktop, and the app wrapper.

[See Prototype](https://www.figma.com/proto/MuHXUj9hnZv79SRk3WCMO1/ZENRooms.com "See ZENRooms Prototype")

| Search results | Hotel details | Checkout |
|---:|---:|---:|
| ![Search results on mobile](src/zen/zen-web-mobile-list.svg "Search results on mobile") | ![Hotel details on mobile](src/zen/zen-web-mobile-details.svg "Hotel details on mobile") | ![Checkout on mobile](src/zen/zen-web-mobile-success.svg "Checkout on mobile") |
| ![Search results on desktop](src/zen-web-desktop-list.png "Search results on desktop") | ![Hotel details on desktop](src/zen-web-desktop-details.png "Hotel details on desktop") | ![Checkout on desktop](src/zen-web-desktop-checkout.png "Checkout on desktop") |

## Testing Phase 2: Search and Hotel Details

After checkout had been tested, we introduced the redesigned search results and hotel details pages.

The test showed:

| Step | Outcome |
|---|---:|
| Search results to hotel details | **15% uplift** |
| Hotel details to checkout | **28% uplift** |

The improvement continued through the later stages of the tested journey:

| Step | Outcome |
|---|---:|
| Successful online payments | **38.32% uplift** |
| Pay-at-hotel booking conversion | **25.89% uplift** |

## Outcome

The redesign increased successful online payments by 16%. Testing covered more than 15,000 sessions across desktop, mobile web and the web-view app.

The detailed tests also showed improvements at specific points across checkout, search, hotel details, online payment, and pay-at-hotel booking.

The project did not depend on a major new feature. The gains came from fixing the fundamentals:

- Fewer checkout steps
- Recoverable payment errors
- Clearer navigation
- Better information hierarchy
- More visible filters
- A stronger path to room selection
- Touch-friendly patterns
- Consistent components across three surfaces

The main lesson was straightforward. Before adding more to a struggling product, fix the parts that stop users from completing the task.