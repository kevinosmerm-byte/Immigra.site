import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ application: UIApplication,
                     configurationForConnecting connectingSceneSession: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let config = UISceneConfiguration(name: "Default Configuration",
                                          sessionRole: connectingSceneSession.role)
        config.delegateClass = SceneDelegate.self
        return config
    }
}

import StoreKit

class ImmigraBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(ImmigraSubscriptions())
    }
}

@objc(ImmigraSubscriptions)
class ImmigraSubscriptions: CAPPlugin, CAPBridgedPlugin {
    let identifier = "ImmigraSubscriptions"
    let jsName = "ImmigraSubscriptions"
    let pluginMethods: [CAPPluginMethod] = ["products", "purchase", "restore", "pending", "finish"].compactMap {
        CAPPluginMethod(name: $0, returnType: CAPPluginReturnPromise)
    }
    private let allowedProducts: Set<String> = ["us.citizenshipai.app.pro.monthly", "us.citizenshipai.app.pro.annual"]
    private var updatesTask: Task<Void, Never>?

    override func load() {
        updatesTask = Task { [weak self] in
            for await result in Transaction.updates {
                guard let self else { return }
                if case .verified(let transaction) = result, self.allowedProducts.contains(transaction.productID) {
                    self.notifyListeners("transactionAvailable", data: ["signedTransaction": result.jwsRepresentation])
                }
            }
        }
    }
    deinit { updatesTask?.cancel() }

    @objc func purchase(_ call: CAPPluginCall) {
        guard let id = call.getString("id"), allowedProducts.contains(id),
              let account = call.getString("accountToken"), let token = UUID(uuidString: account) else {
            call.reject("Sign in before purchasing", "apple_account_required"); return
        }
        Task {
            do {
                guard let product = try await Product.products(for: [id]).first else {
                    call.reject("Product unavailable", "apple_product_unavailable"); return
                }
                switch try await product.purchase(options: [.appAccountToken(token)]) {
                case .success(let result):
                    guard case .verified = result else {
                        call.reject("Verification failed", "apple_transaction_invalid"); return
                    }
                    // The web layer finishes only after the server has saved verified access.
                    call.resolve(["status": "purchased", "signedTransaction": result.jwsRepresentation])
                case .userCancelled: call.resolve(["status": "cancelled"])
                case .pending: call.resolve(["status": "pending"])
                @unknown default: call.reject("Purchase unavailable", "apple_purchase_unavailable")
                }
            } catch { call.reject("Purchase could not be completed", "apple_purchase_unavailable") }
        }
    }

    private func transactions(_ call: CAPPluginCall, restore: Bool) {
        Task {
            do {
                if restore { try await AppStore.sync() }
                var values: [String] = []
                for await result in Transaction.currentEntitlements {
                    if case .verified(let transaction) = result, allowedProducts.contains(transaction.productID) {
                        values.append(result.jwsRepresentation)
                    }
                }
                for await result in Transaction.unfinished {
                    if case .verified(let transaction) = result, allowedProducts.contains(transaction.productID), !values.contains(result.jwsRepresentation) {
                        values.append(result.jwsRepresentation)
                    }
                }
                call.resolve(["transactions": values])
            } catch { call.reject("Restore unavailable", "apple_restore_unavailable") }
        }
    }
    @objc func restore(_ call: CAPPluginCall) { transactions(call, restore: true) }
    @objc func pending(_ call: CAPPluginCall) { transactions(call, restore: false) }
    @objc func finish(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else { call.reject("Missing transaction"); return }
        Task {
            for await result in Transaction.unfinished {
                if case .verified(let transaction) = result, String(transaction.id) == id, allowedProducts.contains(transaction.productID) {
                    await transaction.finish()
                }
            }
            call.resolve()
        }
    }

    @objc func products(_ call: CAPPluginCall) {
        guard let ids = call.getArray("ids", String.self), !ids.isEmpty, Set(ids).isSubset(of: allowedProducts) else {
            call.reject("Missing subscription product identifiers")
            return
        }
        Task {
            do {
                let products = try await Product.products(for: ids)
                let plans = products.filter { $0.type == .autoRenewable }.map {
                    ["id": $0.id, "name": $0.displayName, "price": $0.displayPrice]
                }
                call.resolve(["plans": plans])
            } catch {
                call.reject("Unable to load App Store subscriptions")
            }
        }
    }
}
