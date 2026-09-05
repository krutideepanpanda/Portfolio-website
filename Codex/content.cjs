"use strict";

// Authoritative references for internal review. Never copy this module into the public artifact.
const sources = {
  about: ["Neutral_folder/Antigravity_about.html.txt"],
  experience: ["Neutral_folder/Antigravity_experience.html.txt"],
  skills: ["Neutral_folder/Antigravity_skills.html.txt"],
  leadership: ["Neutral_folder/Antigravity_leadership.html.txt"],
  contact: ["AGENTS.md"],
  caseStudies: [
    "Neutral_folder/Antigravity_projects.html.txt",
    "https://github.com/krutideepanpanda/RISC-V-based-micro-controller-using-OpenLane",
    "https://github.com/krutideepanpanda/4-Bit-ALU-using-Magic-VLSI",
    "https://github.com/krutideepanpanda/4-Bit-ALU-using-Magic-VLSI/blob/main/logVerify.py",
    "https://github.com/krutideepanpanda/4-Bit-ALU-using-Magic-VLSI/blob/main/cmdGenerate.py",
  ],
};
const external = (href, label) =>
  `<a class="text-link" href="${href}" target="_blank" rel="noopener noreferrer">${label} <span aria-hidden="true">↗</span></a>`;
const tags = (values) =>
  `<ul class="tags" aria-label="Tools and capabilities">${values.map((v) => `<li class="tag">${v}</li>`).join("")}</ul>`;

