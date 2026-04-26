Build this as a React app using Vite. Single page, no routing needed
Build a clean, minimal web app called "StreamView" for testing YouTube Live stream embedding. The app should have only one purpose: embed and play a YouTube Live stream (via unlisted YouTube URL) in a fully custom player UI.
Core Feature:

Accept a YouTube video/stream ID or full URL as input
Embed the YouTube stream using the YouTube IFrame API
Hide ALL default YouTube UI completely — no YouTube logo, no title bar, no suggested videos, no progress bar from YouTube, no YouTube controls whatsoever
Use controls=0, modestbranding=1, rel=0, showinfo=0, iv_load_policy=3 in the embed parameters

Custom Player Controls (build these from scratch, no YouTube UI):

Play / Pause button (custom styled)
Mute / Unmute toggle
Fullscreen button
A simple custom progress indicator or "LIVE" badge (since it's a live stream)
Volume slider
All controls should be custom HTML/CSS — must NOT look like YouTube at all

Design System — match Claude AI's aesthetic exactly:

Color palette: Deep navy/dark background (#1a1b2e or similar dark slate), with soft white text (#f8f8f8), and accent color in warm coral/orange (#da7756) for active states and buttons
Typography: Use Instrument Serif from Google Fonts for all headings and labels
UI feel: Clean, minimal, spacious — lots of breathing room, soft shadows, rounded corners (12–16px radius)
The player should sit centered on the page inside a sleek card with a subtle glow/shadow
Input field to paste YouTube URL should be elegant — styled like Claude's input box (soft border, dark fill, rounded)
A "Load Stream" button in the accent color

Layout:

Single page app
Top: App name "StreamView" in Instrument Serif, subtitle "Live Stream Tester"
Middle: The custom video player (16:9 ratio, responsive)
Below player: Custom control bar (play, mute, volume, fullscreen, LIVE badge)
Bottom: URL input field + Load Stream button