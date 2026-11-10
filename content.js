/* PORTFOLIO CONTENT
 * The easiest way to change this file is the editor: open editor.html.
 * The editor rewrites this file when you click "Publish".
 * You can still edit it by hand. Keep the JSON-style structure intact.
 *
 * Headlines: wrap words in [square brackets] to highlight them in the
 * Motion style, for example "Let's [build] something."
 */
window.portfolioContent = {
  "settings": {
    "style": "motion",
    "theme": "light"
  },
  "profile": {
    "name": "Arnav Saraf",
    "tagline": "Electrical Engineering · Waterloo",
    "status": "Current status: work term",
    "headline": "Electrical [Engineering] @Waterloo",
    "intro": "",
    "resumeLabel": "View resume",
    "resumeUrl": "https://drive.google.com/file/d/1xwgMl6AtB6WWFLZDLwqeI7deRgm5fsGv/view?usp=drive_link"
  },
  "about": {
    "title": "About me",
    "headline": "About",
    "paragraphs": [
      "I'm an Electrical Engineering co-op student at the University of Waterloo with a strong interest in RF engineering, particularly its applications in the aerospace industry. I enjoy working on hands-on projects that challenge me to learn new skills and explore different areas of engineering.",
      "At Waterloo, I've been involved in engineering design teams such as WARG (Waterloo Aerial Robotics Group) and have attended engineering and industry events. Outside of academics, I'm a member of the Waterloo varsity squash team and enjoy hiking, kayaking and skiing."
    ]
  },
  "projects": {
    "title": "Projects",
    "intro": "",
    "items": [
      {
        "title": "1.09 GHz Aviation Receiver",
        "category": "RF & software-defined radio",
        "image": "assets/aviation.png",
        "imageAlt": "Illustrated aircraft and radio signal arcs",
        "link": "https://docs.google.com/document/d/1nEfThNBL2hFGmHhkD_LWBQplTAdufMOF/edit",
        "description": "ADS-B receiver combining a custom patch antenna, bandpass filter and SDR to decode aircraft telemetry."
      },
      {
        "title": "High Frequency Doppler Radar",
        "category": "RF & analog electronics",
        "image": "assets/radar.png",
        "imageAlt": "Illustrated radar sweep and detected targets",
        "link": "https://docs.google.com/document/d/1bPIoLNgSs5qAKqPfghf8_KdPklqAOcG8/edit",
        "description": "Continuous-wave radar that translates reflected RF signals into a conditioned Doppler signal for speed measurement."
      },
      {
        "title": "FPGA Heart Rate Monitor",
        "category": "FPGA & signal processing",
        "image": "assets/fpga.png",
        "imageAlt": "Illustrated digital chip and pulse waveform",
        "link": "https://docs.google.com/document/d/13BJlaQaq8XgfFDfZAPOtqQ4pkigBaaWg/edit",
        "description": "Real-time PPG processing with digital filtering, adaptive heartbeat detection, smoothed BPM and an SPI ADC interface."
      }
    ]
  },
  "experience": {
    "title": "Experience",
    "intro": "Co-op terms in industrial controls, heaters and sensors.",
    "items": [
      {
        "company": "MPI Morheat",
        "logo": "assets/mpi.jpg",
        "role": "Electrical Engineering Intern (Sept 2026 - Present)",
        "bullets": [
          "Automated heater power calculations and quoting workflows using Java and Python.",
          "Drafted sensor and heater concepts and incorporated design revisions in AutoCAD and Fusion 360.",
          "Soldered connectors for RTD and thermocouple sensor assemblies.",
          "Refined mechanical and electrical CAD drawings in AutoCAD and Altium Designer, adapting schematics to meet custom client order specifications and manufacturing constraints."
        ]
      },
      {
        "company": "Quantum Technology Corp.",
        "logo": "assets/qtc.jpg",
        "role": "Electrical Engineering Intern (Jan 2026 - May 2026)",
        "bullets": [
          "Designed and assembled control panels in AutoCAD Electrical for industrial gas systems, following applicable IEC, CSA and UL requirements.",
          "Integrated PLCs, instrumentation, motor starters, VFDs and power distribution equipment.",
          "Tested panels and PCBs using oscilloscopes and bench equipment; documented quality-control results.",
          "Led electrical design for a mobile helium recovery system, including 480 V power distribution and purity and flow monitoring.",
          "Participated in HAZOP discussions and prepared an electrical safety presentation."
        ]
      },
      {
        "company": "Waterloo Aerial Robotics Group (WARG)",
        "logo": "assets/uploads/images-mwawbz14.jpg",
        "role": "Electrical Team Member",
        "bullets": [
          "Designed voltage-regulation and data-acquisition PCBs for autonomous flight hardware in Altium Designer, including schematic capture, component selection and layout.",
          "Assembled and tested custom PCBs for both rapid prototyping and competition purposes."
        ]
      }
    ]
  },
  "keywords": [
    "RF Engineering",
    "Analog electronics"
  ],
  "contact": {
    "title": "Let's [talk].",
    "text": "Open to co-op roles and projects in RF, aerospace and embedded hardware.",
    "email": "a5saraf@uwaterloo.ca",
    "links": []
  },
  "footer": {
    "text": "Arnav Saraf / Engineering Portfolio"
  }
};