const pages = {
  about: {
    title: "Engineer. Racing fan. World explorer.",
    description:
      "My work in silicon design, the internships that shaped it, and the interests that keep me curious.",
    body: `<section class="section prose"><h2>Working across models, tools, and silicon</h2>
    <p>I am a Silicon Design Engineer 2 at AMD, specializing in analog mixed-signal behavioral modeling. I work with XMODEL and MODELZEN, formal verification, and logic equivalence checking using Cadence Conformal LEC and Synopsys ESP.</p>
    <p>Alongside that work, I build Python and TCL tooling for CAD automation and regression testing. I enjoy turning a repetitive engineering task into a tool that other people can use reliably.</p>
    <p>My undergraduate internships took me into two different parts of chip development: structural reliability at Intel, and high-speed DAC calibration and lab automation at Texas Instruments.</p>
    <a class="text-link" href="experience.html">Read my experience →</a></section>
    <section class="section prose"><h2>My foundation at NITK</h2><p>I studied Electronics &amp; Communication Engineering at the National Institute of Technology Karnataka from June 2019 to 2023, graduating with a B.Tech (Honors), a 9.6/10 Honors GPA, and an 8.68 overall GPA.</p>
    <p>My academic projects covered FPGA memory architectures for CNNs, a five-stage MIT Beta-ISA processor, open-source ASIC implementation, and memory protection using AES. I also served as IEEE NITK CASS Chair and taught an OpenLane workshop for undergraduate and postgraduate students.</p>
    <a class="text-link" href="projects.html#academic">Explore academic projects →</a></section>
    <section class="section"><div class="section-heading"><h2>Beyond silicon</h2><p>Racing, games, and worlds worth getting lost in.</p></div><div class="cards">
    <article class="card"><h3>Formula 1</h3><p>The aerodynamics, telemetry, power units, and strategy are as compelling to me as the racing. I support Williams Racing, admire James Vowles, cheer for Kimi Antonelli, and believe Carlos Sainz deserves a championship-tier machine.</p></article>
    <article class="card"><h3>Factories and open roads</h3><p>I unwind with a Porsche GT3 in Forza Horizon, and play Rocket League and F1 with friends. Satisfactory brings out my engineering instincts: arranging machines, increasing throughput, and finding the bottleneck in a sprawling factory.</p></article>
    <article class="card"><h3>Cosmic lore</h3><p>I love fictional universes with the depth of real history. Warhammer 40K and Destiny 2 draw me in through their scale, mythology, and layered world-building.</p></article>
    <article class="card"><h3>Anime and visual worlds</h3><p>I have followed major anime releases since 2019. Favorites include Frieren: Beyond Journey’s End, My Hero Academia, Fire Force, and Kaiju No. 8. My interest in visual worlds also led me to experiment with 3D VFX and environmental design in Unreal Engine 4.</p></article>
    </div></section>`,
  },
  experience: {
    title: "From lab benches to mixed-signal systems.",
    description:
      "Silicon design at AMD, with undergraduate internships at Intel and Texas Instruments.",
    body: `<section class="timeline" aria-label="Career history">
    <article class="timeline-item" id="amd"><p>July 2023 – Present · Full-time</p><div class="timeline-main"><h2>Silicon Design Engineer 2</h2><h3>AMD</h3><ul><li>Build system-level analog mixed-signal verification environments with XMODEL and MODELZEN across process corners.</li><li>Perform formal verification, static property checking, and logic equivalence checking with Synopsys ESP and Cadence Conformal LEC.</li><li>Develop internal Python and TCL automation for analog circuit sizing, verification flows, and regression testing.</li><li>Explore machine-learning-driven circuit generation from target frequency responses.</li></ul>${tags(["XMODEL", "MODELZEN", "Python", "TCL", "Conformal LEC", "Synopsys ESP"])}<a class="text-link" href="projects.html#industry">Industry work →</a></div></article>
    <article class="timeline-item" id="intel"><p>August 2022 – February 2023 · Undergraduate internship</p><div class="timeline-main"><h2>Structural Design Intern</h2><h3>Intel Corporation</h3><ul><li>Performed structural reliability verification through IR-drop checks and power-grid analysis using Ansys Redhawk.</li><li>Worked on design automation for chip layout and floorplanning.</li><li>Maintained tools for cross-tool result analysis and automated report summarization.</li></ul>${tags(["Ansys Redhawk", "IR-drop analysis", "TCL", "Perl"])}</div></article>
    <article class="timeline-item" id="ti"><p>May 2022 – July 2022 · Undergraduate internship</p><div class="timeline-main"><h2>Analog VLSI Intern</h2><h3>Texas Instruments</h3><ul><li>Developed capacitor-trimming algorithms to calibrate a high-speed DAC for fabrication variation.</li><li>Built configurable Python tooling for test chips and automated control of voltage sources, oscilloscopes, and signal generators.</li></ul>${tags(["DAC calibration", "Python", "Lab automation"])}</div></article></section>`,
  },
  skills: {
    title: "The tools behind the work.",
    description:
      "Modeling, verification, physical implementation, and software automation across the hardware workflow.",
    body: `<section class="cards">
    <article class="card"><h2>Mixed-signal modeling and signoff</h2><p>Behavioral models and real-number modeling, equivalence checks, and formal verification in my AMD role.</p>${tags(["XMODEL", "MODELZEN", "RNM", "Cadence Conformal LEC", "Synopsys ESP"])}<a class="text-link" href="experience.html#amd">AMD experience →</a></article>
    <article class="card"><h2>CAD and lab automation</h2><p>Scripts and configurable tools for verification, circuit sizing, engineering reports, and lab equipment control.</p>${tags(["Python", "TCL", "Perl", "Bash", "ML circuit sizing", "Git"])}<a class="text-link" href="experience.html#ti">Lab automation at TI →</a></article>
    <article class="card"><h2>Physical design and reliability</h2><p>Open-source RTL-to-layout flows, custom layout, transistor-level simulation, and power-grid checks.</p>${tags(["OpenLane", "Magic VLSI", "Ngspice", "Ansys Redhawk", "CMOS logic"])}<a class="text-link" href="projects/risc-v-openlane.html">OpenLane case study →</a></article>
    <article class="card"><h2>Hardware architecture</h2><p>Processor pipelines, FPGA memory organization, and configurable hardware for computation.</p>${tags(["Verilog", "PicoRV32", "ARM v7", "MIPS", "FPGA BRAM / LUTs", "Computer architecture"])}<a class="text-link" href="projects.html#academic">Academic systems →</a></article>
    <article class="card"><h2>Software and engineering environments</h2><p>Programming and system tools used alongside hardware development, from GUI assemblers to embedded experiments.</p>${tags(["Python", "C / C++", "MATLAB", "Linux", "SFTP", "Raspberry Pi"])}<a class="text-link" href="projects.html#academic">Explore the projects →</a></article></section>`,
  },
  leadership: {
    title: "Building capability together.",
    description:
      "Engineering initiative, student leadership, hands-on teaching, and signal-processing competition work.",
    body: `<section class="timeline">
    <article class="timeline-item"><p>2023 – Present · AMD</p><div class="timeline-main"><h2>Internal CAD automation initiatives</h2><p>Alongside my core AMS modeling responsibilities, I take initiative in developing verification flows, custom automation hooks, and regression test suites. Python and TCL are central to that work.</p><a class="text-link" href="experience.html#amd">Engineering experience →</a></div></article>
    <article class="timeline-item"><p>April 2020 – April 2023 · IEEE NITK</p><div class="timeline-main"><h2>Circuits and Systems Society Chair</h2><p>Organized Embedathon in 2022 and 2023, an all-India embedded-systems hackathon with over 100 participating teams. Led computer-architecture mentorship for first-year students and knowledge-transfer sessions on Ngspice, Magic VLSI, and CMOS logic design.</p></div></article>
    <article class="timeline-item"><p>January 2023 · NITK</p><div class="timeline-main"><h2>OpenLane training instructor</h2><p>Conducted hands-on ASIC training under Prof. Ramesh Kini for Bachelor’s and Master’s students. Sessions covered the RTL-to-GDSII flow, tool execution, synthesis optimization, and layout debugging.</p><a class="text-link" href="projects/risc-v-openlane.html">Related OpenLane work →</a></div></article>
    <article class="timeline-item"><p>January – May 2021 · IEEE Signal Processing Cup</p><div class="timeline-main"><h2>13th globally</h2><p>Worked on configuring an intelligent reflecting surface for beyond-5G wireless communication. The algorithm combined gradient-descent optimization with greedy random search to improve received signals.</p></div></article></section>`,
  },
  contact: {
    title: "Let’s talk engineering.",
    description:
      "Get in touch about silicon design, CAD automation, hardware projects, or technical collaboration.",
    body: `<section class="prose"><h2>Start a conversation</h2><p>Email is a good place to share a technical question, project context, or an introduction.</p><p><a class="button" href="mailto:krutideepan123@gmail.com">Email Kruti</a></p></section>
    <section class="cards" aria-label="Contact methods"><article class="card"><h2>Email</h2><p><a href="mailto:krutideepan123@gmail.com">krutideepan123@gmail.com</a></p><button class="text-link" type="button" data-copy-email="krutideepan123@gmail.com" hidden>Copy email address</button><p data-copy-status role="status"></p></article>
    <article class="card"><h2>LinkedIn</h2><p>Professional profile and connections.</p>${external("https://www.linkedin.com/in/kruti-deepan-panda-0a93081a5/", "Kruti Deepan Panda")}</article>
    <article class="card"><h2>GitHub</h2><p>Code, documentation, and ongoing experiments.</p>${external("https://github.com/krutideepanpanda", "@krutideepanpanda")}</article></section>`,
  },
};

