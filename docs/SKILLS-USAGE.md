# How the uploaded skill packs were used

Checked against the session log on 2026-10-08, not from memory.

Both zips were recognised, but they have only been partly used.

## 1. Shopify-agent-skills-main.zip (8 Shopify skills)

Skills: api-graphql, app-development, checkout-customization, cli-tools, headless-hydrogen, liquid-templating,
shopify-functions, theme-development.

- All 8 were installed into the project (`.claude/skills/`) and show up as available skills.
- None of them was ever opened. The log shows no reads at all. Everything built so far (theme sections, Liquid
  code, the GraphQL calls to the store) came from Claude's own Shopify knowledge, not from these guides.

## 2. claudedesignskills-main.zip (23 design skills)

- Only one, **modern-web-design**, was installed, and it was read once.
- It shaped the detail pass: the contrast rules, the 44px tap targets, the reduced-motion rules and the gentle
  scroll reveals. Those are now written into the project's design standards (`CLAUDE.md`).
- The other 22 were left out on purpose: they are 3D, WebGL, scroll-hijacking and heavy animation libraries
  (aframe-webxr, animated-component-libraries, animejs, babylonjs-engine, barba-js, blender-web-pipeline,
  gsap-scrolltrigger, lightweight-3d-effects, locomotive-scroll, lottie-animations, motion-framer, pixijs-2d,
  playcanvas-engine, react-spring-physics, react-three-fiber, rive-interactive, scroll-reveal-libraries,
  skill-creator, spline-interactive, substance-3d-texturing, threejs-webgl, web3d-integration-patterns). They would
  slow a carpet store down and distract buyers; this is noted in the project instructions.
- One skipped skill that could fit: **scroll-reveal-libraries**. It's light, but the site already does the same
  thing with a few lines of its own code, so it isn't needed.

## Where that falls short

The Shopify skills are directly relevant to the store, and the work should have been checked against them. They
cover theme best practices, Shopify's own code checker (Theme Check) and GraphQL rate limits. Reading them might
have caught some of the upload problems sooner.

## Offered next step

Go through **theme-development**, **liquid-templating** and **api-graphql** properly and review the live theme
against them. Findings would be reported as a list, with nothing fixed without the owner's approval and nothing
to do with layout.
