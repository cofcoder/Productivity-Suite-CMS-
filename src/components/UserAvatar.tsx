/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User } from 'lucide-react';

export const PRESET_AVATARS = [
  { id: 'preset-1', name: 'Golden Sun', gradient: 'from-[#ffe869] to-[#fbbe24]', emoji: '☀️' },
  { id: 'preset-2', name: 'Mint Fresh', gradient: 'from-[#adffd8] to-[#34d399]', emoji: '🌱' },
  { id: 'preset-3', name: 'Cosmic Purple', gradient: 'from-[#ded2ff] to-[#a78bfa]', emoji: '🔮' },
  { id: 'preset-4', name: 'Sunset Fire', gradient: 'from-[#ffb480] to-[#f87171]', emoji: '🔥' },
  { id: 'preset-5', name: 'Sky Flyer', gradient: 'from-[#bfeeff] to-[#60a5fa]', emoji: '🚀' },
  { id: 'preset-6', name: 'Sakura Heart', gradient: 'from-[#ffc3f2] to-[#f472b6]', emoji: '💖' },
  { id: 'preset-7', name: 'Cyber Spark', gradient: 'from-[#e4ffa1] to-[#34d399]', emoji: '⚡' },
  { id: 'preset-8', name: 'Deep Ocean', gradient: 'from-[#bbf7f2] to-[#2563eb]', emoji: '🐬' },
  { id: 'preset-9', name: 'Coffee Mocha', gradient: 'from-[#fef3c7] to-[#8c7851]', emoji: '☕' },
  { id: 'preset-10', name: 'Zen Mountain', gradient: 'from-[#f4f4f5] to-[#71717a]', emoji: '🏔️' },
];

export function getRandomPresetId(): string {
  const randomIndex = Math.floor(Math.random() * PRESET_AVATARS.length);
  return PRESET_AVATARS[randomIndex].id;
}

interface UserAvatarProps {
  avatar?: string | null;
  displayName?: string | null;
  className?: string; // container classes, e.g. "h-16 w-16"
  iconSizeClass?: string; // size for Lucide icon or text, e.g. "text-xl px-2 text-center" or "h-8 w-8"
}

export default function UserAvatar({ 
  avatar, 
  displayName, 
  className = "h-16 w-16",
  iconSizeClass = ""
}: UserAvatarProps) {
  // If we have a custom uploaded image (Base64 or URL)
  if (avatar && (avatar.startsWith('data:image/') || avatar.startsWith('http'))) {
    return (
      <div className={`rounded-2xl border-2 border-black flex items-center justify-center overflow-hidden shadow-[2px_2px_0px_0px_#000] flex-shrink-0 bg-white ${className}`}>
        <img 
          src={avatar} 
          alt={displayName || "User"} 
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // If it's a valid preset
  const matchedPreset = PRESET_AVATARS.find(p => p.id === avatar);
  if (matchedPreset) {
    return (
      <div className={`rounded-2xl border-2 border-black bg-gradient-to-br ${matchedPreset.gradient} flex items-center justify-center shadow-[2px_2px_0px_0px_#000] select-none flex-shrink-0 ${className}`}>
        <span className={`text-[1.8rem] leading-none ${iconSizeClass}`}>
          {matchedPreset.emoji}
        </span>
      </div>
    );
  }

  // Fallback: Initials or default user icon
  const initials = displayName
    ? displayName.trim().substring(0, 2).toUpperCase()
    : '';

  return (
    <div className={`rounded-2xl border-2 border-black bg-yellow-300 text-black flex items-center justify-center shadow-[2px_2px_0px_0px_#000] select-none flex-shrink-0 ${className}`}>
      {initials ? (
        <span className={`font-black uppercase text-xs sm:text-sm ${iconSizeClass}`}>
          {initials}
        </span>
      ) : (
        <User className={`stroke-[2.5] ${iconSizeClass || 'h-8 w-8'}`} />
      )}
    </div>
  );
}
