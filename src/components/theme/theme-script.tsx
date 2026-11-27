/**
 * Applies the saved theme and motion preference before first paint (no flash).
 * Reads cookies on the client so the root layout stays statically prerenderable
 * (see node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md).
 */
export const THEME_COOKIE = 'kulto_theme'
export const MOTION_COOKIE = 'kulto_motion'

const script = `(function(){try{var d=document.documentElement;var m=document.cookie.match(/(?:^|; )${THEME_COOKIE}=([^;]*)/);var p=m?decodeURIComponent(m[1]):'system';if(p!=='light'&&p!=='dark')p='system';var t=p==='system'?(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):p;d.setAttribute('data-theme',t);d.setAttribute('data-theme-pref',p);var r=document.cookie.match(/(?:^|; )${MOTION_COOKIE}=reduced/);if(r)d.setAttribute('data-motion','reduced');}catch(e){}})()`

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />
}
