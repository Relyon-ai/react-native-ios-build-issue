/**
 * @format
 */

import { MIXPANEL_KEY } from "@env";
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from "@react-native-firebase/messaging";
import { Mixpanel } from "mixpanel-react-native";
import { Alert, AppRegistry, Platform } from "react-native";
import BackgroundGeolocation from "react-native-background-geolocation";
import "react-native-gesture-handler";
import App from "./App";
import { name as appName } from "./app.json";
import { StorageKey } from "./Constants/common/storage";
import { i18n } from './i18n';
import { NotificationType } from "./interfaces";
import { navigationRef } from "./rootNavigation";
import { uiStore, userStore } from "./stores";
import { handleNotification, isNotDevelopment } from "./utils";


//---------------------------// MixPanel Config //---------------------------//
if (isNotDevelopment()) {
    const trackAutomaticEvents = true;
    const mixpanel = new Mixpanel(MIXPANEL_KEY, trackAutomaticEvents);
    // mixpanel.init();
    mixpanel.setLoggingEnabled(true);
    userStore.updateMixPanel(mixpanel);
}

// //---------------------------// Firebase Messaging Config //---------13------------------//
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log("[NOTIFICATION] [FIREBASE] Message handled in the background!", remoteMessage);
});

messaging().onMessage(async notification => {
    console.log("[NOTIFICATION] DATA:", notification.data);
    console.log("[NOTIFICATION]", notification);
    console.log('[NOTIFICATION] Type', notification.data.notificationType);
    handleNotificationRequest(notification);
});

function handleNotificationRequest(notification) {
    switch (notification.data.notificationType) {
        case NotificationType.SERVER_NOTIFICATION: {
            if (Platform.OS !== "ios") {
                handleNotification(notification.data.title, notification.data.body)
            }
            break;
        }
        case NotificationType.SERVER_CHECK_IN_REQUEST:
            // Added the userResponded to reset it's value on new message.
            // This value is to indicate to the admin in the dashboard of the check-in status.
            userStore.updateValueInStoreAndDB("serverCheckIn", {
                checkInContent:
                    notification?.message ||
                    notification?.data?.checkInContent,
                userResponded: false,
                userHasCheckIn: true,
            });
            uiStore.updateNotificationData(notification.data);
            if (Platform.OS !== "ios") {
                handleNotification(notification.data.title, notification.data.body)
            }
            break;
        case NotificationType.CHECK_IN_REQUEST:
            if (notification.data.senderId !== userStore.user.UID) {
                userStore.updateCheckInRequest(notification.data);
                console.log("[CHECK_IN] REQUEST INSIDE", notification.data);
                navigationRef.current?.navigate(
                    "FindMy",
                    notification.data.notificationType,
                );
            }
            break;
        case NotificationType.CHECK_IN_RESPONSE:
            Alert.alert(
                `${notification.data.notificationSenderName} ${i18n.t("acceptedCheckIn")}`,
            );
            userStore.removeUserFromPendingCheckInRequest(
                notification.data.notificationSenderId,
            );
            break;
        case NotificationType.CHECK_IN_IGNORE:
            console.log("[CHECK_IN] IGNORE INSIDE", notification.data);
            Alert.alert(
                `${notification.data.notificationSenderName} ignored your check-in request!`,
            );
            userStore.updateCheckInRequest(notification.data);
            break;
        case NotificationType.CHECK_IN_DANGER:
            console.log("[CHECK_IN] DANGER INSIDE", notification.data);
            navigationRef.current?.navigate(
                "FindMy",
                notification.data.notificationType,
            );
            userStore.updateCheckInRequest(notification.data);
            userStore.removeUserFromPendingCheckInRequest(
                notification.data.notificationSenderId,
            );
            break;
        default:
            break;
    }
}

AppRegistry.registerComponent(appName, () => App);

//---------------------------// Headless Task //---------------------------//
let HeadlessTask = async (event) => {
    const params = event.params; // <-- our event-data from the BG Geo SDK.
    const eventName = event.name;
    const taskId = event.taskId; // <-- very important!

    console.log(`[BGGeoHeadlessTask] ${eventName} ${taskId}`, JSON.stringify(params));

    const userId = await AsyncStorage.getItem(StorageKey.userId);

    if (!userId) {
        console.log(`[BGGeoHeadlessTask] ${eventName} ${taskId} not userId`, userId);
        return;
    }

    // Add try-catch to prevent task crashes
    try {
        console.log('[HeadlessTask] Event received:', event.name);

        switch (event.name) {
            case 'terminate': {
                await BackgroundGeolocation.start();
                await BackgroundGeolocation.changePace(true)
                const geofences = await BackgroundGeolocation.getGeofences();
                console.log('[HeadlessTask] geofences', geofences);
                BackgroundGeolocation.onGeofence((point) => {
                    console.log('[HeadlessTask] [onGeofence] event', point);
                    userStore.notificationLocation(point);
                })
                break;
            }
            case 'location': {
                console.log('[HeadlessTask] location event', event.params);
                break;
            }
            case 'geofence': {
                console.log('[HeadlessTask] event', event.params);
                userStore.notificationLocation(event.params);
                break;
            }
        }
    } catch (error) {
        console.error('[HeadlessTask] Error:', error);
    } finally {
        // Ensure task is properly finished
        if (event.taskId) {
            BackgroundGeolocation.stopTask(event.taskId);
        }
    }
};

BackgroundGeolocation.registerHeadlessTask(HeadlessTask);

