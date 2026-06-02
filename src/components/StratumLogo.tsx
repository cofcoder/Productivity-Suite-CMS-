/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface StratumLogoProps {
  className?: string;
}

export default function StratumLogo({ className = "h-9 w-9" }: StratumLogoProps) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Neo-brutalist segmented "S" logo emblem */}
      <svg
        viewBox="0 0 100 120"
        className="h-full w-full filter drop-shadow-[1.5px_1.5px_0px_#1a1a1a]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Top-Left Segment: Warm Golden Accent */}
        <path
          d="M 50,15 A 25,25 0 0 0 25,40 A 25,25 0 0 0 50,65 L 50,51 A 11,11 0 0 1 39,40 A 11,11 0 0 1 50,29 Z"
          fill="#fbe144"
          stroke="#1a1a1a"
          strokeWidth="3.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Top-Right Segment: Cool Mint/Teal Accent */}
        <path
          d="M 50,15 A 25,25 0 0 1 75,40 A 25,25 0 0 1 50,65 L 50,51 A 11,11 0 0 0 61,40 A 11,11 0 0 0 50,29 Z"
          fill="#99ebd2"
          stroke="#1a1a1a"
          strokeWidth="3.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Bottom-Left Segment: Soft Lilac/Lavender Accent */}
        <path
          d="M 50,55 A 25,25 0 0 0 25,80 A 25,25 0 0 0 50,105 L 50,91 A 11,11 0 0 1 39,80 A 11,11 0 0 1 50,69 Z"
          fill="#cba3e8"
          stroke="#1a1a1a"
          strokeWidth="3.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Bottom-Right Segment: Cool Mint/Teal Accent */}
        <path
          d="M 50,55 A 25,25 0 0 1 75,80 A 25,25 0 0 1 50,105 L 50,91 A 11,11 0 0 0 61,80 A 11,11 0 0 0 50,69 Z"
          fill="#99ebd2"
          stroke="#1a1a1a"
          strokeWidth="3.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Central Vertical Joint line for neat geometric definition */}
        <path
          d="M 50,15 L 50,105"
          stroke="#1a1a1a"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        
        {/* Horizontal dividing joints */}
        <path
          d="M 25,40 L 39,40"
          stroke="#1a1a1a"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M 61,40 L 75,40"
          stroke="#1a1a1a"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M 25,80 L 39,80"
          stroke="#1a1a1a"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M 61,80 L 75,80"
          stroke="#1a1a1a"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
