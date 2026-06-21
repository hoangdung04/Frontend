// Tự động nhận diện: Nếu đang mở ở localhost máy cá nhân thì gọi về localhost:3001
// Nếu đang mở ở web online thì gọi về link Render online
export const BACKEND_URL = 
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3001"
    : "https://tourvn-backend.onrender.com"; // Thay đường dẫn Render thực tế của anh/chị vào đây khi deploy
