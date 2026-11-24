import { NATIVE_IOS_UA_TOKEN } from '@/lib/native/platform'

/**
 * Tiny pre-paint script: tags <html> with `native-ios` inside the iOS app so
 * `.web-only` content (sister-site banners, web billing copy) is hidden before
 * the first frame and safe-area padding applies. No effect on the web.
 */
export function NativeClassScript() {
  const js = `(function(){try{if(navigator.userAgent.indexOf(${JSON.stringify(NATIVE_IOS_UA_TOKEN + '/')})!==-1){document.documentElement.classList.add('native-ios');var m=document.querySelector('meta[name=viewport]');if(m&&m.content.indexOf('viewport-fit')===-1){m.content+=',viewport-fit=cover'}}}catch(e){}})();`
  return <script dangerouslySetInnerHTML={{ __html: js }} />
}