const riscv =
  "https://github.com/krutideepanpanda/RISC-V-based-micro-controller-using-OpenLane";
const alu = "https://github.com/krutideepanpanda/4-Bit-ALU-using-Magic-VLSI";
const caseStudies = {
  "risc-v-openlane": {
    title: "Taking PicoRV32 through OpenLane.",
    description:
      "An academic exploration of processor configuration, physical implementation, and timing tradeoffs.",
    body: `<p><a class="text-link" href="../projects.html#academic">← Academic projects</a></p><dl class="facts"><div><dt>When</dt><dd>January – April 2022</dd></div><div><dt>Where</dt><dd>NITK · Prof. Ramesh Kini</dd></div><div><dt>Team</dt><dd>Kruti Deepan Panda and Rahul Magesh</dd></div></dl>
    <section class="prose"><h2>The question</h2><p>How do processor configuration choices translate into physical-design constraints? Our EC383 project explored PicoRV32 configurations through OpenLane using SkyWater 130nm technology.</p><h2>Architecture and implementation</h2><p>We compared PCPI-enabled configurations, AXI interfaces, multiplication, and two-cycle ALU and comparison options. Routing memory demands led us to focus on the base core with PCPI. Our contribution was configuration exploration and implementation-flow tuning; PicoRV32 and OpenLane are upstream projects.</p></section>
    <figure class="card"><svg viewBox="0 0 600 360" role="img" aria-labelledby="flow-title flow-desc"><title id="flow-title">OpenLane implementation flow</title><desc id="flow-desc">PicoRV32 configuration passes through synthesis, floorplanning, placement, clock tree synthesis, and routing to GDSII. Timing reports guide configuration changes.</desc><g fill="none" stroke="currentColor" stroke-width="2"><rect x="20" y="20" width="560" height="45" rx="4"/><rect x="20" y="85" width="560" height="45" rx="4"/><rect x="20" y="150" width="560" height="45" rx="4"/><rect x="20" y="215" width="560" height="45" rx="4"/><rect x="20" y="280" width="560" height="45" rx="4"/><path d="M300 65v20m0 45v20m0 45v20m0 45v20"/></g><g fill="currentColor" text-anchor="middle" font-family="sans-serif" font-size="20"><text x="300" y="49">PicoRV32 configuration</text><text x="300" y="114">Synthesis</text><text x="300" y="179">Floorplanning and placement</text><text x="300" y="244">Clock tree and routing</text><text x="300" y="309">Timing review and GDSII</text></g></svg><figcaption>Configuration choices meet physical constraints through the implementation flow.</figcaption></figure>
    <section class="prose"><h2>Decisions and verification</h2><p>We adjusted synthesis strategy, density, and clock-related settings while investigating timing and routing issues.</p><h2>Implementation results</h2><p>The documented runs, reports, and layout views trace the configuration changes through the OpenLane flow. This work covers implementation-flow exploration and does not include fabricated-silicon measurements.</p><h2>Project files</h2><p>${external(riscv, "Repository and implementation notes")}</p><p>${external(riscv + "/blob/main/VLSI_MP_191EC126_191EC145.pdf", "Project report (PDF)")}</p></section>`,
  },
  "4-bit-alu": {
    title: "A small ALU, checked from the layout up.",
    description:
      "Standard-cell layout in Magic VLSI with automated switch-level verification.",
    body: `<p><a class="text-link" href="../projects.html#academic">← Academic projects</a></p><dl class="facts"><div><dt>When</dt><dd>November 2021</dd></div><div><dt>Where</dt><dd>NITK · Prof. Ramesh Kini</dd></div><div><dt>Work</dt><dd>Academic layout and verification project</dd></div></dl>
    <section class="prose"><h2>From operations to physical layout</h2><p>I implemented a four-bit ALU for addition, bitwise AND, and bitwise OR using Pharosc standard cells in Magic VLSI. The project connects logic design with a physical layout and an automated check of its behavior.</p><h2>Implementation and verification</h2><p>Magic extracts the layout to a <code>.sim</code> representation, which IRSIM simulates at switch level. A Python generator produces simulator commands, and a Bash script runs the workflow.</p><p>The result checker compares AND and OR outputs with Python’s bitwise operations. Addition includes the carry-out bit when calculating the observed result. Random input vectors make repeated checks easier to run.</p><h2>Verification results</h2><p>The repository includes the layout, extracted simulation file, command generator, verification code, and a project report. The checks exercise randomized inputs rather than exhaustive verification.</p><h2>Project files</h2><p>${external(alu, "Repository and reproduction instructions")}</p><p>${external(alu + "/blob/main/Report.pdf", "Project report (PDF)")}</p><p>${external(alu + "/blob/main/logVerify.py", "Result checker")}</p></section>`,
  },
};

module.exports = { pages, caseStudies, sources };
