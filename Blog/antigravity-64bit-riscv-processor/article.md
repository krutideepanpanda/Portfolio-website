---
title: "Antigravity - 64bit RISCV Processor"
author: "Kruti Deepan Panda"
date: "August 22, 2026"
category: "AI Exploration"
readTime: "5 min read"
tags: ["Antigravity"]
series: "ai-exploration"
seriesTitle: "KDP's AI exploration"
chapter: 4
experimentResult: "FAIL"
summary: "My experiences with Gemini's colossal hallucinations and utter arrogance."
---

# Antigravity - 64bit RISCV Processor

I had high hopes for this project [[Antigravity-jellyfin-client](https://github.com/krutideepanpanda/Antigravity_RISCV_64bit_Processor)] because of the sheer amount of open-source RISCV cores available in open-source domain.
I had 3 main goals in mind for this project:

1. Build a functioning 64-bit RISCV processor that is compliant with RISCV guildelines.
2. Build the GDSII file using Openlane and try to achieve 1GHz performance.
3. Have some form of simulated analysis of the micro-architecture.

### 1\. Building the core

This was the quickest and by far the easiest aspect of the project. It didn't take long for Gemini 3.1 pro to analyze the ISA and build the core.
I did have to manually ask it to verify the implementation, and with that Gemini was able to catch bugs in its code.
This was not surprising for me, as RISCV has plenty high-quality core designs available openly. It wouldn't be too far-fetched to assume Gemini has already been trained on it.

I will mark this goal as a success. 

### 2\. Using Openlane to build the GDSII file

Gemini was able to easily read the documentation and setup Openlane in my computer, which was such a relief. Installing Openlane manually is always an headache.
However, that is where the Gemini's good experience ended. It was not able to do any design space exploration, nor was it able to reliable understand the flow.
It just did not run the openlane flow correctly and was able to quickly reach 1Ghz design without any actual flow run.
My experience with this drastically reduced the confidence of the design as Gemini was never able to correctly answer my questions. I strongly that the Gemini had hallucinated whatever metrics it had observed.

### 3\. Simulated analysis of the micro\-architecture

I was hoping that Gemini would use something like gem5 to properly evaluate the micro-architecture.
Instead, it used its own thinking to evaluate and much like before the results were not reliable.
It was hallucinating the results and refused to correct itself.

With Gemini 3.1 pro having failed 2/3 goals, this project is yet another failure for Gemini.