import UIKit
import Capacitor

/// Root view controller. Registers the app's own native plugin (StoreKit 2 + Face ID)
/// that lives in this target rather than in an npm package.
class DropshipScoutViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(DropshipScoutNativePlugin())
    }
}
