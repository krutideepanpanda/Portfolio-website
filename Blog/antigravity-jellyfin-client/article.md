---
title: "Antigravity - Jellyfin Client"
author: "Kruti Deepan Panda"
date: "August 14, 2026"
category: "AI Exploration"
readTime: "5 min read"
tags: ["Antigravity"]
series: "ai-exploration"
seriesTitle: "KDP's AI exploration"
chapter: 2
experimentResult: "FAIL"
summary: "A brief look into the colossal chaos of using Antigravity within Google Android Studio."
---

# Antigravity - Jellyfin Client

I initiated the [[Antigravity-jellyfin-client](https://github.com/krutideepanpanda/Antigravity-jellyfin-client)] project under the assumption that it would be remarkably straightforward. After all, Jellyfin's official Android client is open-source on GitHub, and my sole requirement was to implement an automated download feature.

This is precisely when I realized just how abysmal this development experience was destined to be. Google, in a stroke of sheer genius, decided to prohibit users from utilizing their Gemini AI Pro subscriptions directly inside Android Studio. Android Studio exclusively relies on Gemini API keys, which effectively forces you onto the free tier. Consequently, if you are naive enough to attempt vibe-coding an Android application, you are essentially relegated to using the caveman equivalent of modern LLMs.

Even if you circumvent this by using Antigravity and building via the CLI, Gemini remains fundamentally incapable of utilizing ADB correctly to debug runtime errors. The initial application it generated was so structurally unsound that it crashed incessantly, and despite having access to ADB logs, the model failed completely at debugging. After finally giving up on Gemini, I switched to Claude Opus 4.6, which diagnosed and resolved the issue almost immediately, allowing me to proceed. Why, Google? Why? Was it genuinely that difficult to integrate your own LLM to function optimally with your own development tools? Do you comprehend how poor your models must be if I am forced to rely on Opus to patch the bugs your system created?

If that level of frustration was insufficient to convey the sheer annoyance of this experience, allow me to share one more remarkably smooth-brained decision Gemini made.

Despite my explicit instructions to create a fork of the official Jellyfin Android client—and my direct request for feature parity to ensure it understood it was building upon an existing codebase—Gemini inexplicably started the project entirely from scratch. When confronted, this supposedly advanced LLM boldly claimed it had achieved feature parity, blatantly lying to me in the process.

Following a migraine-inducing week of development hell, I have officially abandoned this project. If anyone from Google's AI division happens to read this: please, fix your product. At the bare minimum, make it the superior choice for your proprietary tooling ecosystem. If this iteration represents Google's grand vision for LLMs, then I am profoundly relieved, because this AI is categorically incapable of replacing any engineering job.