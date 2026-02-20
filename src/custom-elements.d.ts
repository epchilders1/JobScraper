import type React from 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'l-ring': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        size?: string | number;
        stroke?: string | number;
        speed?: string | number;
        color?: string;
        'bg-opacity'?: string | number;
      };
    }
  }
}
