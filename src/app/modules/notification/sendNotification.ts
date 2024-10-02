import admin from "firebase-admin";
import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import NotificationModel from "./notification.model";
// Initialize Firebase Admin with a service account

// const clinicaSericeAccountFile = path.join(process.cwd(), './firebase/clinica-serice-account-file.json');
admin.initializeApp({
  credential: admin.credential.cert("./clinica-b05e8-firebase-admin-sdk.json"),
  // credential: admin.credential.cert(clinicaSericeAccountFile),
});
type NotificationPayload = {
  title: string;
  body: string;
  data?: { [key: string]: string };
  link?: string;
  type: string;
  userId: string;
  time?: string;
};

export const sendNotification = async (
  fcmToken: string[],
  payload: NotificationPayload,
): Promise<any> => {
  try {
    const response = await admin.messaging().sendEachForMulticast({
      tokens: fcmToken,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      apns: {
        headers: {
          "apns-push-type": "alert",
        },
        payload: {
          aps: {
            badge: 1,
            sound: "default",
          },
        },
      },
    });

    if (response.successCount) {
      fcmToken?.map(async (token) => {
        try {
          const newNotification = await NotificationModel.create({
            fcmToken: token,
            title: payload.title,
            message: payload.body,
            date: new Date(),
            isRead: false,
            link: payload.link,
            time: payload.time,
            type: payload.type,
            userId: payload.userId,
          });

          console.log(newNotification);
        } catch (error) {
          console.log(error);
        }
      });
    }

    return response;
  } catch (error: any) {
    console.error("Error sending message:", error);
    if (error?.code === "messaging/third-party-auth-error") {
      return null;
    } else {
      console.error("Error sending message:", error);
      throw new AppError(
        httpStatus.NOT_IMPLEMENTED,
        error.message || "Failed to send notification",
      );
    }
  }
};
