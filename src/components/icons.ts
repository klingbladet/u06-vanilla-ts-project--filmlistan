type IconProps = {
    className?: string;
  };
  
  const base = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"';
  
  export const Icons = {
    // outline search ok som outline
    search: ({ className = "h-5 w-5" }: IconProps) => `
      <svg ${base} class="${className}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 21l-4.35-4.35" />
        <circle cx="11" cy="11" r="7" />
      </svg>
    `,
  
    // STAR solid (fill  currentColor)
    starSolid: ({ className = "h-4 w-4" }: IconProps) => `
      <svg ${base} class="${className}" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"/>
      </svg>
    `,
  
    // HEART outline
    heart: ({ className = "h-4 w-4" }: IconProps) => `
      <svg ${base} class="${className}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"/>
      </svg>
    `,
  
    // HEART solid
    heartSolid: ({ className = "h-4 w-4" }: IconProps) => `
      <svg ${base} class="${className}" fill="currentColor">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    `,
  
    bookmark: ({ className = "h-4 w-4" }: IconProps) => `
      <svg ${base} class="${className}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
      </svg>
    `,
  
    check: ({ className = "h-4 w-4" }: IconProps) => `
      <svg ${base} class="${className}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    `,
  };
  