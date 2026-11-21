import Capacitor
import CoreMotion
import Foundation
import UIKit

/// FitMe on-device steps (iOS). Core Motion's CMPedometer is counted by iOS in the background (no app process
/// needed) and keeps 7 days of history, so daily totals are correct even when FitMe was closed. Requires
/// NSMotionUsageDescription. HealthKit (Apple Watch and other apps) is read separately by the health plugin.
@objc(FitMeStepsPlugin)
public class FitMeStepsPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "FitMeStepsPlugin"
    public let jsName = "FitMeSteps"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "checkPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getDailySteps", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startLive", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopLive", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openAppSettings", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "batteryStatus", returnType: CAPPluginReturnPromise),
    ]
    private let pedometer = CMPedometer()
    private var zone: TimeZone = .current

    private func state() -> String {
        switch CMPedometer.authorizationStatus() {
        case .authorized: return "granted"
        case .denied, .restricted: return "denied"
        default: return "prompt"
        }
    }

    @objc func isAvailable(_ call: CAPPluginCall) {
        let ok = CMPedometer.isStepCountingAvailable()
        call.resolve(["available": ok, "sensor": ok, "recordingApi": false])
    }

    @objc override public func checkPermissions(_ call: CAPPluginCall) {
        call.resolve(["activity": state()])
    }

    /// iOS shows the motion prompt on the first query, so a one-hour query triggers it.
    @objc override public func requestPermissions(_ call: CAPPluginCall) {
        if state() != "prompt" { return call.resolve(["activity": state()]) }
        pedometer.queryPedometerData(from: Date().addingTimeInterval(-3600), to: Date()) { [weak self] _, _ in
            DispatchQueue.main.async { call.resolve(["activity": self?.state() ?? "denied"]) }
        }
    }

    @objc func start(_ call: CAPPluginCall) {
        if let tz = call.getString("timeZone"), let z = TimeZone(identifier: tz) { zone = z }
        guard CMPedometer.isStepCountingAvailable() else { return call.reject("unavailable", "UNAVAILABLE") }
        if state() == "denied" { return call.reject("permission_denied", "PERMISSION_DENIED") }
        call.resolve(["source": "coreMotion"])
    }

    @objc func stop(_ call: CAPPluginCall) {
        pedometer.stopUpdates()
        call.resolve()
    }

    @objc func getDailySteps(_ call: CAPPluginCall) {
        let days = max(1, min(7, call.getInt("days") ?? 7)) // Core Motion keeps 7 days
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = zone
        let fmt = DateFormatter()
        fmt.calendar = cal
        fmt.timeZone = zone
        fmt.dateFormat = "yyyy-MM-dd"
        let today = cal.startOfDay(for: Date())
        let group = DispatchGroup()
        var out = [[String: Any]](repeating: [:], count: days)
        for i in 0..<days {
            guard let start = cal.date(byAdding: .day, value: -(days - 1 - i), to: today) else { continue }
            let end = min(cal.date(byAdding: .day, value: 1, to: start) ?? Date(), Date())
            group.enter()
            pedometer.queryPedometerData(from: start, to: end) { data, _ in
                out[i] = ["date": fmt.string(from: start), "steps": data?.numberOfSteps.intValue ?? 0, "distanceM": data?.distance?.doubleValue ?? 0, "source": "coreMotion"]
                group.leave()
            }
        }
        group.notify(queue: .main) { call.resolve(["days": out]) }
    }

    @objc func startLive(_ call: CAPPluginCall) {
        guard CMPedometer.isStepCountingAvailable() else { return call.reject("unavailable", "UNAVAILABLE") }
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = zone
        pedometer.startUpdates(from: cal.startOfDay(for: Date())) { [weak self] data, _ in
            guard let data = data else { return }
            DispatchQueue.main.async { self?.notifyListeners("step", data: ["sensorStepsToday": data.numberOfSteps.intValue]) }
        }
        call.resolve()
    }

    /// Opens FitMe's page in the Settings app (for permissions the user denied).
    @objc func openAppSettings(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if let url = URL(string: UIApplication.openSettingsURLString) { UIApplication.shared.open(url) }
            call.resolve()
        }
    }

    @objc func stopLive(_ call: CAPPluginCall) {
        pedometer.stopUpdates()
        call.resolve()
    }

    /// iOS has no per-app battery optimisation that stops step counting (Core Motion records in hardware).
    @objc func batteryStatus(_ call: CAPPluginCall) {
        call.resolve(["optimised": false])
    }
}
