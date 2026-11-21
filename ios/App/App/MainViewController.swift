import Capacitor
import UIKit

/// Registers FitMe's own native plugins (in this app target, not npm packages) with the Capacitor bridge.
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(FitMeStepsPlugin())
    }
}
