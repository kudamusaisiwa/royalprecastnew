import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate a consistent color based on a string (e.g., user name or email)
export function getAvatarColor(name: string): string {
  const colors = [
    'bg-blue-800 hover:bg-blue-900',
    'bg-red-800 hover:bg-red-900',
    'bg-green-800 hover:bg-green-900',
    'bg-purple-800 hover:bg-purple-900',
    'bg-pink-800 hover:bg-pink-900',
    'bg-indigo-800 hover:bg-indigo-900',
    'bg-orange-800 hover:bg-orange-900',
    'bg-teal-800 hover:bg-teal-900',
    'bg-cyan-800 hover:bg-cyan-900',
    'bg-slate-800 hover:bg-slate-900'
  ];

  // Generate a number from the string
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Use the hash to pick a color
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

// Get contrasting text color (white or black) based on background color
export function getContrastText(bgColor: string): string {
  return bgColor.includes('yellow') || bgColor.includes('cyan') ? 'text-gray-900' : 'text-white';
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price)
}
