import Script from 'next/script'
import { adsConfig } from '@/lib/ads-config'

export function AdsTags() {
  const config = adsConfig()
  const googleId = config.gaMeasurementId ?? config.googleAdsId
  const googleConfigs = [
    config.gaMeasurementId ? `gtag('config', '${config.gaMeasurementId}');` : '',
    config.googleAdsId ? `gtag('config', '${config.googleAdsId}');` : '',
  ].join('')

  return (
    <>
      {config.metaPixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${config.metaPixelId}');fbq('track','PageView');`}
        </Script>
      )}
      {googleId && (
        <Script id="google-tags" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments);};gtag('js',new Date());${googleConfigs}var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id=${googleId}';document.head.appendChild(s);`}
        </Script>
      )}
    </>
  )
}
