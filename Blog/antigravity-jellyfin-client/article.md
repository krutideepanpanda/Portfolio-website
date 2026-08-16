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
summary: "A brief look into the colossal chaos that is Antigravity in Google android studio."
---

# Antigravity - Jellyfin Client

I started the project [[Antigravity-jellyfin-client](https://github.com/krutideepanpanda/Antigravity-jellyfin-client)] thinking it should be fairly simple. After all, Jellyfin's android client is available on github and I just need an automated download option.
This is when I realised just how bad of an experience this was going to be. Google with their huge genius brain decided to not let users use their Gemini AI pro subscriptions inside Android Studio.
Android Studio only uses Gemini API keys and that is basically using the free tier. Which means if you are a dumbass like me and want to vibe code an android app you are basically using the caveman equivalent of LLMs.
Even if you use Antigravity and building the through CLI, Gemini just can't use adb correctly to debug the errors you are having with the app. The app that it developed initially was so bad it kept crashing continuously, and despite using ADB it was not able to debug. After giving up on Gemini, I used Claude Opus 4.6 which then quickly fixed the issue and let me proceed. Why Google? Why? Was it that hard to make YOUR own LLM to best with YOUR own tools? Do you realize how bad your LLMs are if I have to use Opus to fix the bugs you made?

If all that rage was not enough to tell you how annoying this experience was, let me tell one more smooth brained thing Gemini did.
Even after me specifically asking it to be a fork of Jellyfin's android client, Gemini started it from scratch. I even asked to have feature parity with the official client, so that it understand that is has to make a fork and build on top of it. Obviously this smooth brained LLM said it did get feature parity and blatantly lied to me.

After an awful migrane inducing week, I have given up on this project. If anyone from Google's AI team is reading this, please improve your product. Atleast make it the best choice to work on your own tools. If this is what Google's vision of LLM is then I am so glad, because this AI will never replace any job.