// import { useState } from "react";
// import { useTranslation } from "react-i18next";
// import {
//   useRegister,
//   useLogin,
//   useLogout,
//   useCurrentUser,
//   useGetAllUsers,
//   useUpdateRole,
// } from "@/features/auth/hooks";
// import {
//   useSendNotification,
//   useGetNotifications,
//   useNotificationSettings,
//   useUpdateNotificationSettings,
// } from "@/features/notifications/hooks";
// import { useUserStore } from "@/store/userStore";

// export default function TestAPI() {
//   const { t } = useTranslation();
//   const [email, setEmail] = useState("test@example.com");
//   const [password, setPassword] = useState("password123");

//   // Auth hooks
//   const register = useRegister();
//   const login = useLogin();
//   const logout = useLogout();
//   const { data: currentUser } = useCurrentUser();
//   const { data: allUsers } = useGetAllUsers();
//   const updateRole = useUpdateRole();

//   // Notification hooks
//   const sendNotification = useSendNotification();
//   const { data: notifications } = useGetNotifications();
//   const { data: settings } = useNotificationSettings();
//   const updateSettings = useUpdateNotificationSettings();

//   // User store
//   const { user, isAuthenticated } = useUserStore();

//   return (
//     <div style={{ padding: "20px", fontFamily: "monospace" }}>
//       <h1>{t("testAPI.title")}</h1>

//       {/* User Info */}
//       <div
//         style={{ background: "#f0f0f0", padding: "10px", marginBottom: "20px" }}
//       >
//         <h3>{t("testAPI.currentUser")}</h3>
//         <pre>{JSON.stringify({ user, isAuthenticated }, null, 2)}</pre>
//       </div>

//       {/* Auth Tests */}
//       <div style={{ marginBottom: "30px" }}>
//         <h2>{t("testAPI.auth.title")}</h2>

//         <div style={{ marginBottom: "10px" }}>
//           <input
//             type="email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             placeholder={t("testAPI.auth.emailPlaceholder")}
//             style={{ marginRight: "10px", padding: "5px" }}
//           />
//           <input
//             type="password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             placeholder={t("testAPI.auth.passwordPlaceholder")}
//             style={{ marginRight: "10px", padding: "5px" }}
//           />
//         </div>

//         <button
//           onClick={() =>
//             register.mutate({
//               email,
//               password,
//               confirm_password: password,
//             })
//           }
//           disabled={register.isPending}
//           style={{ marginRight: "10px", padding: "5px 10px" }}
//         >
//           {register.isPending ? "⏳" : "📝"} {t("testAPI.auth.register")}
//         </button>

//         <button
//           onClick={() => login.mutate({ email, password })}
//           disabled={login.isPending}
//           style={{ marginRight: "10px", padding: "5px 10px" }}
//         >
//           {login.isPending ? "⏳" : "🔑"} {t("testAPI.auth.login")}
//         </button>

//         <button
//           onClick={logout}
//           disabled={!isAuthenticated}
//           style={{ marginRight: "10px", padding: "5px 10px" }}
//         >
//           🚪 {t("testAPI.auth.logout")}
//         </button>

//         <button
//           onClick={() => {
//             if (user?.uuid) {
//               updateRole.mutate({
//                 userId: user.uuid,
//                 role: { role: "ADMIN" },
//               });
//             }
//           }}
//           disabled={!user?.uuid || updateRole.isPending}
//           style={{ padding: "5px 10px" }}
//         >
//           {updateRole.isPending ? "⏳" : "👑"} {t("testAPI.auth.makeAdmin")}
//         </button>

//         {currentUser && (
//           <div
//             style={{
//               marginTop: "10px",
//               padding: "10px",
//               background: "#e8f5e9",
//             }}
//           >
//             <strong>{t("testAPI.auth.currentUserAPI")}</strong>
//             <pre>{JSON.stringify(currentUser, null, 2)}</pre>
//           </div>
//         )}

//         {allUsers?.users && (
//           <div
//             style={{
//               marginTop: "10px",
//               padding: "10px",
//               background: "#e3f2fd",
//             }}
//           >
//             <strong>
//               {t("testAPI.auth.allUsers")} ({allUsers.users.length}):
//             </strong>
//             <pre>{JSON.stringify(allUsers.users, null, 2)}</pre>
//           </div>
//         )}
//       </div>

//       {/* Notifications Tests */}
//       <div style={{ marginBottom: "30px" }}>
//         <h2>{t("testAPI.notifications.title")}</h2>

//         <button
//           onClick={() => {
//             if (user?.uuid) {
//               sendNotification.mutate({
//                 userId: user.uuid,
//                 notification: {
//                   title: t("testAPI.notifications.testNotification"),
//                   message: `${t(
//                     "testAPI.notifications.sentAt"
//                   )} ${new Date().toLocaleTimeString()}`,
//                   type: "email",
//                 },
//               });
//             }
//           }}
//           disabled={!user?.uuid || sendNotification.isPending}
//           style={{ marginRight: "10px", padding: "5px 10px" }}
//         >
//           {sendNotification.isPending ? "⏳" : "📧"}{" "}
//           {t("testAPI.notifications.sendEmail")}
//         </button>

//         <button
//           onClick={() => {
//             if (user?.uuid) {
//               updateSettings.mutate({
//                 userId: user.uuid,
//                 settings: {
//                   email_notifications: !settings?.email_notifications,
//                 },
//               });
//             }
//           }}
//           disabled={!user?.uuid || updateSettings.isPending}
//           style={{ padding: "5px 10px" }}
//         >
//           {updateSettings.isPending ? "⏳" : "⚙️"}{" "}
//           {t("testAPI.notifications.toggleSettings")}
//         </button>

//         {settings && (
//           <div
//             style={{
//               marginTop: "10px",
//               padding: "10px",
//               background: "#fff3e0",
//             }}
//           >
//             <strong>{t("testAPI.notifications.settings")}</strong>
//             <pre>{JSON.stringify(settings, null, 2)}</pre>
//           </div>
//         )}

//         {notifications?.notifications && (
//           <div
//             style={{
//               marginTop: "10px",
//               padding: "10px",
//               background: "#fce4ec",
//             }}
//           >
//             <strong>
//               {t("testAPI.notifications.list")} (
//               {notifications.notifications.length}):
//             </strong>
//             <pre>{JSON.stringify(notifications.notifications, null, 2)}</pre>
//           </div>
//         )}
//       </div>

//       {/* Console Reminder */}
//       <div
//         style={{ background: "#ffeb3b", padding: "15px", borderRadius: "5px" }}
//       >
//         <strong>{t("testAPI.tip.title")}</strong> {t("testAPI.tip.description")}
//       </div>
//     </div>
//   );
// }
