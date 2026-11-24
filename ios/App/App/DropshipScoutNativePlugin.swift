import Foundation
import Capacitor
import StoreKit
import LocalAuthentication
import UIKit

@objc(DropshipScoutNativePlugin)
public class DropshipScoutNativePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "DropshipScoutNativePlugin"
    public let jsName = "DropshipScoutNative"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getProducts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "currentEntitlements", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "manageSubscriptions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "biometryInfo", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "authenticate", returnType: CAPPluginReturnPromise),
    ]
    private var updatesTask: Task<Void, Never>?

    override public func load() {
        updatesTask = Task.detached { [weak self] in
            for await result in Transaction.updates {
                guard case .verified(let transaction) = result else { continue }
                await transaction.finish()
                let payload = DropshipScoutNativePlugin.serialize(transaction, jws: result.jwsRepresentation)
                self?.notifyListeners("transactionUpdated", data: ["transaction": payload])
            }
        }
    }

    deinit { updatesTask?.cancel() }

    static func serialize(_ t: Transaction, jws: String) -> [String: Any] {
        let formatter = ISO8601DateFormatter()
        var value: [String: Any] = [
            "productId": t.productID,
            "originalTransactionId": String(t.originalID),
            "transactionId": String(t.id),
            "jws": jws,
            "revoked": t.revocationDate != nil,
        ]
        if let expires = t.expirationDate {
            value["expiresDate"] = formatter.string(from: expires)
        } else {
            value["expiresDate"] = NSNull()
        }
        return value
    }

    static func entitlementTransactions() async -> [[String: Any]] {
        var out: [[String: Any]] = []
        for await result in Transaction.currentEntitlements {
            if case .verified(let t) = result { out.append(serialize(t, jws: result.jwsRepresentation)) }
        }
        return out
    }

    @objc func getProducts(_ call: CAPPluginCall) {
        let ids = call.getArray("productIds", String.self) ?? []
        Task {
            do {
                let products = try await Product.products(for: ids)
                call.resolve(["products": products.map { p -> [String: Any] in
                    var period: Any = NSNull()
                    var intro: Any = NSNull()
                    if let sub = p.subscription {
                        switch sub.subscriptionPeriod.unit {
                        case .year: period = "year"
                        case .month: period = "month"
                        case .week: period = "week"
                        case .day: period = "day"
                        @unknown default: period = NSNull()
                        }
                        if let offer = sub.introductoryOffer {
                            intro = offer.paymentMode == .freeTrial ? "Free trial" : "Intro offer \(offer.displayPrice)"
                        }
                    }
                    return ["id": p.id, "displayName": p.displayName, "description": p.description,
                            "displayPrice": p.displayPrice, "price": NSDecimalNumber(decimal: p.price).doubleValue,
                            "period": period, "introOffer": intro]
                }])
            } catch {
                call.reject("Could not load App Store products: \(error.localizedDescription)")
            }
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        guard let id = call.getString("productId") else { call.reject("productId is required"); return }
        var options: Set<Product.PurchaseOption> = []
        if let token = call.getString("appAccountToken"), let uuid = UUID(uuidString: token) {
            options.insert(.appAccountToken(uuid))
        }
        Task { @MainActor in
            do {
                guard let product = try await Product.products(for: [id]).first else { call.reject("Product not found"); return }
                let result = try await product.purchase(options: options)
                switch result {
                case .success(let verification):
                    switch verification {
                    case .verified(let transaction):
                        await transaction.finish()
                        call.resolve(["status": "purchased", "transaction": Self.serialize(transaction, jws: verification.jwsRepresentation)])
                    case .unverified(_, let error):
                        call.reject("The App Store could not verify the purchase: \(error.localizedDescription)")
                    }
                case .userCancelled: call.resolve(["status": "cancelled"])
                case .pending: call.resolve(["status": "pending"])
                @unknown default: call.resolve(["status": "unknown"])
                }
            } catch {
                call.reject("Purchase failed: \(error.localizedDescription)")
            }
        }
    }

    @objc func restore(_ call: CAPPluginCall) {
        Task {
            do { try await AppStore.sync() } catch { }
            call.resolve(["transactions": await Self.entitlementTransactions()])
        }
    }

    @objc func currentEntitlements(_ call: CAPPluginCall) {
        Task { call.resolve(["transactions": await Self.entitlementTransactions()]) }
    }

    @objc func manageSubscriptions(_ call: CAPPluginCall) {
        Task { @MainActor in
            guard let scene = self.bridge?.viewController?.view.window?.windowScene else { call.reject("No window"); return }
            do { try await AppStore.showManageSubscriptions(in: scene); call.resolve() }
            catch { call.reject(error.localizedDescription) }
        }
    }

    @objc func biometryInfo(_ call: CAPPluginCall) {
        let context = LAContext()
        var error: NSError?
        let available = context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &error)
        let type: String
        switch context.biometryType {
        case .faceID: type = "faceId"
        case .touchID: type = "touchId"
        default:
            if #available(iOS 17.0, *), context.biometryType == .opticID { type = "opticId" } else { type = "passcode" }
        }
        call.resolve(["available": available, "type": type])
    }

    @objc func authenticate(_ call: CAPPluginCall) {
        let context = LAContext()
        context.localizedCancelTitle = "Cancel"
        context.evaluatePolicy(.deviceOwnerAuthentication, localizedReason: call.getString("reason") ?? "Unlock Dropship Scout") { ok, error in
            let data: [String: Any] = ok ? ["ok": true] : ["ok": false, "error": error?.localizedDescription ?? "cancelled"]
            call.resolve(data)
        }
    }
}
