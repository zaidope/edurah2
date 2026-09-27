import { ViewTransition } from 'react';

/**
 * PageTransition — wrap each page's content to opt into directional
 * slide transitions powered by React's ViewTransition + the browser
 * View Transitions API.  Links tagged with transitionTypes={['nav-forward']}
 * trigger a left-slide; 'nav-back' triggers a right-slide.
 *
 * Usage:  <PageTransition>{children}</PageTransition>
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition
      enter={{
        'nav-forward': 'slide-forward',
        'nav-back': 'slide-back',
        default: 'page-fade',
      }}
      exit={{
        'nav-forward': 'slide-forward',
        'nav-back': 'slide-back',
        default: 'page-fade',
      }}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
