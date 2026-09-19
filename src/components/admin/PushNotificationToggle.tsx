"use client";

import { useEffect, useState } from "react";
import { Bell, Check, Loader2 } from "lucide-react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationToggle() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.ready
        .then((reg) => {
          reg.pushManager.getSubscription().then((sub) => {
            if (sub) setIsSubscribed(true);
          });
        })
        .catch(() => {});
    }
  }, []);

  const enableNotifications = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      alert("Push notifications are not supported by this browser.");
      return;
    }

    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        alert("Please allow notification permissions in your browser to receive live order push alerts.");
        setLoading(false);
        return;
      }

      // Ensure service worker is registered
      if ("serviceWorker" in navigator) {
        await navigator.serviceWorker.register("/sw.js").catch(() => {});
      }

      const reg = await navigator.serviceWorker.ready;
      const vapidPublicKey =
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
        "BAOdRnhNF4JiNQPJe4VK0KNGdvQX0qzsnrX2AVEEtU_n_izAYJe6I1MRWlhZVqzuiolwZhyCC8YhpJx7VxMqGJI";

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const res = await fetch("/api/admin/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });

      if (res.ok) {
        setIsSubscribed(true);
      } else {
        console.error("Failed to persist push subscription to database");
      }
    } catch (err) {
      console.error("Subscription failed:", err);
      alert("Could not activate push notifications. Please verify browser notification settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={enableNotifications}
      disabled={isSubscribed || loading}
      title={isSubscribed ? "System push alerts active on this device" : "Enable native order push alerts"}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
        isSubscribed
          ? "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 cursor-default"
          : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-xs cursor-pointer active:scale-95"
      }`}
    >
      {isSubscribed ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
          <span>Live Alerts Active</span>
        </>
      ) : loading ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Activating...</span>
        </>
      ) : (
        <>
          <Bell className="w-3.5 h-3.5 animate-bounce" />
          <span>Enable Order Push Alerts</span>
        </>
      )}
    </button>
  );
}
