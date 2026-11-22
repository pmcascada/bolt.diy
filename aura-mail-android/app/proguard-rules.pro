# kotlinx.serialization
-keepattributes *Annotation*, InnerClasses
-keepclassmembers class com.auramail.** { *** Companion; }
-keepclasseswithmembers class com.auramail.** { kotlinx.serialization.KSerializer serializer(...); }
# Anthropic SDK (Jackson reflection)
-keep class com.anthropic.** { *; }
-keep class com.fasterxml.jackson.** { *; }
-dontwarn com.fasterxml.jackson.**
# MSAL
-keep class com.microsoft.identity.** { *; }
-dontwarn com.microsoft.identity.**
-dontwarn org.slf4j.**
