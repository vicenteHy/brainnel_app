package uni.UNIC87CC93

import android.app.Application
import android.content.res.Configuration

import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.ReactHost
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader

import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper

import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import android.util.Log

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost = ReactNativeHostWrapper(
        this,
        object : DefaultReactNativeHost(this) {
          override fun getPackages(): List<ReactPackage> {
            val packages = PackageList(this).packages
            // Packages that cannot be autolinked yet can be added manually here, for example:
            // packages.add(MyReactNativePackage())
            return packages
          }

          override fun getJSMainModuleName(): String = ".expo/.virtual-metro-entry"

          override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

          override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
          override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }
  )

  override val reactHost: ReactHost
    get() = ReactNativeHostWrapper.createReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, OpenSourceMergedSoMapping)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // If you opted-in for the New Architecture, we load the native entry point for this app.
      load()
    }
    ApplicationLifecycleDispatcher.onApplicationCreate(this)
    
    // 创建通知渠道（Android 8.0+）
    createNotificationChannel()
  }
  
  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      try {
        // 默认通知渠道
        val defaultChannel = NotificationChannel(
          "brainnel_default_channel",
          "Brainnel Notifications",
          NotificationManager.IMPORTANCE_HIGH
        ).apply {
          description = "General notifications from Brainnel"
          enableVibration(true)
          enableLights(true)
          setShowBadge(true)
        }
        
        // 订单通知渠道
        val orderChannel = NotificationChannel(
          "brainnel_order_channel",
          "Order Updates",
          NotificationManager.IMPORTANCE_HIGH
        ).apply {
          description = "Order status and delivery updates"
          enableVibration(true)
          enableLights(true)
          setShowBadge(true)
        }
        
        // 促销通知渠道
        val promoChannel = NotificationChannel(
          "brainnel_promo_channel",
          "Promotions & Offers",
          NotificationManager.IMPORTANCE_DEFAULT
        ).apply {
          description = "Special offers and promotional messages"
          enableVibration(true)
          setShowBadge(true)
        }
        
        // 活动通知渠道
        val activityChannel = NotificationChannel(
          "brainnel_activity_channel",
          "Activity Rewards",
          NotificationManager.IMPORTANCE_DEFAULT
        ).apply {
          description = "Mining game and activity rewards"
          enableVibration(true)
          setShowBadge(true)
        }
        
        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager?.let {
          it.createNotificationChannel(defaultChannel)
          it.createNotificationChannel(orderChannel)
          it.createNotificationChannel(promoChannel)
          it.createNotificationChannel(activityChannel)
          Log.d("MainApplication", "Notification channels created successfully")
        }
      } catch (e: Exception) {
        Log.e("MainApplication", "Error creating notification channels", e)
      }
    }
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }
}
