# FitMe Proguard / R8 Release Rules
-keepattributes SourceFile,LineNumberTable
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod

# Capacitor core and plugins
-keep class com.getcapacitor.** { *; }
-keep interface com.getcapacitor.** { *; }
-keep class * extends com.getcapacitor.Plugin { *; }
-keep class * extends com.getcapacitor.BridgeActivity { *; }
-keep class com.sindulis.fitmeai.** { *; }

# Javascript Interface for WebView bridge
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# AndroidX & WorkManager
-keep class androidx.work.** { *; }
-keep class androidx.core.** { *; }
-keep class androidx.appcompat.** { *; }
-keep class * extends androidx.work.Worker { *; }
-keep class * extends androidx.work.ListenableWorker { *; }

# Google Play Services & Firebase
-keep class com.google.android.gms.** { *; }
-keep class com.google.firebase.** { *; }
-dontwarn com.google.android.gms.**
-dontwarn com.google.firebase.**

# Health Connect & Sensor libraries
-keep class androidx.health.** { *; }
-dontwarn androidx.health.**
-dontwarn com.capgo.**
-keep class com.capgo.** { *; }

# Optional Auth SDKs referenced by Capacitor Firebase Auth
-dontwarn com.facebook.**
-dontwarn com.twitter.**
-dontwarn com.google.firebase.auth.**

# Guava
-dontwarn com.google.common.**
-keep class com.google.common.** { *; }
