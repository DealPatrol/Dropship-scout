import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.colecollins.dropshipscout',
  appName: 'Dropship Scout',
  webDir: 'native-app/dist',
  // Always starts from bundled offline Scout Kit; never a remote URL.
  // The online account workspace opens on this one trusted host only.
  server: { allowNavigation: ['getdropshipscout.com'], errorPath: 'offline.html' },
  ios: {
    scheme: 'App',
    appendUserAgent: 'DropshipScoutiOS/1.0',
    contentInset: 'never',
    backgroundColor: '#0f172a',
    preferredContentMode: 'mobile',
  },
  plugins: {
    SplashScreen: { launchShowDuration: 600, backgroundColor: '#0f172a', showSpinner: false },
    LocalNotifications: { iconColor: '#426eff' },
  },
}
export default config
