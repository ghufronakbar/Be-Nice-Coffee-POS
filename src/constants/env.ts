export const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  SESSION_SECRET: process.env.SESSION_SECRET ?? "setup-session-secret-change-me",
  SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME ?? "be_nice_coffee_session",
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
} as const
