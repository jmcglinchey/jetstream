import * as React from 'react';
function SvgBug(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <g fill="unset">
        <path d="M19.6 10h12.8a1.51 1.51 0 001.43-1.75A8 8 0 0026 2a8.05 8.05 0 00-7.83 6.24A1.51 1.51 0 0019.6 10z" />
        <path d="M47.59 30.8A2.4 2.4 0 0050 28.24 2.47 2.47 0 0047.43 26h-7v-4c4.64-1.84 7.91-6.8 8-12.71a2.48 2.48 0 00-2-2.48 2.39 2.39 0 00-2.8 2.4 9.14 9.14 0 01-3.92 7.83 4.87 4.87 0 00-4.08-2.24H16.41a4.87 4.87 0 00-4.08 2.24 9 9 0 01-3.92-7.66 2.53 2.53 0 00-2.24-2.56 2.39 2.39 0 00-2.55 2.4c0 5.91 3.35 11 8 12.79v4h-7A2.53 2.53 0 002 28.24a2.44 2.44 0 002.41 2.56h7.2v4C7 36.64 3.7 41.59 3.62 47.51a2.48 2.48 0 002 2.48 2.39 2.39 0 002.8-2.4 9 9 0 013.84-7.76 14.4 14.4 0 009.27 9.44 1.61 1.61 0 002.08-1.52V28.56A2.53 2.53 0 0125.84 26a2.44 2.44 0 012.56 2.4v19.35a1.58 1.58 0 002.08 1.52 14.4 14.4 0 009.27-9.44 9.25 9.25 0 013.84 7.6A2.53 2.53 0 0045.83 50a2.4 2.4 0 002.56-2.4c0-5.92-3.36-11-8-12.79v-4z" />
      </g>
    </svg>
  );
}
export default SvgBug;
